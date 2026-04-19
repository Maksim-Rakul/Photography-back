import createHttpError from 'http-errors';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';
import jwt from 'jsonwebtoken';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Спочатку перевіряємо заголовок Authorization (для адмін-панелі)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];

      // Перевіряємо JWT токен для адмінів
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role !== 'admin') {
        throw createHttpError(403, 'Admin access required');
      }

      req.userId = decoded.userId;
      req.user = decoded;
      return next();
    }

    // 2. Якщо немає Bearer токена, перевіряємо cookies (для звичайних користувачів)
    if (req.cookies.accessToken) {
      const session = await Session.findOne({
        accessToken: req.cookies.accessToken,
      });

      if (!session) {
        throw createHttpError(401, 'Session not found');
      }

      const isAccessTokenExpired =
        new Date() > new Date(session.accessTokenValidUntil);

      if (isAccessTokenExpired) {
        throw createHttpError(401, 'Access token expired');
      }

      const user = await User.findById(session.userId);

      if (!user) {
        throw createHttpError(401, 'User not found');
      }

      req.userId = session.userId;
      return next();
    }

    // 3. Якщо немає нічого
    throw createHttpError(401, 'Missing access token');
  } catch (error) {
    next(error);
  }
};
