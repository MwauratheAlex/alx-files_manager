import sha1 from 'sha1';
import { dbClient } from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email } = req.body;
    const { password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    const user = await dbClient.userCollection.findOne({ email });
    if (user) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }

    const hashedPassword = sha1(password);
    const insertResult = await dbClient.userCollection.insertOne({
      email,
      password: hashedPassword,
    });

    res.status(201).json({ id: insertResult.insertedId, email });
  }

  async getMe(req, res) {
  }
}

export default UsersController;
