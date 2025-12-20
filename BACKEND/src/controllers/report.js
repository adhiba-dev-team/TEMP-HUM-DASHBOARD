import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import db from '../config/db.js';
import cron from 'node-cron';
import { sendMail } from '../services/mailService.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
dayjs.extend(utc);

function convertISTtoUTC(time) {
  return dayjs(`2025-01-01 ${time}+05:30`).utc().format('HH:mm');
}


const REPORT_DIR = path.join(process.cwd(), 'reports');
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR);

const activeJobs = {};

function averageDataHasDeviceId() {
  try {
    const cols = db.prepare("PRAGMA table_info('average_data')").all();
    return cols.some(c => c.name === 'device_id');
  } catch (err) {
    console.warn('Could not read average_data schema:', err.message);
    return false;
  }
}

function makeReportName(scheduleType) {
  const now = new Date();
  const formatted = now
    .toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .replace(',', '')
    .replace(/\s+/g, '-')
    .replace(':', '_');
  return `${
    scheduleType.charAt(0).toUpperCase() + scheduleType.slice(1)
  }-Report-${formatted}`;
}

export const initializeSchedules = () => {
  try {
    const schedules = db.prepare('SELECT * FROM report_schedules').all();
    schedules.forEach(s => {
      if (activeJobs[s.type]) {
        console.log(`Skipping duplicate ${s.type} schedule`);
        return;
      }
      const formats = JSON.parse(s.formats || '{}');
      activeJobs[s.type] = setupCronJob(
        s.type,
        s.time,
        s.day,
        s.month_day,
        s.week,
        formats
      );
    });
    console.log('\nCurrently Active Schedules:');
    Object.keys(activeJobs).forEach(t =>
      console.log(`• ${t} schedule is active`)
    );
    console.log('--------------------------------------\n');
  } catch (err) {
    console.error('Error initializing saved schedules:', err.message);
  }
};

