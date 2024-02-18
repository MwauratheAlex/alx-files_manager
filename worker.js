import Queue from 'bull';
import imageThumbnail from 'image-thumbnail';
import { ObjectId } from 'mongodb';
import fs from 'fs/promises';
import dbClient from './utils/db';

const fileQueue = new Queue('Image thumbnails generation queue');

async function generateThumbnails(filePath, fileSize) {
  console.log(`Generating thumbnail: ${filePath}_${fileSize}`);
  try {
    const imageBuffer = await imageThumbnail(filePath, { width: fileSize });
    return fs.writeFile(`${filePath}_${fileSize}`, imageBuffer);
  } catch (error) {
    console.log(error);
  }
  return null;
}

fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;
  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const filter = {
    _id: new ObjectId(String(fileId)),
    userId: new ObjectId(String(userId)),
  };
  const file = await dbClient.fileCollection.findOne(filter);
  if (!file) throw new Error('File not found');
  const thumbnailSizes = [100, 250, 500];
  await Promise.all(thumbnailSizes.map((size) => generateThumbnails(file.localPath, size)));
  done();
});
