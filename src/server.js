import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { connectMongoDB } from './db/connectMongoDB.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import authRoutes from './routes/authRouter.js';
import imagesRoutes from './routes/imagesRoutes.js';
import adminImagesRoutes from './routes/adminImagesRouter.js';
import emailRoutes from './routes/emailRouter.js';
import { errors } from 'celebrate';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 30001;

// ========== НАЛАШТУВАННЯ CORS (ПОВИННО БУТИ ПЕРШИМ!) ==========
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://www.stanislavkochubey.cz',
    'https://stanislavkochubey.cz',
    'https://photography-back-2iok.onrender.com',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// 1. CORS - ПЕРШИЙ! (НАЙВАЖЛИВІШЕ)
app.use(cors(corsOptions));

// 2. Явно відповідаємо на OPTIONS запити (preflight)
app.options('*', cors(corsOptions));

// 3. Парсери тіла (тільки один раз!)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Інші middleware
app.use(cookieParser());
app.use(logger);

// 5. Роути
app.use('/auth', authRoutes);
app.use('/images', imagesRoutes);
app.use('/admin/images', adminImagesRoutes);
app.use('/api', emailRoutes);

// 6. Обробка помилок (в кінці!)
app.use(notFoundHandler);
app.use(errors());
app.use(errorHandler);

// Запуск сервера
connectMongoDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
      console.log(`CORS enabled for origins:`, corsOptions.origin);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
