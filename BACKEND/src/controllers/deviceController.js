import db from '../config/db.js';
import { sendBatteryLowPush } from '../utils/oneSignal.js';

export function addDevice(req, res) {
  try {
    const { id, location, name } = req.body;

    // Check using PRIMARY KEY "id"
    const exists = db.prepare(`SELECT * FROM devices WHERE id = ?`).get(id);

    // UPDATE existing device
    if (exists) {
      db.prepare(
        `
        UPDATE devices
        SET device_name = ?, location = ?, last_update = datetime('now')
        WHERE id = ?
      `
      ).run(name, location, id);

      return res.json({
        status: 'updated',
        message: `Device ${id} updated successfully`,
      });
    }

    // INSERT new device (id = PK)
    db.prepare(
      `
      INSERT INTO devices (id, device_name, location, last_update)
      VALUES (?, ?, ?, datetime('now'))
    `
    ).run(id, name, location);

    return res.json({
      status: 'success',
      message: 'Device registered successfully',
    });
  } catch (err) {
    console.error('Error adding/updating device:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export function getAllDevices(req, res) {
  try {
    const rows = db
      .prepare(
        `
      SELECT 
        id AS id,
        device_name AS name,
        location,
        last_update
      FROM devices
    `
      )
      .all();

    return res.json({
      status: 'success',
      count: rows.length,
      devices: rows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch devices' });
  }
}

function todayStart() {
  return new Date().toISOString().split('T')[0] + ' 00:00:00';
}

function getMonday() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  return (
    new Date(today.setDate(diff)).toISOString().split('T')[0] + ' 00:00:00'
  );
}

function monthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    '0'
  )}-01 00:00:00`;
}

export function getSingleDevice(req, res) {
  try {
    const id = req.params.id;
    const { view, from, to } = req.query;
    const tableName = `device_${id}`;

    // Check table exists
    const check = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get(tableName);

    if (!check) {
      return res.status(404).json({ error: `Device ${id} not found` });
    }

    const todayStart = new Date().toISOString().split('T')[0] + ' 00:00:00';
    const year = new Date().getFullYear();

    // ======================= RANGE =======================
    if (view === 'range' && from && to) {
      const rows = db
        .prepare(
          `
    SELECT DATE(timestamp) AS date,
           ROUND(AVG(temperature),2) AS avgTemp,
           ROUND(AVG(humidity),2) AS avgHum
    FROM ${tableName}
    WHERE DATE(timestamp) BETWEEN ? AND ?
    GROUP BY DATE(timestamp)
    ORDER BY DATE(timestamp)
  `
        )
        .all(from, to);

      // 🔥 Create summary for React
      let totalTemp = 0,
        totalHum = 0;
      let count = rows.length;

      rows.forEach(r => {
        if (r.avgTemp != null) totalTemp += r.avgTemp;
        if (r.avgHum != null) totalHum += r.avgHum;
      });

      const summary = {
        days: count,
        avgTemp: count ? totalTemp / count : null,
        avgHum: count ? totalHum / count : null,
      };

      return res.json({
        status: 'success',
        deviceId: id,
        data: rows,
        summary, // 🔥 send summary to frontend
      });
    }

    // ======================= HOURLY =======================
    if (view === 'hourly') {
      const dailyHours = [];
      for (let h = 0; h < 24; h++) {
        const hourStr = String(h).padStart(2, '0');
        const row = db
          .prepare(
            `
          SELECT ROUND(AVG(temperature),2) AS avgTemp,
                 ROUND(AVG(humidity),2) AS avgHum
          FROM ${tableName}
          WHERE strftime('%H', timestamp)=? AND timestamp>=?
        `
          )
          .get(hourStr, todayStart);

        dailyHours.push({
          hour: `${hourStr}:00`,
          avgTemp: row?.avgTemp ?? null,
          avgHum: row?.avgHum ?? null,
        });
      }

      return res.json({
        status: 'success',
        hourlyBreakdown: dailyHours,
      });
    }

    // ======================= WEEKLY Breakdown (used by Table + Graph) =======================
    if (view === 'weekly') {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 6);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const rows = db
        .prepare(
          `
    SELECT DATE(timestamp) AS date,
           ROUND(AVG(temperature),2) AS avgTemp,
           ROUND(AVG(humidity),2) AS avgHum
    FROM ${tableName}
    WHERE DATE(timestamp) >= ?
    GROUP BY DATE(timestamp)
    ORDER BY DATE(timestamp)
  `
        )
        .all(weekStartStr);

      return res.json({
        status: 'success',
        weeklyBreakdown: rows,
        data: rows, // Graph support
      });
    }

    // ======================= MONTHLY Breakdown (12 months always) =======================
    if (view === 'monthly') {
      const currentYear = new Date().getFullYear();

      const rows = db
        .prepare(
          `
    SELECT
      STRFTIME('%Y-%m', timestamp) AS month,
      ROUND(AVG(temperature),2) AS avgTemp,
      ROUND(AVG(humidity),2) AS avgHum
    FROM ${tableName}
    WHERE STRFTIME('%Y', timestamp) = ?
    GROUP BY STRFTIME('%Y-%m', timestamp)
    ORDER BY month
  `
        )
        .all(String(currentYear));

      // Convert YYYY-MM to 12 fixed months array
      const monthList = Array.from({ length: 12 }, (_, i) => {
        const mKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
        const match = rows.find(r => r.month === mKey);

        return {
          month: mKey,
          avgTemp: match?.avgTemp ?? null,
          avgHum: match?.avgHum ?? null,
        };
      });

      return res.json({
        status: 'success',
        monthlyBreakdown: monthList,
        data: monthList, // to prevent Graph error
      });
    }

    // ======================= DEFAULT (Today Latest) =======================
    const today = db
      .prepare(
        `
      SELECT temperature, humidity, battery, timestamp
      FROM ${tableName}
      ORDER BY id DESC LIMIT 1
    `
      )
      .get();

    return res.json({
      status: 'success',
      id: Number(id), // 🔥 frontend expects id
      today: today || null,
    });
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

export function getUSBConnectedDevices(req, res) {
  try {
    const rows = db
      .prepare(
        `
      SELECT SUBSTR(name, 8) AS id
      FROM sqlite_master
      WHERE type='table' AND name LIKE 'device_%'
    `
      )
      .all();

    return res.json({
      status: 'success',
      devices: rows.map(r => Number(r.id)),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch USB devices' });
  }
}




const BATTERY_LOW = 3.5;

export async function handleTelemetry(req, res) {
  const { deviceId, battery } = req.body;

  // save telemetry normally...

  if (battery <= BATTERY_LOW) {
    await sendBatteryLowPush(deviceId, battery);
  }

  res.json({ ok: true });
}
