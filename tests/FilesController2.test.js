import chai from 'chai';
import chaiHttp from 'chai-http';

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

import { MongoClient, ObjectId } from 'mongodb';
import { promisify } from 'util';
import redis from 'redis';
import sha1 from 'sha1';

chai.use(chaiHttp);

describe('GET /files', () => {
  let testClientDb;
  let testRedisClient;
  let redisDelAsync;
  let redisGetAsync;
  let redisSetAsync;
  let redisKeysAsync;

  let initialUser = null;
  let initialUserId = null;
  let initialUserToken = null;

  let initialFileId = null;
  let initialFileContent = null;

  const folderTmpFilesManagerPath = process.env.FOLDER_PATH || '/tmp/files_manager';

  const fctRandomString = () => {
    return Math.random().toString(36).substring(2, 15);
  }
  const fctRemoveAllRedisKeys = async () => {
    const keys = await redisKeysAsync('auth_*');
    keys.forEach(async (key) => {
        await redisDelAsync(key);
    });
  }
  const fctCreateTmp = () => {
    if (!fs.existsSync(folderTmpFilesManagerPath)) {
      fs.mkdirSync(folderTmpFilesManagerPath);
    }
  }
  const fctRemoveTmp = () => {
    if (fs.existsSync(folderTmpFilesManagerPath)) {
      fs.readdirSync(`${folderTmpFilesManagerPath}/`).forEach((i) => {
        fs.unlinkSync(`${folderTmpFilesManagerPath}/${i}`)
      })
    }
  }

  beforeEach(() => {
    const dbInfo = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 27017,
      database: process.env.DB_DATABASE || 'files_manager'
    };
    
    testClientDb = new MongoClient(`mongodb://${dbInfo.host}:${dbInfo.port}/${dbInfo.database}`);
    return new Promise((resolve) => {
      testClientDb
        .connect()
        .then(async () => {
          await testClientDb.db().collection('users').deleteMany({});
          await testClientDb.db().collection('files').deleteMany({});
          // Add 1 user
          initialUser = { 
            email: `${fctRandomString()}@me.com`,
            password: sha1(fctRandomString())
          }
          const createdDocs = await testClientDb.db().collection('users').insertOne(initialUser);
          if (createdDocs) initialUserId = createdDocs.insertedId.toString();
          
          // Add 1 file
          fctCreateTmp();
          const fileLocalPath = `${folderTmpFilesManagerPath}/${uuidv4()}`;
          initialFileContent = `Hello-${uuidv4()}`;
          fs.writeFileSync(fileLocalPath, initialFileContent);

          const initialFile = { 
            userId: new ObjectId(String(initialUserId)), 
            name: fctRandomString(), 
            type: "file", 
            parentId: '0',
            isPublic: false,
            localPath: fileLocalPath
          };
          const createdFileDocs = await testClientDb.db().collection('files').insertOne(initialFile);
          if (createdFileDocs) {
            initialFileId = createdFileDocs.insertedId.toString();
          } 
          testRedisClient = redis.createClient();
          redisDelAsync = promisify(testRedisClient.del).bind(testRedisClient);
          redisGetAsync = promisify(testRedisClient.get).bind(testRedisClient);
          redisSetAsync = promisify(testRedisClient.set).bind(testRedisClient);
          redisKeysAsync = promisify(testRedisClient.keys).bind(testRedisClient);
          testRedisClient.on('connect', async () => {
            fctRemoveAllRedisKeys();
            // Set token for this user
            initialUserToken = uuidv4()
            await redisSetAsync(`auth_${initialUserToken}`, initialUserId)
            resolve();
          });
        })
    });
  });
  afterEach(() => {
    fctRemoveAllRedisKeys();
    fctRemoveTmp();
  });
  it('POST /files creates a folder at the root', (done) => {
    chai.request('http://localhost:5000')
      .get(`/files/${initialFileId}/data`)
      .set('X-Token', initialUserToken)
      .buffer()
      .parse((res, cb) => {
        res.setEncoding("binary");
        res.data = "";
        res.on("data", (chunk) => {
            res.data += chunk;
        });
        res.on("end", () => {
            cb(null, new Buffer(res.data, "binary"));
        });
      })
      .end(async (err, res) => {
        chai.expect(err).to.be.null;
        chai.expect(res).to.have.status(200);
        chai.expect(res.body.toString()).to.equal(initialFileContent);
        done();
      });
  }).timeout(30000);
});
