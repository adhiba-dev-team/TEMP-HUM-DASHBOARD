import express from 'express';
import db from '../config/db.js';
import redisClient from '../config/redis.js';
import { sendMail } from '../services/mailService.js';
import { sendPushNotification } from '../services/onesignalService.js';

const router = express.Router();

router.post('/data', (req, res) => {
  console.log('🔥 /api/iot/data HIT');
  console.log('HEADERS:', req.headers);
  console.log('BODY:', req.body);

  try {
    // ✅ DEVICE AUTH (API KEY ONLY)
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== process.env.DEVICE_API_KEY) {
      return res.status(401).json({ error: 'invalid apikey' });
    }

    const { deviceId, temperature, humidity, battery, timestamp } = req.body;

    if (!deviceId || temperature == null || humidity == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const tableName = `device_${deviceId}`;

    db.prepare(
      `CREATE TABLE IF NOT EXISTS ${tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temperature REAL,
        humidity REAL,
        battery REAL,
        timestamp TEXT
      )`
    ).run();

    db.prepare(
      `INSERT INTO ${tableName} (temperature, humidity, battery, timestamp)
       VALUES (?, ?, ?, ?)`
    ).run(
      temperature,
      humidity,
      battery || null,
      timestamp || new Date().toISOString()
    );

    db.prepare(
      `UPDATE devices SET last_update = datetime('now') WHERE id = ?`
    ).run(deviceId);

    // 🔥 socket
    global.io?.emit('device_update', {
      deviceId,
      temperature,
      humidity,
      battery,
      timestamp,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
