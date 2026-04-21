import { Router } from 'express';
import {
  createImage,
  deleteImage,
  updateImage,
  reorderImages,
} from '../controllers/imagesController.js';

import { celebrate } from 'celebrate';
import {
  updateImageSchema,
  postImageSchema,
  imageIdParamSchema,
} from '../validations/imagesValidation.js';

import { authenticate } from '../middleware/authenticate.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { upload } from '../middleware/multer.js';

const router = Router();

router.use('/', authenticate, requireAdmin);

router.post(
  '/',
  upload.array('images', 20),
  celebrate(postImageSchema),
  createImage,
);

// ВАЖНО: Специфический маршрут должен быть перед динамическим
router.patch('/reorder', reorderImages); // 👈 переместите сюда
router.put('/reorder', reorderImages); // 👈 переместите сюда

router.put(
  '/:imageId', // 👈 динамический маршрут должен быть после специфических
  upload.array('images', 20),
  celebrate(updateImageSchema),
  updateImage,
);

router.delete(
  '/:imageId',
  upload.array('images', 20),
  celebrate(imageIdParamSchema),
  deleteImage,
);

export default router;
