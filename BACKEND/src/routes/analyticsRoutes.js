import express from 'express';
import {
  getAverages
} from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/average', getAverages);

export default router;
