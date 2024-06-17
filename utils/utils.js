import { ObjectId } from 'mongodb';
import redisClient from './redis';
import dbClient from './db';

// eslint-disable-next-line no-unused-vars
const express = require('express');

class Utils {
  /**
  * @param {express.Request} req
  */
  static async getLoggedInUser(req) {
    const token = req.headers['x-token'];
    if (!token) return null;

    const userId = await redisClient.get(`auth_${token}`);
    if (!token) return null;

    const user = await dbClient
      .db.collection('users')
      .findOne({ _id: new ObjectId(String(userId)) });
    if (!token) return null;

    return user;
  }
}

export default Utils;