import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import Utils from '../utils/utils';

const sha1 = require('sha1');
// eslint-disable-next-line no-unused-vars
const express = require('express');

class AuthController {
  /**
   * @param {express.Request} req
  * @param {express.Response} res
  */
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [authType, encodedUserData] = authHeader.split(' ');
    if (authType !== 'Basic' || !encodedUserData) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const decodedUserData = Buffer.from(encodedUserData, 'base64').toString();
    const [email, password] = decodedUserData.split(':');

    if (!(email && password)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const hashedPassword = sha1(password);

    const user = await dbClient.db.collection('users').findOne({
      email,
      password: hashedPassword,
    });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = uuidv4();
    const key = `auth_${token}`;

    await redisClient.set(key, user._id.toString(), 24 * 60 * 60);

    res.status(200).json({ token });
  }

  /**
   * @param {express.Request} req
  * @param {express.Response} res
  */
  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await redisClient.del(key);

    res.status(204).json();
  }

  /**
   * @param {express.Request} req
  * @param {express.Response} res
  */
  static async getMe(req, res) {
    const loggedInUser = await Utils.getLoggedInUser(req);

    if (!loggedInUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    res.status(200).json({
      id: loggedInUser._id.toString(),
      email: loggedInUser.email,
    });
  }
}

export default AuthController;
