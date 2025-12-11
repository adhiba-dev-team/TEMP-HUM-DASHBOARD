import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import db from '../config/db.js';
import { sendMail } from '../services/mailService.js';
import { queueWrite } from '../utils/dbQueue.js';

const JWT_SECRET = process.env.JWT_SECRET || 'iot_secret_key';

export async function signup(req, res) {
  const { name, email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email & password required' });
  }

  try {
    // Check if user already exists
    const existingUser = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashed = bcrypt.hashSync(password, 10);

    //   Use queueWrite to avoid SQLite lock
    await queueWrite(() => {
      db.prepare(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
      ).run(name || '', email, hashed);
    });

    return res.status(201).json({ message: 'Signup successful' });
  } catch (err) {
    console.error('Signup Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export function login(req, res) {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const match = bcrypt.compareSync(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid password' });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '1d',
  });
  return res.json({ message: 'Login successful', token });
}

function forgotOtpTemplate({ otp, email }) {
  const today = dayjs().format('DD MMM YYYY');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset OTP – ${today}</title>
</head>

<body style="margin:0; padding:0; font-family:Arial, Helvetica, sans-serif; background:#f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5; padding:20px 0;">
    <tr>
      <td align="center">

        <table role="presentation" width="600" cellspacing="0" cellpadding="0"
          style="background:#ffffff; border-radius:8px; overflow:hidden;">

          <!-- HEADER -->
          <tr>
            <td style="background:#313985; padding:20px 30px; color:#ffffff;">
              <table width="100%">
                <tr>
                  <td>
                    <img 
                      src="https://raw.githubusercontent.com/ADHIBA-IT-TEAM-2025/IOT-MAIL-IMAGE/main/white-logo.png"
                      style="height:45px;"
                    />
                  </td>
                  <td align="right" style="font-size:13px; color:#ffffff;">
                    <a href="mailto:support@adhiba.com" style="color:#ffffff; text-decoration:none;">support@adhiba.com</a><br/>
                    Coimbatore
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="
              padding:40px;
              background:url('https://raw.githubusercontent.com/ADHIBA-IT-TEAM-2025/IOT-MAIL-IMAGE/main/adhiba-logo-bg-gray.png')
              no-repeat center;
              background-size:300px;
              color:#333;
            ">

              <h2 style="text-align:center; font-size:20px; font-weight:700; margin:0 0 20px; color:#D7A100;">
                Password Reset OTP
              </h2>

              <p style="font-size:15px; line-height:1.6; color:#444;">
                Hello,
                <br/><br/>
                Use the OTP below to reset your password for the account linked with:
                <br/>
                <strong>${email}</strong>
              </p>

              <!-- OTP BOX -->
              <div style="
                background:#f7f7f7;
                border:1px solid #ddd;
                padding:15px 20px;
                border-radius:6px;
                text-align:center;
                margin:25px 0;
              ">
                <p style="font-size:28px; font-weight:bold; letter-spacing:3px; color:#313985; margin:0;">
                  ${otp}
                </p>
              </div>

              <p style="font-size:13px; color:#6D6D6D; line-height:1.6; text-align:center;">
                This OTP is valid for <strong>5 minutes</strong>.<br/>
                Do not share it with anyone for security reasons.
              </p>

              <hr style="margin:30px 0; border:none; border-top:1px solid #eee;" />

              <!-- FOOTER -->
              <p style="font-size:13px; color:#3C3C3C; line-height:1.5;">
                Best Regards,<br/>
                <strong>Team Adhiba</strong><br/>
                Empowering Innovation with Smart Monitoring<br/>
                Support: 
                <a href="mailto:support@adhiba.com" style="color:#313985; text-decoration:none;">
                  support@adhiba.com
                </a><br/>
                Coimbatore
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function forgotPassword(req, res) {
  const { email } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'Email not found' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = dayjs().add(5, 'minute').unix();

  // Update OTP safely
  await queueWrite(() => {
    db.prepare('UPDATE users SET otp = ?, otp_expires = ? WHERE email = ?').run(
      otp,
      expires,
      email
    );
  });

  // SEND TEMPLATE EMAIL
  await sendMail(
    email,
    'Password Reset OTP',
    forgotOtpTemplate({ otp, email })
  );

  return res.json({ message: 'OTP sent to your email' });
}

export function verifyOtp(req, res) {
  const { email, otp } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!user.otp || user.otp !== otp)
    return res.status(400).json({ error: 'Invalid OTP' });
  if (dayjs().unix() > user.otp_expires)
    return res.status(400).json({ error: 'OTP expired' });

  return res.json({ message: 'OTP verified successfully' });
}

export async function resetPassword(req, res) {
  const { email, otp, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (!user.otp || user.otp !== otp)
    return res.status(400).json({ error: 'Invalid OTP' });
  if (dayjs().unix() > user.otp_expires)
    return res.status(400).json({ error: 'OTP expired' });

  const hashed = bcrypt.hashSync(newPassword, 10);

  //   Queue DB update to avoid lock
  await queueWrite(() => {
    db.prepare(
      'UPDATE users SET password = ?, otp = NULL, otp_expires = NULL WHERE email = ?'
    ).run(hashed, email);
  });

  return res.json({ message: 'Password reset successful' });
}
