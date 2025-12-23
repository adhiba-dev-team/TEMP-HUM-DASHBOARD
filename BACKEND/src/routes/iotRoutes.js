import express from 'express';
import db from '../config/db.js';
import redisClient from '../config/redis.js';
import { sendMail } from '../services/mailService.js';
import { sendPushNotification } from '../services/onesignalService.js';

const router = express.Router();

router.post('/data', async (req, res) => {
  console.log('🔥 /iot/data HIT');
  console.log('HEADERS:', req.headers);
  console.log('BODY:', req.body);

  try {
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

    global.io?.emit('device_update', {
      deviceId,
      temperature,
      humidity,
      battery,
      timestamp,
    });

    // ================= BATTERY ALERT (BACKEND) =================
    const LOW_BATTERY_LEVEL = 3.8; // volts
    const ALERT_COOLDOWN_SECONDS = 60; // 1 minutes

    console.log(
      '[BATTERY CHECK]',
      'device:',
      deviceId,
      'battery:',
      battery,
      'threshold:',
      LOW_BATTERY_LEVEL
    );

    if (battery != null && Number(battery) <= LOW_BATTERY_LEVEL) {
      const alertKey = `alert:device:${deviceId}`;
      const onCooldown = await redisClient.exists(alertKey);

      console.log('[BATTERY] onCooldown:', onCooldown);

      if (!onCooldown) {
        const alertMsg =
          `⚠️ Battery Low Alert\n` +
          `Device ${deviceId}\n` +
          `Battery: ${battery} V`;

        try {
          await sendPushNotification('Battery Alert', alertMsg);

          await sendMail(
            process.env.ALERT_EMAIL,
            `Battery Low Alert - Device ${deviceId}`,
            `Device ${deviceId} battery is low.\nCurrent level: ${battery} V`
          );

          await redisClient.setEx(alertKey, ALERT_COOLDOWN_SECONDS, 'true');

          console.log(
            `[BATTERY ALERT] Sent for Device ${deviceId} (${battery}V)`
          );
        } catch (err) {
          console.error('[BATTERY ALERT ERROR]', err);
        }
      } else {
        console.log(
          `[BATTERY ALERT] Skipped – cooldown active for Device ${deviceId}`
        );
      }
    }
    // ==========================================================

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


export default router;
