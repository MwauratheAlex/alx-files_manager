import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    const authToken = req.headers['x-token'];
    if (!authToken) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${authToken}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      name,
    } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });
    return res.status(200).json('hello world');
  }
}

export default FilesController;
