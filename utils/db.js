import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '27017';
    const dbName = process.env.DB_DATABASE || 'files_manager';

    const dbUrl = `mongodb://${dbHost}:${dbPort}`;

    this.client = new MongoClient(dbUrl);
    this.dbConnected = false;

    this.client.connect()
      .then(() => {
        this.dbConnected = true;
        this.db = this.client.db(dbName);
      }).catch((error) => {
        console.log(`Error connecting to database: ${error}`);
        this.dbConnected = false;
      });
  }

  isAlive() {
    return this.dbConnected;
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();

export default dbClient;
