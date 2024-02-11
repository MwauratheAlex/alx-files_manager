import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';

    this.url = `mongodb://${this.host}:${this.port}`;
    this.client = new MongoClient(this.url);
    this.db = this.client.db(this.database);

    this.isConnected = false;
    this.client.connect()
      .then(() => { this.isConnected = true; })
      .catch(() => { this.isConnected = false; });

    this.client.on('close', () => { this.isConnected = false; });
    this.client.on('error', () => { this.isConnected = false; });
  }

  /**
  * @returns {boolean} true when the connection to MongoDB is a success,
  * otherwise, false
  */
  isAlive() {
    return this.isConnected;
  }

  /**
   * @returns {number} the number of documents in the collection users
   */
  async nbUsers() {
    const userCount = await this.db.collection('users').countDocuments();
    return userCount;
  }

  /**
   * @returns {number} the number of documents in the collection files
   */
  async nbFiles() {
    const fileCount = await this.db.collection('files').countDocuments();
    return fileCount;
  }
}

const dbClient = new DBClient();
export default dbClient;
