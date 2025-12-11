import express from 'express';
import {
  addDevice,
  getAllDevices,
  getSingleDevice,
  getUSBConnectedDevices,
} from '../controllers/deviceController.js';

const router = express.Router();

router.post('/', addDevice);

// GET /devices
router.get('/', getAllDevices);

// GET /devices/:id
router.get('/:id', getSingleDevice);

router.get('/usb/list', getUSBConnectedDevices);

export default router;
