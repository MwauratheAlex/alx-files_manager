import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static status(_, res) {
    res.status(200).send({
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    });
  }

  static async stats(_, res) {
    Promise.all([dbClient.nbUsers(), dbClient.nbFiles()])
      .then(([nbUsers, nbFiles]) => res.status(200).send({
        users: nbUsers,
        files: nbFiles,
      }))
      .catch((err) => res.status(500).send({ Error: err }));
  }
}

export default AppController;
