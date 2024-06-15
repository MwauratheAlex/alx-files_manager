import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.clientConnected = false;

    this.asyncGet = promisify(this.client.get).bind(this.client);
    this.asyncSet = promisify(this.client.set).bind(this.client);
    this.asyncDel = promisify(this.client.del).bind(this.client);

    this.client
      .on('error', (error) => {
        console.log(`RedisClient Error: ${error}`);
      })
      .on('ready', () => {
        this.clientConnected = true;
      })
      .on('end', () => {
        this.clientConnected = false;
      });
  }

  isAlive() {
    return this.clientConnected;
  }

  async get(key) {
    const value = await this.asyncGet(key);
    return value;
  }

  async set(key, value, duration) {
    await this.asyncSet(key, value, 'EX', duration);
  }

  async del(key) {
    await this.asyncDel(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
