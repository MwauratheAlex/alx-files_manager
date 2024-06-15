import dbClient from '../utils/db';

const sha1 = require('sha1');

// eslint-disable-next-line no-unused-vars
const express = require('express');

class UsersController {
  /**
  * @param {express.Request} req
  * @param {express.Response} res
  */
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    const user = await dbClient.db.collection('users').findOne({ email });
    if (user) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }

    const hashedPassword = sha1(password);
    const newUser = await dbClient.db.collection('users').insertOne({
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      id: newUser.insertedId.toString(),
      email,
    });
  }
}

export default UsersController;
