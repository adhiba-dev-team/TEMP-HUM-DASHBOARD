// import dotenv from 'dotenv';
import { queueWrite } from '../utils/dbQueue.js';
import { getDb } from './dbClient.js';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);


// dotenv.config();

const db = getDb();

db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    last_update DATETIME
  );

  CREATE TABLE IF NOT EXISTS average_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    avg_temperature REAL,
    avg_humidity REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    otp TEXT,
    otp_expires INTEGER
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT,
    location TEXT,
    description TEXT,
    reported_time TEXT
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    device_id INTEGER,
    created_at DATETIME,
    format TEXT
  );

  CREATE TABLE IF NOT EXISTS report_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    time TEXT,
    day TEXT,
    month_day INTEGER,
    week TEXT,
    formats TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 🔔 ADD THIS (IMPORTANT)
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);


export function createDeviceTable(deviceId) {

   if (
     !Number.isInteger(deviceId) ||
     deviceId <= 0 ||
     deviceId > 1000 // safety upper bound
   ) {
     throw new Error(`Invalid deviceId: ${deviceId}`);
   }

   const tableName = `device_${deviceId}`;
   

  // Check device record
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId);

  // Auto-provision ONLY if not deleted
  if (!device) {
    db.prepare(
      `
      INSERT INTO devices (id, name, last_update, is_active, is_deleted)
      VALUES (?, ?, ?, 1, 0)
    `
    ).run(
      deviceId,
      tableName,
      dayjs().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss')
    );
  } else if (device.is_deleted === 1) {
    // Device was intentionally removed
    throw new Error(`Device ${deviceId} is deleted`);
  }

  // Create table safely
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temperature REAL,
      humidity REAL,
      battery TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return tableName;
}


const insertReadingTx = db.transaction((tableName, t, h, bs) => {
  db.prepare(
    `INSERT INTO ${tableName} (temperature, humidity, battery, timestamp)
     VALUES (?, ?, ?, ?)`
  ).run(t, h, bs, dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"));

  db.prepare(`UPDATE devices SET last_update = ? WHERE name = ?`).run(
    dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss"),
    tableName
  );
});

export async function insertIfChanged(deviceId, data) {
  await queueWrite(() => {
    try {
      const tableName = createDeviceTable(deviceId);

      const last = db
        .prepare(`SELECT * FROM ${tableName} ORDER BY id DESC LIMIT 1`)
        .get();

      const noChange =
        last &&
        last.temperature === data.t &&
        last.humidity === data.h &&
        last.battery === data.bs;

      if (!noChange) {
        insertReadingTx(tableName, data.t, data.h, data.bs);
      }
    } catch {
      // silently ignore deleted devices
    }
  });
}


export function getLastRecord(deviceId) {
  try {
    return db
      .prepare(`SELECT * FROM device_${deviceId} ORDER BY id DESC LIMIT 1`)
      .get();
  } catch {
    return null;
  }
}

export default db;
