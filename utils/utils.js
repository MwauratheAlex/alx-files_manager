import sha1 from 'sha1';
import dbClient from './db';
import redisClient from './redis';

export function getAuthHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  if (!(typeof authHeader === 'string')) return null;
  return authHeader;
}

export function getAuthData(authHeader) {
  const authData = authHeader.split(' ');
  if (authData.length !== 2 || authData[0] !== 'Basic') {
    return null;
  }
  return authData[1];
}

export function getUserData(authData) {
  const userData = Buffer.from(authData, 'base64').toString('utf8').split(':');
  if (userData.length !== 2) return null;
  return { email: userData[0], password: userData[1] };
}

export async function getUser(email, password) {
  const user = await dbClient.userCollection.findOne({ email });
  if (!user) return null;
  const hashedPassword = sha1(password);
  if (user.password !== hashedPassword) return null;
  return user;
}

/**
 * @param {Express.Request} req The request object.
 */
export async function getUserIdBasedOnToken(req) {
  const authToken = req.headers['x-token'];
  if (!authToken) return null;
  const userId = await redisClient.get(`auth_${authToken}`);
  if (!userId) return null;
  return userId;
}
