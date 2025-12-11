import redisClient from '../config/redis.js';
import dayjs from 'dayjs';

// Set cached latest reading for a device
export async function cacheDeviceReading(deviceId, data) {
  const key = `device:${deviceId}:latest`;
  const value = JSON.stringify({
    ...data,
    timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  });
  await redisClient.set(key, value);
}

// Get cached latest reading
export async function getCachedDeviceReading(deviceId) {
  const key = `device:${deviceId}:latest`;
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
}

// Store average (for weekly/monthly caching later)
export async function cacheAverage(period, avgData) {
  const key = `average:${period}`;
  await redisClient.set(key, JSON.stringify(avgData));
}

export async function getCachedAverage(period) {
  const key = `average:${period}`;
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
}
