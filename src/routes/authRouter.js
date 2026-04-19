import { Router } from 'express';
import { celebrate } from 'celebrate';
import {
  loginUser,
  // registerUser,
  logoutUser,
  refreshUserSession,
  // requestResetEmail,
  adminLogin,
  verifyToken,
} from '../controllers/authController.js';
import {
  // registerUserSchema,
  loginUserSchema,
  adminLoginSchema,
  // requestResetEmailSchema,
} from '../validations/authValidation.js';

const router = Router();

// Існуючі роути
// router.post('/auth/register', celebrate(registerUserSchema), registerUser);
router.post('/login', celebrate(loginUserSchema), loginUser);
router.post('/logout', logoutUser);
router.post('/refresh', refreshUserSession);

// НОВІ РОУТИ ДЛЯ АДМІН-ПАНЕЛІ
router.post('/admin-login', celebrate(adminLoginSchema), adminLogin);
router.get('/verify', verifyToken);

export default router;
