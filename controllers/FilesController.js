import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import { log } from 'console';
import { MIMEType } from 'util';
import { contentType } from 'mime-types';
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
    const document = await Utils.getUserDocumentById(user._id.toString(), id);
    if (!document) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    delete document._id;
    document.id = id;

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

    let { page, parentId } = req.query;
    if (parentId) {
      parentId = new ObjectId(parentId);
      const parentDocument = await dbClient.db.collection('files').findOne({
        _id: parentId,
      });
      if (!parentDocument) {
        res.json([]);
        return;
      }
    }

    if (parentId === '0') parentId = 0;

    // pagination
    page = parseInt(page, 10);
    if (!page) page = 0;
    const pageSize = 20;
    const pageStart = page * pageSize;

    const filter = {
      userId: user._id,
    };

    if (parentId || parentId === 0) filter.parentId = parentId;

    const documents = await dbClient.db.collection('files').aggregate([
      { $match: filter },
      { $limit: pageSize },
      { $sort: { _id: -1 } },
      { $skip: pageStart },
      { $addFields: { id: '$_id' } },
      { $project: { _id: 0 } },
    ]).toArray();

    res.status(200).json(documents);
  }

  /**
  * @param {express.Request} req
  * @param {express.Response} res
  */
  static async putPublish(req, res) {
    const user = await Utils.getLoggedInUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const document = await Utils.getUserDocumentById(user._id.toString(), id);
    if (!document) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    await dbClient.db.collection('files').updateOne(
      { _id: document._id }, { $set: { isPublic: true } },
    );

    document.id = document._id;
    delete document._id;
    document.isPublic = true;

    res.status(200).json(document);
  }

  /**
  * @param {express.Request} req
  * @param {express.Response} res
  */
  static async putUnpublish(req, res) {
    const user = await Utils.getLoggedInUser(req);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const document = await Utils.getUserDocumentById(user._id.toString(), id);
    if (!document) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    await dbClient.db.collection('files').updateOne(
      { _id: document._id }, { $set: { isPublic: false } },
    );

    document.id = document._id;
    delete document._id;
    document.isPublic = false;

    res.status(200).json(document);
  }

  /**
  * @param {express.Request} req
  * @param {express.Response} res
  */
  static async getFile(req, res) {
    const { id } = req.params;
    const document = await Utils.getDocumentById(id);
    if (!document) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (!document.isPublic) {
      const user = await Utils.getLoggedInUser(req);
      if (!user || document.userId.toString() !== user._id.toString()) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
    }
    if (document.type === 'folder') {
      res.status(400).json({ error: "A folder doesn't have content" });
      return;
    }

    if (!fs.existsSync(document.localPath)) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    fs.readFile(document.localPath, (err, data) => {
      if (err) {
        console.log(`Error reading file ${err}`);
        res.status(404).json({ error: 'Not found' });
      } else {
        res.setHeader('Content-type', contentType(document.name) || 'text/plain; charset=utf-8');
        res.status(200).send(data);
      }
    });
  }
}

export default FilesController;
