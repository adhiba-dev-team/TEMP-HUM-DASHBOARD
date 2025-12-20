import express from 'express';
import {
  signup,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from '../controllers/authController.js';
import { signupValidator } from '../validators/authValidators.js';
import { validate } from '../middlewares/validator.js';

const router = express.Router();

router.post('/signup', signupValidator, validate, signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

export default router;
