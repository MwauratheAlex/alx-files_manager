import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}/${database}`;
    this.client = new MongoClient(url);
  }

  /**
  * @returns {boolean} true when the connection to MongoDB is a success,
  * otherwise, false
  */
  isAlive() {
    return this.isConnected || true;
  }

  /**
   * @returns {number} the number of documents in the collection users
   */
  async nbUsers() {
    const userCount = await this.client.db().collection('users').countDocuments();
    return userCount;
  }

  /**
   * @returns {number} the number of documents in the collection files
   */
  async nbFiles() {
    const fileCount = await this.client.db().collection('files').countDocuments();
    return fileCount;
  }
}

const dbClient = new DBClient();
export default dbClient;
