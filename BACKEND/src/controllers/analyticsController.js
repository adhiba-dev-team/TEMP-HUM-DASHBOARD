// src/controllers/analyticsController.js
import {
  getCurrentAverage,
  getPeriodAverage,
  getWeeklyDailyAverages,
  getHourlyAverages,
} from '../services/analyticsService.js';

export async function getAverages(req, res) {
  try {
    const deviceId = req.query.deviceId || null;

    const current = getCurrentAverage(deviceId);
    const daily = getPeriodAverage('daily', deviceId);
    const weekly = getPeriodAverage('weekly', deviceId);
    const monthly = getPeriodAverage('monthly', deviceId);

    const weeklyBreakdown = getWeeklyDailyAverages(deviceId);
    const hourlyBreakdown = getHourlyAverages(deviceId);

    return res.json({
      average: {
        daily,
        weekly,
        monthly,
      },
      weeklyBreakdown,
      hourlyBreakdown,
    });

  } catch (err) {
    console.error('ALL DEVICE AVERAGE ERROR:', err);
    return res.status(500).json({
      error: 'Failed to fetch average analytics',
    });
  }
}
