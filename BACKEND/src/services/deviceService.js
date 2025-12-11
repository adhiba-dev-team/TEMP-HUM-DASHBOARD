import db from '../config/db.js';

// Fetch latest reading for a specific device
export function getSingleDeviceDataService(deviceId) {
  try {
    const tableName = `device_${deviceId}`;

    const row = db
      .prepare(`SELECT * FROM ${tableName} ORDER BY id DESC LIMIT 1`)
      .get();

    return row || null;
  } catch (err) {
    console.error('Error fetching single device data:', err.message);
    return null;
  }
}
