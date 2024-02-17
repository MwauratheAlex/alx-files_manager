import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { getUserIdBasedOnToken } from '../utils/utils';

class FilesController {
  static async postUpload(req, res) {
    const authToken = req.headers['x-token'];
    if (!authToken) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${authToken}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name, type, parentId, isPublic, data,
    } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });

    const acceptedTypes = ['folder', 'file', 'image'];
    if (!type || !acceptedTypes.includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId) {
      const parentFile = await dbClient
        .fileCollection.findOne({ _id: new ObjectId(String(parentId)) });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const newFile = {
      userId: new ObjectId(String(userId)),
      name,
      type,
      isPublic: false,
      parentId: '0',
    };
    if (isPublic) newFile.isPublic = isPublic;
    if (parentId) newFile.parentId = new ObjectId(String(parentId));
    if (type === 'file' || type === 'image') {
      const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
      try {
        await fs.mkdir(filePath);
      } catch (error) {
        // skip error if file already exists
      }
      const filename = uuidv4();
      const localPath = `${filePath}/${filename}`;
      newFile.localPath = localPath;

      try {
        await fs.writeFile(localPath, Buffer.from(data, 'base64'), 'utf8');
      } catch (error) {
        console.log(error);
      }
    }
    const result = await dbClient.fileCollection.insertOne(newFile);
    return res.status(201).json({
      id: result.insertedId,
      userId,
      name,
      type,
      isPublic: newFile.isPublic,
      parentId: newFile.parentId.toString(),
    });
  }

  static async getShow(req, res) {
    const userId = await getUserIdBasedOnToken(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    console.log('here');
    const file = await dbClient
      .fileCollection
      .findOne({ _id: new ObjectId(String(id)), userId: new ObjectId(String(userId)) });
    if (!file) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({
      id,
      userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId.toString(),
    });
  }

  /**
   * @param {Express.Request} req The request object.
   * @param {Express.Response} res The response object.
   */
  static async getIndex(req, res) {
    const userId = await getUserIdBasedOnToken(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    let { parentId, page } = req.query;
    if (parentId) {
      parentId = new ObjectId(String(parentId));
      const parentFile = await dbClient.fileCollection
        .findOne({ _id: parentId });
      if (!parentFile) return res.json([]);
    }

    if (!parentId) parentId = '0';
    page = parseInt(page, 10);
    if (!page) page = 0;
    const pageSize = 20;
    const pageStart = page * pageSize;

    const filter = {
      userId: new ObjectId(String(userId)),
      parentId,
    };
    const files = await dbClient
      .fileCollection
      .aggregate([
        { $match: filter },
        { $sort: { _id: -1 } },
        { $skip: pageStart },
        { $limit: pageSize },
        {
          $project: {
            _id: 0,
            id: '$_id',
            userId: '$userId',
            name: '$name',
            type: '$type',
            isPublic: '$isPublic',
            parentId: '$parentId',
          },
        },
      ]).toArray();
    return res.json(files);
  }
}

export default FilesController;
