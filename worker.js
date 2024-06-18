import Utils from './utils/utils';

const Queue = require('bull');
const imageThubnail = require('image-thumbnail');
const fs = require('fs');

const fileQueue = new Queue('fileQueue');

async function generateThumbnails(filepath, filesize) {
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

export default fileQueue;
