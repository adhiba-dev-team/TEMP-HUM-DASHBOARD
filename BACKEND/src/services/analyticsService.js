// src/services/analyticsService.js
import db from '../config/db.js';
import dayjs from 'dayjs';

// ========================================
// Helper Functions
// ========================================
function tableExists(table) {
  try {
    const result = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
      .get(table);
    return !!result;
  } catch {
    return false;
  }
}

function getValidDeviceTables(deviceId) {
  if (deviceId) {
    const table = `device_${deviceId}`;
    return tableExists(table) ? [table] : [];
  }

  return db
    .prepare(`SELECT name FROM devices`)
    .all()
    .map(d => d.name)
    .filter(Boolean)
    .filter(name => tableExists(name));
}

// ========================================
// 1️⃣ CURRENT AVERAGE (last 1 hour)
// ========================================
export function getCurrentAverage(deviceId = null) {
  const since = dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss');

  const tables = getValidDeviceTables(deviceId);

  let tSum = 0,
    hSum = 0,
    count = 0;

  for (const table of tables) {
    try {
      const row = db
        .prepare(
          `SELECT AVG(temperature) AS avgTemp, AVG(humidity) AS avgHum
           FROM ${table}
           WHERE timestamp >= ?`
        )
        .get(since);

      if (row?.avgTemp != null && row?.avgHum != null) {
        tSum += row.avgTemp;
        hSum += row.avgHum;
        count++;
      }
    } catch {}
  }

  return count
    ? {
        avgTemp: +(tSum / count).toFixed(2),
        avgHum: +(hSum / count).toFixed(2),
      }
    : { avgTemp: null, avgHum: null };
}

// ========================================
// 2️⃣ PERIOD AVERAGES (Daily / Weekly / Monthly)
// ========================================
export function getPeriodAverage(type, deviceId = null) {
  const now = dayjs();

  const start =
    type === 'daily'
      ? now.subtract(1, 'day')
      : type === 'weekly'
      ? now.subtract(7, 'day')
      : now.subtract(30, 'day');

  return getAverageFromDB(
    deviceId,
    start.format('YYYY-MM-DD HH:mm:ss'),
    now.format('YYYY-MM-DD HH:mm:ss')
  );
}

export function getAverageFromDB(deviceId, from, to) {
  const tables = getValidDeviceTables(deviceId);

  let tSum = 0,
    hSum = 0,
    count = 0;

  for (const table of tables) {
    try {
      const row = db
        .prepare(
          `SELECT ROUND(AVG(temperature),2) AS avgTemp,
                  ROUND(AVG(humidity),2) AS avgHum
           FROM ${table}
           WHERE timestamp BETWEEN ? AND ?`
        )
        .get(from, to);

      if (row?.avgTemp != null && row?.avgHum != null) {
        tSum += row.avgTemp;
        hSum += row.avgHum;
        count++;
      }
    } catch {}
  }

  return count
    ? {
        avgTemp: +(tSum / count).toFixed(2),
        avgHum: +(hSum / count).toFixed(2),
      }
    : { avgTemp: null, avgHum: null };
}

// ========================================
// 3️⃣ WEEKLY BREAKDOWN (Mon–Sun)
// ========================================
export function getWeeklyDailyAverages(deviceId = null) {
  try {
    const weekStart = dayjs().startOf('week');
    const tables = getValidDeviceTables(deviceId);

    const result = [];

    for (let i = 0; i < 7; i++) {
      const date = weekStart.add(i, 'day').format('YYYY-MM-DD');

      let totalT = 0,
        totalH = 0,
        count = 0;

      for (const table of tables) {
        const rows = db
          .prepare(
            `SELECT temperature, humidity
             FROM ${table}
             WHERE DATE(timestamp) = ?`
          )
          .all(date);

        rows.forEach(r => {
          totalT += r.temperature;
          totalH += r.humidity;
          count++;
        });
      }

      result.push({
        date,
        avgTemp: count ? +(totalT / count).toFixed(2) : null,
        avgHum: count ? +(totalH / count).toFixed(2) : null,
      });
    }

    return result;
  } catch (err) {
    console.error('Weekly breakdown error:', err);
    return [];
  }
}

// ========================================
// 4️⃣ HOURLY BREAKDOWN (Last 24 hours)
// ========================================
export function getHourlyAverages(deviceId = null) {
  try {
    const since = dayjs().subtract(24, 'hours').format('YYYY-MM-DD HH:mm:ss');

    const tables = getValidDeviceTables(deviceId);

    const map = {};

    tables.forEach(table => {
      const rows = db
        .prepare(
          `SELECT strftime('%H:00', timestamp) AS hour,
                  temperature,
                  humidity
           FROM ${table}
           WHERE timestamp >= ?
           ORDER BY timestamp`
        )
        .all(since);

      rows.forEach(r => {
        if (!map[r.hour]) map[r.hour] = { temps: [], hums: [] };
        map[r.hour].temps.push(r.temperature);
        map[r.hour].hums.push(r.humidity);
      });
    });

    const output = [];

    for (let i = 0; i < 24; i++) {
      const hh = String(i).padStart(2, '0') + ':00';
      const t = map[hh]?.temps || [];
      const h = map[hh]?.hums || [];

      output.push({
        hour: hh,
        avgTemp: t.length
          ? +(t.reduce((a, b) => a + b, 0) / t.length).toFixed(2)
          : null,
        avgHum: h.length
          ? +(h.reduce((a, b) => a + b, 0) / h.length).toFixed(2)
          : null,
      });
    }

    return output;
  } catch (err) {
    console.error('Hourly breakdown error:', err);
    return [];
  }
}
