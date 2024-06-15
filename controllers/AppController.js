import redisClient from '../utils/redis';
import dbClient from '../utils/db';

// eslint-disable-next-line no-unused-vars
const express = require('express');

class AppController {
  /**
  * @param {express.Request} _
  * @param {express.Response} res
  */
  static getStatus(_, res) {
    res.status(200).json({
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    });
  }

  /**
  * @param {express.Request} _
  * @param {express.Response} res
  */
  static async getStats(_, res) {
    res.status(200).json({
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    });
  }
}

export default AppController;
