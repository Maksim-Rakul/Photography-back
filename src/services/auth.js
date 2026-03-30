import crypto from 'crypto';
import { FIFTEEN_MINUTES, ONE_DAY } from '../constants/time.js';
import { Session } from '../models/session.js';

export const createSession = async (userId) => {
  const accessToken = crypto.randomBytes(30).toString('hex');
  const refreshToken = crypto.randomBytes(30).toString('hex');

  return Session.create({
    userId,
    accessToken,
    refreshToken,
    accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
    refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
  });
};

const isProd = process.env.NODE_ENV === 'production';

export const setSessionCookies = (res, session) => {
  res.cookie('accessToken', session.accessToken, {
    httpOnly: true,
    secure: isProd, // ❗
    sameSite: isProd ? 'none' : 'lax', // ❗
    maxAge: ONE_DAY,
  });

  res.cookie('refreshToken', session.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: ONE_DAY,
  });

  res.cookie('sessionId', session._id, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'none',
    maxAge: ONE_DAY,
  });
};
