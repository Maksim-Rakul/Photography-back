import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { Session } from '../models/session.js';
import jwt from 'jsonwebtoken';

// export const registerUser = async (req, res) => {
//   const { email, password } = req.body;

//   const existingUser = await User.findOne({ email });

//   if (existingUser) {
//     throw createHttpError(400, 'Email in use');
//   }

//   const hashedPassword = await bcrypt.hash(password, 10);

//   const newUser = await User.create({
//     email,
//     password: hashedPassword,
//   });

//   const newSession = await createSession(newUser._id);

//   setSessionCookies(res, newSession);

//   res.status(200).json({
//     id: newUser._id,
//     email: newUser.email,
//   });
// };

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw createHttpError(401, 'Invalid credentials');
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw createHttpError(401, 'Invalid credentials');
  }

  await Session.deleteOne({ userId: user._id });

  const newSession = await createSession(user._id);

  setSessionCookies(res, newSession);

  res.status(200).json(user);
};

export const logoutUser = async (req, res) => {
  const { sessionId } = req.cookies;

  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });

    res.clearCookie('sessionId');
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(204).send();
  }
};

export const refreshUserSession = async (req, res) => {
  const session = await Session.findOne({
    refreshToken: req.cookies.refreshToken,
  });

  if (!session) {
    throw createHttpError(401, 'Session not found');
  }

  const isSessionTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);

  if (isSessionTokenExpired) {
    throw createHttpError(401, 'Session token expired');
  }

  await Session.deleteOne({
    _id: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });

  const newSession = await createSession(session.userId);
  setSessionCookies(res, newSession);

  res.status(200).json({
    message: 'Session refreshed',
  });
};

export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Перевірка через змінні середовища (безпечніше)
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('ADMIN_EMAIL or ADMIN_PASSWORD not set in environment');
      throw createHttpError(500, 'Admin credentials not configured');
    }

    if (email !== adminEmail || password !== adminPassword) {
      throw createHttpError(401, 'Невірний email або пароль');
    }

    // Створення JWT токену
    const token = jwt.sign(
      {
        email: adminEmail,
        role: 'admin',
        type: 'admin_access',
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.json({
      token,
      email: adminEmail,
      message: 'Успішний вхід в адмін-панель',
    });
  } catch (error) {
    next(error);
  }
};

// НОВА ФУНКЦІЯ: Перевірка токену
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createHttpError(401, 'Токен не надано');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw createHttpError(401, 'Токен не надано');
    }

    // Перевірка токену
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Додаткова перевірка: чи це адмін-токен
    if (decoded.role !== 'admin') {
      throw createHttpError(403, 'Недостатньо прав');
    }

    res.json({
      valid: true,
      user: {
        email: decoded.email,
        role: decoded.role,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(createHttpError(401, 'Невірний токен'));
    } else if (error.name === 'TokenExpiredError') {
      next(createHttpError(401, 'Токен застарів'));
    } else {
      next(error);
    }
  }
};
