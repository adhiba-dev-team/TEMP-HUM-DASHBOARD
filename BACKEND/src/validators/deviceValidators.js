import { body } from 'express-validator';

export const addDeviceValidator = [
  body('name').trim().notEmpty().withMessage('Device name is required'),

  body('location').trim().notEmpty().withMessage('Device location is required'),
];
