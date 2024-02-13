import sha1 from 'sha1';
import dbClient from './db';

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
  // eslint-disable-next-line no-undef
  const userData = atob(authData).split(':');
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
