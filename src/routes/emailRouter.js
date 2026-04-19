import { Router } from 'express';
// import { celebrate } from 'celebrate';
import { sendContactEmail } from '../controllers/emailController.js';
// import { sendEmailSchema } from '../validations/emailValidation.js';

const router = Router();

// POST ендпоінт для відправки email
router.post('/send-email', sendContactEmail);
// router.post('/send-email', celebrate(sendEmailSchema), sendContactEmail);

export default router;