export const generateReport = async (req, res) => {
  try {
    const { scheduleType = 'daily', formats = { excel: true, pdf: false } } =
      (req && req.body) || {};

    const deviceTables = db
      .prepare(
        `SELECT id, name FROM devices WHERE name IS NOT NULL AND name != ''`
      )
      .all();

    let combined = [];

    for (const dev of deviceTables) {
      const table = dev.name;
      let rows = [];

      if (scheduleType === 'daily') {
        rows = db
          .prepare(
            `
          SELECT '${table}' AS table_name,
                 ${dev.id} AS device_id,
                 '${table}' AS device_name,
                 strftime('%Y-%m-%d %H:00', timestamp) AS grouped_time,
                 ROUND(AVG(temperature),1) AS avg_temperature,
                 ROUND(AVG(humidity),1) AS avg_humidity
          FROM ${table}
          WHERE timestamp >= datetime('now','-1 day')
          GROUP BY grouped_time
          ORDER BY grouped_time DESC;
        `
          )
          .all();
      }

      if (scheduleType === 'weekly') {
        rows = db
          .prepare(
            `
          SELECT '${table}' AS table_name,
                 ${dev.id} AS device_id,
                 '${table}' AS device_name,
                 date(timestamp) AS grouped_time,
                 ROUND(AVG(temperature),1) AS avg_temperature,
                 ROUND(AVG(humidity),1) AS avg_humidity
          FROM ${table}
          WHERE timestamp >= datetime('now','-7 days')
          GROUP BY grouped_time
          ORDER BY grouped_time DESC;
        `
          )
          .all();
      }

      if (scheduleType === 'monthly') {
        rows = db
          .prepare(
            `
          SELECT '${table}' AS table_name,
                 ${dev.id} AS device_id,
                 '${table}' AS device_name,
                 date(timestamp) AS grouped_time,
                 ROUND(AVG(temperature),1) AS avg_temperature,
                 ROUND(AVG(humidity),1) AS avg_humidity
          FROM ${table}
          WHERE timestamp >= datetime('now','-30 days')
          GROUP BY grouped_time
          ORDER BY grouped_time DESC;
        `
          )
          .all();
      }

      combined.push(...rows);
    }

    if (!combined.length) {
      const msg = { status: 'error', message: 'No recent data found' };
      if (res) return res.status(404).json(msg);
      console.warn('[Report Job] No data available for selected window');
      return msg;
    }

    const reportName = makeReportName(scheduleType);
    const attachments = [];

    // ================= Excel Export ==================
    if (formats.excel) {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Report', {
        views: [{ state: 'frozen', ySplit: 1 }],
        pageSetup: { orientation: 'landscape' },
      });

      const red = 'FFED1C24';

      sheet.columns = [
        { header: 'Time', key: 'grouped_time', width: 20 },
        { header: 'Avg Temp (°C)', key: 'avg_temperature', width: 18 },
        { header: 'Avg Humidity (%)', key: 'avg_humidity', width: 20 },
      ];

      const excelPath = path.join(REPORT_DIR, `${reportName}.xlsx`);
      sheet.addRows(combined);

      await workbook.xlsx.writeFile(excelPath);
      attachments.push({ filename: `${reportName}.xlsx`, path: excelPath });
    }

    // ================= PDF Export ==================
    // ================= PDF Export ==================
    if (formats.pdf) {
      const pdfPath = path.join(REPORT_DIR, `${reportName}.pdf`);

      await new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({ margin: 40, size: 'A4' });
          const stream = fs.createWriteStream(pdfPath);

          stream.on('finish', () => {
            console.log('PDF writing completed:', pdfPath);
            resolve();
          });

          stream.on('error', err => {
            console.error('PDF writing error:', err);
            reject(err);
          });

          doc.pipe(stream);

          doc
            .fontSize(18)
            .text(`${scheduleType.toUpperCase()} REPORT`, { align: 'center' });

          doc.moveDown();

          combined.forEach(row => {
            doc
              .fontSize(12)
              .text(
                `${row.grouped_time} | Temp: ${row.avg_temperature}°C | Humidity: ${row.avg_humidity}%`
              );
          });

          doc.end();
        } catch (err) {
          reject(err);
        }
      });

      attachments.push({ filename: `${reportName}.pdf`, path: pdfPath });
    }

    // Save in DB
    const formatType =
      formats.pdf && formats.excel
        ? 'PDF & Excel'
        : formats.pdf
        ? 'PDF'
        : 'Excel';

    db.prepare(
      `
      INSERT INTO reports (name, created_at, format)
      VALUES (?, datetime('now'), ?)
    `
    ).run(reportName, formatType);

    // ==================== SEND EMAIL (GMAIL API) ====================
    const dateStr = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

 const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${scheduleType} Report - ${dateStr}</title>
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
                    <img 
                      src="https://raw.githubusercontent.com/ADHIBA-IT-TEAM-2025/IOT-MAIL-IMAGE/main/white-logo.png?raw=1" 
                      alt="NYSTAI Logo" 
                      style="height:45px;" 
                    />
                  </td>
                  <td align="right" style="font-size:12px; color:#ffffff;">
                    <a href="mailto:support@adhiba.com" style="color:#ffffff; text-decoration:none;">support@adhiba.com</a><br/>
                    Coimbatore
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Report Body -->
          <tr>
            <td style="
              padding:40px; 
              background:url('https://raw.githubusercontent.com/ADHIBA-IT-TEAM-2025/IOT-MAIL-IMAGE/main/adhiba-logo-bg-gray.png?raw=1') 
              no-repeat center;
              background-size:300px;">
              
              <h2 style="font-size:20px; color:#D7A100; font-weight:700; margin:0 0 20px; text-align:center;">
                ${scheduleType} Report – ${dateStr}
              </h2>

              <p style="font-size:15px; color:#444; line-height:1.6;">
                Below is your Temperature & Humidity Monitoring Report.
              </p>

              <table width="100%" cellpadding="12" style="border:1px solid #e0e0e0; border-radius:6px; margin-top:20px; font-size:14px; color:#333;">
                <tr>
                  <td><strong>Device ID:</strong></td>
                  <td>All Active Devices</td>
                </tr>
                <tr>
                  <td><strong>Report Date:</strong></td>
                  <td>${dateStr}</td>
                </tr>
              </table>

              <h3 style="font-size:16px; color:#D7A100; font-weight:600; margin-top:30px;">
                Attached Files:
              </h3>

              <!-- Attachment Buttons -->
              <table cellspacing="0" cellpadding="0">
                ${attachments
                  .map(
                    a => `
                  <tr>
                    <td style="padding-bottom:10px;">
                      <a 
                        href="#"
                        style="
                          display:inline-flex;
                          align-items:center;
                          background:#f3f3f3;
                          border:1px solid #ccc;
                          border-radius:6px;
                          padding:8px 20px;
                          color:#4C4C4C;
                          text-decoration:none;
                          font-size:12px;
                        ">
                        
                        <img 
                          src="https://raw.githubusercontent.com/ADHIBA-IT-TEAM-2025/IOT-MAIL-IMAGE/main/${
                            a.filename.toLowerCase().includes('pdf')
                              ? 'pdf-img.png'
                              : 'excel-img.png'
                          }?raw=1" 
                          style="height:18px; margin-right:8px;" 
                        />

                        ${a.filename}
                      </a>
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </table>

              <p style="font-size:13px; color:#6D6D6D; margin-top:30px; line-height:1.6;">
                This report includes temperature, humidity, battery levels, and device status logs collected at scheduled intervals.
                Automated emails are generated as per your selected reporting frequency.
              </p>

              <hr style="margin:35px 0; border:none; border-top:1px solid #eee;" />

              <p style="font-size:13px; color:#555; line-height:1.6;">
                Best Regards,<br/>
                <strong>Team Adhiba</strong><br/>
                Empowering Innovation with Smart Monitoring<br/>
                Email: 
                <a href="mailto:support@adhiba.com" style="color:#313985; text-decoration:none;">
                  support@adhiba.com
                </a><br/>
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



    console.log('Email attachments:', attachments);

    await sendMail(
      process.env.ALERT_EMAIL,
      `IoT ${scheduleType} Report | ${dateStr}`,
      htmlTemplate,
      attachments
    );

    if (res) {
      return res.json({
        status: 'success',
        message: 'Report created & sent successfully',
        reportName,
      });
    }
  } catch (err) {
    console.error('Report Error:', err);
    if (res)
      return res.status(500).json({ status: 'error', message: err.message });
  }
};

export const saveSchedule = (req, res) => {
  try {
    const {
      scheduleType,
      time,
      day = null,
      monthDay = null,
      week = null,
      formats = { excel: true, pdf: false },
    } = req.body || {};

    if (!scheduleType || !time) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: scheduleType or time',
      });
    }

    // Stop and remove all active cron jobs (single active schedule overall)
    Object.keys(activeJobs).forEach(k => {
      try {
        activeJobs[k].stop();
      } catch (e) {
        /* ignore */
      }
      delete activeJobs[k];
    });

    // Clear DB schedules (we keep only one active schedule per requirement)
    db.prepare('DELETE FROM report_schedules').run();

    db.prepare(
      `INSERT INTO report_schedules (type, time, day, month_day, week, formats, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    ).run(scheduleType, time, day, monthDay, week, JSON.stringify(formats));

    const utcTime = convertISTtoUTC(time);

    activeJobs[scheduleType] = setupCronJob(
      scheduleType,
      utcTime,
      day,
      monthDay,
      week,
      formats
    );

    console.log(`Saved new ${scheduleType} schedule → ${time}`);
    return res.json({
      status: 'success',
      message: 'Report schedule saved successfully',
    });
  } catch (err) {
    console.error('Error saving schedule:', err);
    return res
      .status(500)
      .json({ status: 'error', message: 'Failed to save report schedule' });
  }
};

