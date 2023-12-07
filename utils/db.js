import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const dbInfo = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 27017,
      db: process.env.DB_DATABASE || 'files_manager',
    };

    const url = `mongodb://${dbInfo.host}:${dbInfo.port}`;

    MongoClient.connect(url, (err, client) => {
      if (err) {
        this.db = null;
      } else {
        this.db = client.db(dbInfo.db);
        this.userCollection = this.db.collection('users');
        this.fileCollection = this.db.collection('files');
      }
    });

    // this.client = new MongoClient(url, { useUnifiedTopology: true });
    // this.client.connect().then(() => {
    // this.userCollection = this.client.db().collection('users');
    // this.fileCollection = this.client.db().collection('files');
    // });
  }

  isAlive() {
    // return this.client.isConnected();
    return Boolean(this.db);
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}

export const dbClient = new DBClient();
export default dbClient;
