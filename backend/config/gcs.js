const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage({
  keyFilename: path.join(__dirname, '../../serviceAccountKey.json'),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

module.exports = { storage, bucket };
