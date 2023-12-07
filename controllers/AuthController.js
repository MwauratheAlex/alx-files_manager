import dbClient from '../utils/db';
import { redisClient } from '../utils/redis';
import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';


class AuthController {
    static async getConnect(req, res) {
      const authorization = req.header('Authorization');
      if (!authorization) {
        res.status(401).json({error: 'Unauthorized'});
        return;
      }

      const authString = authorization.split(' ')[1];
      const userCredentials = atob(authString).split(':');

      const email = userCredentials[0];
      const password = userCredentials[1];

      if (!(email && password)) {
          res.status(401).json({error: 'Unauthorized'});
          return;
      }

      const user = await dbClient.userCollection.findOne({
        email: email,
        password: sha1(password)
      });

      if (!user) {
        res.status(401).json({error: 'Unauthorized'});
        return;
      }

      const token = uuidv4();
      const key = `auth_${token}`;
      console.log(user.email, user._id);
      await redisClient.set(key, user._id, 86400);

      res.status(200).json({ token: token });
    }

    static async getDisconnect(req, res) {
    }
}

export default AuthController;
