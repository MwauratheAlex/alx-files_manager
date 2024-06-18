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
    if (!userId) return null;

    const user = await dbClient
      .db.collection('users')
      .findOne({ _id: new ObjectId(String(userId)) });
    if (!user) return null;

    return user;
  }

  /**
   * Fetch document with id from db
  * @param {String} id
  */
  static async getDocumentById(id) {
    if (!id) return null;

    const document = await dbClient.db.collection('files').findOne({
      _id: new ObjectId(String(id)),
    });

    return document;
  }
}

export default Utils;
