// middleware/requireAdmin.js
import { User } from '../models/user.js';
import createHttpError from 'http-errors';

export const requireAdmin = async (req, res, next) => {
  try {
    let user = null;
    let userId = null;

    // 1. Перевіряємо JWT адмін-токен (з заголовка Authorization)
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // 2. Перевіряємо звичайну сесію (з cookies)
    if (req.userId) {
      userId = req.userId;
      user = await User.findById(userId);

      if (user && user.role === 'admin') {
        return next();
      }
    }

    // 3. Якщо нічого не підійшло
    throw createHttpError(403, 'Admin access required');
  } catch (error) {
    next(error);
  }
};
