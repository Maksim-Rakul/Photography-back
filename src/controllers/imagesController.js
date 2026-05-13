import { Image } from '../models/image.js';
import createHttpError from 'http-errors';
import mongoose from 'mongoose';
import {
  uploadImage,
  deleteImage as deleteFromR2,
  getImage,
} from '../utils/r2-upload.js';

//==================================================== GET ALL
export const getImages = async (req, res) => {
  const images = await Image.find().sort({ order: 1 });
  res.status(200).json(images);
};

//==================================================== GET BY ID
export const getImagesById = async (req, res) => {
  const { imageId } = req.params;

  const img = await Image.findById(imageId);

  if (!img) {
    throw createHttpError(404, 'Image not found');
  }

  res.status(200).json(img);
};

//==================================================== CREATE
export const createImage = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw createHttpError(400, 'No files');
  }

  const uploadedImages = [];

  const lastImage = await Image.findOne().sort({ order: -1 });
  let currentOrder = lastImage ? lastImage.order + 1 : 0;

  for (const file of req.files) {
    // 🟢 Використовуємо R2 замість Cloudinary
    const result = await uploadImage(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    const image = await Image.create({
      url: result.url, // ← змінилось: result.url замість result.secure_url
      publicId: result.key, // ← змінилось: result.key замість result.public_id
      order: currentOrder++,
    });

    uploadedImages.push(image);
  }

  res.status(201).json(uploadedImages);
};

//==================================================== DELETE
export const deleteImage = async (req, res) => {
  const { imageId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(imageId)) {
    return res.status(400).json({ error: 'Invalid imageId' });
  }

  const image = await Image.findById(imageId);

  if (!image) {
    throw createHttpError(404, 'Image not found');
  }

  if (image.publicId) {
    try {
      // 🟢 Видаляємо з R2 замість Cloudinary
      await deleteFromR2(image.publicId);
    } catch (err) {
      console.error('R2 delete failed:', err);
      // не кидаємо 500, просто лог
    }
  }

  await Image.deleteOne({ _id: imageId });

  res.status(200).json({ message: 'Deleted' });
};

//==================================================== UPDATE
export const updateImage = async (req, res) => {
  const { imageId } = req.params;

  const image = await Image.findById(imageId);

  if (!image) {
    throw createHttpError(404, 'Image not found');
  }

  let updateData = {};

  if (req.file) {
    // 🧹 видаляємо старе зображення з R2
    if (image.publicId) {
      await deleteFromR2(image.publicId);
    }

    // ☁️ завантажуємо нове в R2
    const result = await uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
    );

    updateData.url = result.url; // ← змінилось
    updateData.publicId = result.key; // ← змінилось
  }

  const updatedImage = await Image.findByIdAndUpdate(imageId, updateData, {
    new: true,
  });

  res.status(200).json(updatedImage);
};

//==================================================== REORDER (без змін)
export const reorderImages = async (req, res) => {
  console.log('\n=== REORDER IMAGES CONTROLLER ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request body:', req.body);

  const { items } = req.body;

  if (!items) {
    console.error('❌ ERROR: items is missing');
    return res.status(400).json({
      error: 'Invalid request',
      details: 'items field is required',
    });
  }

  if (!Array.isArray(items)) {
    console.error(`❌ ERROR: items is not an array, type: ${typeof items}`);
    return res.status(400).json({
      error: 'Invalid request',
      details: 'items must be an array',
    });
  }

  console.log(`📦 Processing ${items.length} items`);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`\n--- Item ${i} ---`);
    console.log('item:', item);

    if (!item._id) {
      console.error(`❌ Item ${i} missing _id`);
      return res.status(400).json({
        error: 'Invalid request',
        details: `Item at index ${i} missing _id`,
      });
    }

    if (item.order === undefined || item.order === null) {
      console.error(`❌ Item ${i} missing order`);
      return res.status(400).json({
        error: 'Invalid request',
        details: `Item at index ${i} missing order`,
      });
    }

    if (typeof item.order !== 'number') {
      console.error(
        `❌ Item ${i} order is not a number, type: ${typeof item.order}`,
      );
      return res.status(400).json({
        error: 'Invalid request',
        details: `Order must be a number for item ${i}`,
      });
    }
  }

  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item._id },
      update: { $set: { order: item.order } },
    },
  }));

  console.log('\n📝 Executing bulkWrite...');

  try {
    const result = await Image.bulkWrite(bulkOps);
    console.log('✅ Bulk write result:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });

    res.status(200).json({
      message: 'Order updated successfully',
      result: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (err) {
    console.error('❌ Bulk write failed:', err);
    res.status(500).json({
      error: 'Database error',
      details: err.message,
    });
  }
};
