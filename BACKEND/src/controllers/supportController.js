import { sendMail } from '../services/mailService.js';
import db from '../config/db.js';
import dayjs from 'dayjs';
import dotenv from 'dotenv';

dotenv.config();

export const sendSupportMail = async (req, res) => {
  try {
    const { deviceId, deviceName, description } = req.body;

    if (!deviceId || !deviceName || !description) {
      return res.status(400).json({
        success: false,
        message: 'Device ID, Device Name and Description are required.',
      });
    }

    const location = deviceName;
    const reportedTime = dayjs().format('YYYY-MM-DD HH:mm:ss');

    // Save ticket in SQLite
    const stmt = db.prepare(
      'INSERT INTO tickets (device_id, location, description, reported_time) VALUES (?, ?, ?, ?)'
    );
    stmt.run(deviceId, location, description, reportedTime);

    // Your original HTML email template
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Device Issue Report - ${deviceId}</title>
</head>
<body style="margin:0; padding:0; font-family:Arial, Helvetica, sans-serif; background:#f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5; padding:20px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:#313985; padding:20px 30px;">
              <table width="100%">
                <tr>
                  <td>
                    <img src="https://raw.githubusercontent.com/ADHIBA-IT-TEAM-2025/IOT-MAIL-IMAGE/main/white-logo.png?raw=1" alt="NYSTAI Logo" style="height:45px;" />
                  </td>
                  <td align="right" style="font-size:12px; color:#ffffff;">
                    <a href="mailto:support@adhiba.com" style="color:#ffffff; text-decoration:none;">support@adhiba.com</a><br/>
                    Coimbatore
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:40px; background:url('https://raw.githubusercontent.com/ADHIBA-IT-TEAM-2025/IOT-MAIL-IMAGE/main/adhiba-logo-bg-gray.png?raw=1') no-repeat center; background-size:280px;">
              
              <h2 style="font-size:20px; color:#313985; margin:0 0 25px 0; font-weight:700; text-align:center;">
                New Device Issue Report Submitted
              </h2>

              <p style="font-size:15px; color:#444; line-height:1.6;">
                Below are the details submitted from IoT Dashboard:
              </p>

              <!-- Issue Details Table -->
              <table width="100%" cellpadding="12" style=" border:1px solid #e0e0e0; border-radius:6px; margin-top:15px; font-size:14px; color:#333;">
                <tr>
                  <td><strong>Device ID:</strong></td>
                  <td>${deviceId}</td>
                </tr>
                <tr>
                  <td><strong>Device Name:</strong></td>
                  <td>${deviceName}</td>
                </tr>
                <tr>
                  <td><strong>Description:</strong></td>
                  <td>${description}</td>
                </tr>
                <tr>
                  <td><strong>Reported Time:</strong></td>
                  <td>${reportedTime}</td>
                </tr>
              </table>

              <hr style="margin:35px 0; border-top:1px solid #eee;" />

              <!-- Footer -->
              <p style="font-size:13px; color:#555; line-height:1.6;">
                Best Regards,<br/>
                <strong>Team Adhiba</strong><br/>
                Empowering Innovation with Smart Monitoring<br/>
                Email: <a href="mailto:support@adhiba.com" style="color:#313985; text-decoration:none;">support@adhiba.com</a><br/>
                Coimbatore, India
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

    // 🔥 Gmail API mail sending (replaces Nodemailer)
    await sendMail(
      process.env.SUPPORT_EMAIL,
      `Device Issue Report – ${deviceId}`,
      htmlTemplate
    );

    console.log('Mail sent successfully');

    return res.status(200).json({
      success: true,
      message: 'Ticket submitted and email sent successfully.',
    });
  } catch (error) {
    console.error('Error sending ticket:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
