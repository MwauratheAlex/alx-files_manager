import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
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
    if (type === 'file' || type === 'image') {
      const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
      try {
        await fs.mkdir(filePath, { recursive: true });
      } catch (error) {
        // skip error if file already exists
      }
      const filename = uuidv4();
      const localPath = `${filePath}/${filename}`;
      newFile.localPath = localPath;
      await fs.writeFile(localPath, Buffer.from(data, 'base64'), 'utf8');
    }

    return res.status(200).json('hello world');
  }
}

export default FilesController;
