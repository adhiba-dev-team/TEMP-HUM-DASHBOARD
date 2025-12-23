import express from 'express';
import { sendPushNotification } from '../services/onesignalService.js';

const router = express.Router();

router.get('/test-push', async (req, res) => {
  await sendPushNotification('🚀 Test Push', 'Push notification is working!');
  res.json({ ok: true });
});

export default router;
