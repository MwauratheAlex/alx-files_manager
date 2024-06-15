import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import { constrainedMemory } from 'process';
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

    if (!(type && acceptedTypes.includes(type))) {
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

      console.log(file);
      if (file.type !== 'folder') {
        res.status(400).json({ error: 'Parent is not a folder' });
        return;
      }
    }

    const newFile = {
      userId: user._id.toString(),
      name,
      type,
      isPublic: Boolean(isPublic),
      parentId: parentId || 0,
    };

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

    if (!fs.existsSync(folderPath)) {
      fs.mkdir(folderPath, (err) => {
        if (err) console.log(`error making folder: ${err}`);
      });
    }

    fs.writeFile(
      `${folderPath}/${filePath}`,
      Buffer.from(data, 'base64').toString(), (err) => {
        if (err) console.log(`error writing file: ${err}`);
      },
    );

    insertedFile = await dbClient.db.collection('files').insertOne({
      ...newFile,
      localPath: `${folderPath}/${filePath}`,
    });

    delete newFile._id;

    newFile.id = insertedFile.insertedId.toString();

    res.status(201).json(newFile);
  }
}

export default FilesController;
