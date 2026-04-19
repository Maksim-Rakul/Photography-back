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
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 30001;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

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

// Или если используете express.json()
app.use(express.json({ limit: '10mb' }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(logger);

// Images router
app.use('/auth', authRoutes);
app.use('/images', imagesRoutes);
app.use('/admin/images', adminImagesRoutes);
app.use('/api', emailRoutes);

// Middleware 404
app.use(notFoundHandler);

app.use(errors());

// Middleware для обробки помилок
app.use(errorHandler);

await connectMongoDB();

app.listen(PORT, () => {
  console.log(`Start on port ${PORT}`);
});
