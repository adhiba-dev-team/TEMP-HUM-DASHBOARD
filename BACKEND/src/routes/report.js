import express from 'express';
import {
  generateReport,
  saveSchedule,
  cancelSchedule,
  getLatestSchedule,
  getReportList,
  downloadReport,
} from '../controllers/report.js';

const router = express.Router();

// Report generation
router.post('/generate', generateReport);

// Schedule creation
router.post('/schedule', saveSchedule);

// 🔥 Add this — to fetch the active/latest schedule
router.get('/schedule/latest', getLatestSchedule);

// 🔥 Add this — to cancel a specific schedule
router.delete('/schedule/:type', cancelSchedule);

// Report listing
router.get('/list', getReportList);

// Download report
router.get('/download/:filename', downloadReport);

export default router;
