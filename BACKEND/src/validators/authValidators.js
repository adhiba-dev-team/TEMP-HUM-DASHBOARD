import { body } from 'express-validator';

export const signupValidator = [
  body('email').isEmail().withMessage('Invalid email format'),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('name').notEmpty().withMessage('Name is required'),
];
