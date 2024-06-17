import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import Utils from '../utils/utils';

// eslint-disable-next-line no-unused-vars
const express = require('express');
const fs = require('fs');

class FilesController {
  /**
  * @param {express.Request} req
  * @param {express.Response} res
  */
  static async postUpload(req, res) {
    const user = await Utils.getLoggedInUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const acceptedTypes = ['folder', 'file', 'image'];

    const {
      name, type, parentId, isPublic, data,
    } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Missing name' });
      return;
    }

    if (!type || !acceptedTypes.includes(type)) {
      res.status(400).json({ error: 'Missing type' });
      return;
    }

    if (!data && type !== 'folder') {
      res.status(400).json({ error: 'Missing data' });
      return;
    }

    if (parentId) {
      const file = await dbClient.db
        .collection('files').findOne({ _id: new ObjectId(String(parentId)) });
      if (!file) {
        res.status(400).json({ error: 'Parent not found' });
        return;
      }

      if (file.type !== 'folder') {
        res.status(400).json({ error: 'Parent is not a folder' });
        return;
      }
    }

    const newFile = {
      userId: user._id,
      name,
      type,
      isPublic: Boolean(isPublic),
      parentId: 0,
    };

    if (parentId) newFile.parentId = new ObjectId(String(parentId));

    let insertedFile;
    if (type === 'folder') {
      insertedFile = await dbClient.db.collection('files').insertOne(newFile);
      newFile.id = insertedFile.insertedId.toString();
      delete newFile._id;
      res.status(201).json(newFile);

      return;
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const filePath = uuidv4();

    try {
      fs.mkdir(folderPath);
    } catch (_) {
      // do nothing
    }

    try {
      fs.writeFile(
        `${folderPath}/${filePath}`,
        Buffer.from(data, 'base64').toString(), 'utf8',
      );
    } catch (_) {
      // do nothing
    }

    insertedFile = await dbClient.db.collection('files').insertOne({
      ...newFile,
      localPath: `${folderPath}/${filePath}`,
    });

    delete newFile._id;

    newFile.id = insertedFile.insertedId.toString();

    res.status(201).json(newFile);
  }

  /**
  * @param {express.Request} req
  * @param {express.Response} res
  */
  static async getShow(req, res) {
    const user = await Utils.getLoggedInUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const document = await Utils.getDocumentById(id);
    if (!document) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    res.status(200).json(document);
  }

  /**
  * @param {express.Request} req
  * @param {express.Response} res
  */
  static async getIndex(req, res) {
    const user = await Utils.getLoggedInUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    res.json();
  }
}

export default FilesController;
