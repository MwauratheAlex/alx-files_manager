import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.clientConnected = false;

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

  /**
   * @param {string} key
   * returns the value for the key
   */
  async get(key) {
    const asyncGet = promisify(this.client.get).bind(this.client);
    const value = await asyncGet(key);
    return value;
  }

  /**
   * Stores value for key in redis,
   * to expire after the specified duration
  * @param {string} key
  * @param {any} value
  * @param {number} duration  - time in seconds
  */
  async set(key, value, duration) {
    const asyncSet = promisify(this.client.set).bind(this.client);
    await asyncSet(key, value, 'EX', duration);
  }

  async del(key) {
    const asyncDel = promisify(this.client.del).bind(this.client);
    await asyncDel(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
