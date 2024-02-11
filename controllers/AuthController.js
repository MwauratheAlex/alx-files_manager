import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    if (!(typeof authHeader === 'string')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const authData = authHeader.split(' ');
    if (authData.length !== 2 || authData[0] !== 'Basic') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // eslint-disable-next-line no-undef
    const userData = atob(authData[1]).split(':');

    if (userData.length !== 2) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [email, password] = userData;
    const user = await dbClient.collection('users').findOne({ email });
    const hashedPassword = sha1(password);
    if (user.password !== hashedPassword) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const key = `auth_${token}`;
    const userId = user._id.toString();
    const duration = 24 * 60 * 60;

    redisClient.set(key, userId, duration);

    return res.status(201).json({ token });
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
      .collection('users')
      .findOne({ _id: new ObjectId(userId) });

    return res.status(200).json({ id: user._id, email: user.email });
  }
}

export default AuthController;
