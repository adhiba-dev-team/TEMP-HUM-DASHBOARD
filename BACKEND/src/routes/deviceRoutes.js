import express from 'express';
import {
  addDevice,
  getAllDevices,
  getSingleDevice,
  getUSBConnectedDevices,
} from '../controllers/deviceController.js';
import { validate } from '../middlewares/validator.js';
import { addDeviceValidator } from '../validators/deviceValidators.js';

const router = express.Router();

router.post('/', addDeviceValidator, validate, addDevice);

// GET /devices
router.get('/', getAllDevices);

// GET /devices/:id
router.get('/:id', getSingleDevice);

router.get('/usb/list', getUSBConnectedDevices);

export default router;
