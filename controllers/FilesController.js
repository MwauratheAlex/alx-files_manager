import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

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
      userId,
      name,
      type,
      isPublic: false,
      parentId: 0,
    };
    if (isPublic) newFile.isPublic = isPublic;
    if (parentId) newFile.parentId = parentId;

    return res.status(200).json('hello world');
  }
}

export default FilesController;
