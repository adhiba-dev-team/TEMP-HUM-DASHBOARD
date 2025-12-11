import express from 'express';
import { sendSupportMail } from '../controllers/supportController.js';

const router = express.Router();

// POST /api/support/send
router.post('/send', sendSupportMail);

export default router;
