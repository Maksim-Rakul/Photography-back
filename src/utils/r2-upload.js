import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import R2_CLIENT from '../config/r2-client.js';

const BUCKET_NAME = 'photography'; // Замініть на назву вашого бакету

// Завантаження файлу з Buffer
export async function uploadImage(fileBuffer, fileName, contentType) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `images/${Date.now()}-${fileName}`,
    Body: fileBuffer,
    ContentType: contentType,
  });

  const result = await R2_CLIENT.send(command);
  return {
    success: true,
    key: command.input.Key,
    url: `https://${process.env.R2_PUBLIC_URL}/${command.input.Key}`,
  };
}

// Отримання файлу
export async function getImage(key) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await R2_CLIENT.send(command);
  const bytes = await response.Body.transformToByteArray();
  return Buffer.from(bytes);
}

// Видалення файлу
export async function deleteImage(key) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await R2_CLIENT.send(command);
  return { success: true };
}

// Отримання списку всіх зображень
export async function listImages(prefix = 'images/') {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  const response = await R2_CLIENT.send(command);
  return response.Contents || [];
}

// Генерація підписаного URL для безпечного завантаження з браузера
export async function generateUploadUrl(fileName, contentType) {
  const key = `images/${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(R2_CLIENT, command, { expiresIn: 3600 }); // Діє 1 годину
  return { uploadUrl: signedUrl, key };
}

// Генерація підписаного URL для приватного доступу
export async function generateViewUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(R2_CLIENT, command, { expiresIn });
}
