import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import {
  getAuthHeader,
  getAuthData,
  getUserData,
  getUser,
} from '../utils/utils';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = getAuthHeader(req);
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const authData = getAuthData(authHeader);
    if (!authData) return res.status(401).json({ error: 'Unauthorized' });

    const userData = getUserData(authData);
    if (!userData) return res.status(401).json({ error: 'Unauthorized' });

    const { email, password } = userData;
    const user = await getUser(email, password);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const token = uuidv4();
    const key = `auth_${token}`;
    const userId = user._id.toString();
    const duration = 24 * 60 * 60;
    redisClient.set(key, userId, duration);

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await redisClient.del(`auth_${token}`);

    return res.status(204).json();
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await dbClient
      .userCollection
      .findOne({ _id: new ObjectId(userId) });

    return res.status(200).json({ id: user._id, email: user.email });
  }
}

export default AuthController;