export const cancelSchedule = (req, res) => {
  try {
    const { type } = req.params;
    if (!type)
      return res
        .status(400)
        .json({ status: 'error', message: 'Schedule type required' });

    if (activeJobs[type]) {
      try {
        activeJobs[type].stop();
      } catch (e) {}
      delete activeJobs[type];
      console.log(`${type} schedule stopped`);
    }

    db.prepare('DELETE FROM report_schedules WHERE type = ?').run(type);
    return res.json({
      status: 'success',
      message: `${type} schedule canceled successfully`,
    });
  } catch (err) {
    console.error('Error canceling schedule:', err);
    return res
      .status(500)
      .json({ status: 'error', message: 'Failed to cancel schedule' });
  }
};

function setupCronJob(scheduleType, time, day, monthDay, week, formats) {
  try {
    // Validate time "HH:mm"
    const parts = ('' + time).split(':').map(Number);
    if (parts.length !== 2 || parts.some(isNaN)) {
      throw new Error('Invalid time format, expected HH:mm');
    }
    const [hour, minute] = parts;
    let cronExpr = '';

    if (scheduleType === 'daily') cronExpr = `${minute} ${hour} * * *`;
    else if (scheduleType === 'weekly') {
      const days = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
      };
      const d = days[day] ?? 1;
      cronExpr = `${minute} ${hour} * * ${d}`;
    } else if (scheduleType === 'monthly')
      cronExpr = `${minute} ${hour} ${monthDay || 1} * *`;
    else cronExpr = `${minute} ${hour} * * *`;

    console.log(`Scheduled ${scheduleType} report → ${cronExpr}`);

    const job = cron.schedule(cronExpr, async () => {
      console.log(
        `Auto-sending ${scheduleType} report → ${new Date().toLocaleString()}`
      );

      try {
        await generateReport({
          body: { scheduleType, formats },
        });
      } catch (err) {
        console.error('[Report Job] Error during auto-send:', err.message);
      }
    });

    return job;
  } catch (err) {
    console.error('Cron setup error:', err.message);
  }
}

export const getLatestSchedule = (req, res) => {
  try {
    const latest = db
      .prepare(
        'SELECT * FROM report_schedules ORDER BY created_at DESC LIMIT 1'
      )
      .get();
    return res.json({
      status: 'success',
      data: latest
        ? {
            type: latest.type,
            time: latest.time,
            day: latest.day,
            monthDay: latest.month_day,
            formats: JSON.parse(latest.formats || '{}'),
          }
        : null,
    });
  } catch (err) {
    console.error('Failed to fetch latest schedule:', err);
    return res
      .status(500)
      .json({ status: 'error', message: 'Failed to fetch latest schedule' });
  }
};

export const getReportList = (req, res) => {
  try {
    const rows = db
      .prepare('SELECT * FROM reports ORDER BY created_at DESC')
      .all();
    return res
      .status(200)
      .json({ status: 'success', total: rows.length, data: rows });
  } catch (err) {
    console.error('Error fetching reports:', err);
    return res
      .status(500)
      .json({ status: 'error', message: 'Failed to fetch reports' });
  }
};

export const downloadReport = (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(REPORT_DIR, filename);
    if (!fs.existsSync(filePath))
      return res
        .status(404)
        .json({ status: 'error', message: 'File not found' });
    return res.download(filePath);
  } catch (err) {
    console.error('Download error:', err);
    return res
      .status(500)
      .json({ status: 'error', message: 'Failed to download file' });
  }
};
