import { ObjectId } from 'mongodb';
import dbClient from './utils/db';
import Utils from './utils/utils';

const Queue = require('bull');
const imageThubnail = require('image-thumbnail');
const fs = require('fs');

export const fileQueue = new Queue('fileQueue');

export const userQueue = new Queue('userQueue');

async function generateThumbnails(filepath, filesize) {
  console.log(`Generating thumbnail: ${filepath}_${filesize}`);
  const imageBuffer = await imageThubnail(filepath, { width: filesize });
  return fs.writeFile(`${filepath}_${filesize}`, imageBuffer, (err) => {
    if (err) throw err;
  });
}

fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;
  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }

  const document = await Utils.getUserDocumentById(
    fileId, userId,
  );
  if (!document) {
    throw new Error('File not found');
  }

  const widths = [500, 250, 100];
  try {
    await Promise.all(widths.map((w) => generateThumbnails(document.localPath, w)));
  } catch (error) {
    console.log(error);
  }

  done();
});

userQueue.process(async (job, done) => {
  const { userId } = job.data;
  if (!userId) throw new Error('Missing userId');

  const user = await dbClient.db.collection('users').findOne({
    _id: new ObjectId(String(userId)),
  });
  if (!user) throw new Error('User not found');

  console.log(`Welcome ${user.email}`);
  done();
});
