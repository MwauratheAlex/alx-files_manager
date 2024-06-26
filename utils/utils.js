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
    if (!userId || !ObjectId.isValid(userId)) return null;

    const user = await dbClient
      .db.collection('users')
      .findOne({ _id: new ObjectId(String(userId)) });
    if (!user) return null;

    return user;
  }

  /**
   * Fetch document with id from db
  * @param {String} userId
  * @param {String} documentId
  */
  static async getUserDocumentById(userId, documentId) {
    if (!(documentId && userId)) return null;

    if (!(ObjectId.isValid(userId) && ObjectId.isValid(documentId))) {
      return null;
    }

    const document = await dbClient.db.collection('files').findOne({
      _id: new ObjectId(String(documentId)),
      userId: new ObjectId(String(userId)),
    });

    return document;
  }

  static async getDocumentById(documentId) {
    if (!(documentId)) return null;

    if (!(ObjectId.isValid(documentId))) {
      return null;
    }

    const document = await dbClient.db.collection('files').findOne({
      _id: new ObjectId(String(documentId)),
    });

    return document;
  }
}

export default Utils;
