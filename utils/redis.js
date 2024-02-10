import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => console.log(`Unable to create client: ${err}`));

    this.isConnected = false;
    this.client.on('ready', () => {
      this.isConnected = true;
    });
    this.client.on('end', () => {
      this.isConnected = false;
    });
  }

  /**
   * Checks whether redis client is alive or dead
   * @returns {Boolean} true if alive, else false
   */
  isAlive() {
    return this.isConnected;
  }

  /**
   * Returns redis value stored for key.
  * @param {string} key
  * @returns {string}
  */
  async get(key) {
    const getAsync = promisify(this.client.get).bind(this.client);
    const value = await getAsync(key);
    return value;
  }

  /**
   * Stores a value for a key in redis that expires after duration
  * @param {string} key
  * @param {string} value
  * @param {string} duration
  */
  async set(key, value, duration) {
    const setAsync = promisify(this.client.setex).bind(this.client);
    await setAsync(key, duration, value);
  }

  /**
   * Removes value for key in redis
  * @param {string} key
  */
  async del(key) {
    const delAsync = promisify(this.client.del).bind(this.client);
    await delAsync(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
