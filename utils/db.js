import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    this.url = `mongodb://${host}:${port}/${database}`;
    this.client = new MongoClient(this.url);

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
    return this.client.db().collection('users').countDocuments();
  }

  /**
   * @returns {number} the number of documents in the collection files
   */
  async nbFiles() {
    return this.client.db().collection('files').countDocuments();
  }

  get collection() {
    return (collection) => this.client.db().collection(collection);
  }

  /**
  * @returns {Collection}
  */
  get userCollection() {
    return this.client.db().collection('users');
  }

  /**
  * @returns {Collection}
  */
  get fileCollection() {
    return this.client.db().collection('files');
  }
}

const dbClient = new DBClient();
export default dbClient;
