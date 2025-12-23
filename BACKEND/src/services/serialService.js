// src/services/serialService.js
import { SerialPort, ReadlineParser } from 'serialport';
import dayjs from 'dayjs';
import { getLastRecord, insertIfChanged } from '../config/db.js';
import { cacheDeviceReading } from './redisService.js';
import { sendPushNotification } from './onesignalService.js';
import { sendMail } from './mailService.js';
import redisClient from '../config/redis.js';

// const ALERT_EMAIL = process.env.ALERT_EMAIL || process.env.MAIL_USER;

// if (!ALERT_EMAIL) {
//   console.warn(
//     '[Battery Alert] ALERT_EMAIL and MAIL_USER are not set. Battery alert emails will be skipped.'
//   );
// }

function parseSerialData(line) {
  try {
    const cleaned = line.trim();

    // Match patterns like "ID:1", "T:29.9", "H:50.6", "B:3.69"
    const regex = /(ID|T|H|B)\s*:\s*([0-9.]+)/g;

    let match;
    let data = {};

    while ((match = regex.exec(cleaned)) !== null) {
      const key = match[1].toUpperCase();
      const value = match[2];
      data[key] = value;
    }

    if (!data.ID) {
      console.log('[Parser] Missing ID →', cleaned);
      return null;
    }

    return {
      id: parseInt(data.ID),
      t: parseFloat(data.T),
      h: parseFloat(data.H),
      bs: parseFloat(data.B),
    };
  } catch (err) {
    console.error('Parse error:', err);
    return null;
  }
}

// function batteryLowTemplate({ deviceId, location, battery }) {
//   const today = dayjs().format('DD MMM YYYY');

//   return `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//   <title>Battery Level Alert – ${location} (${deviceId}) | ${today}</title>
// </head>

// <body style="margin:0; padding:0; font-family:Arial, Helvetica, sans-serif; background-color:#f5f5f5;">
//   <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
//     style="background-color:#f5f5f5; padding:20px 0;">
//     <tr>
//       <td align="center">
//         <table role="presentation" width="600" cellpadding="0" cellspacing="0"
//           style="background-color:#ffffff; border-radius:8px; overflow:hidden;">

//           <!-- HEADER -->
//           <tr>
//             <td style="background-color:#313985; color:#ffffff; padding:20px 30px;">
//               <table width="100%">
//                 <tr>
//                   <td>
//                     <img 
//                       src="https://raw.githubusercontent.com/ADHIBA-IT-TEAM-2025/IOT-MAIL-IMAGE/main/white-logo.png" 
//                       style="height:45px;"
//                     />
//                   </td>
//                   <td align="right" style="font-size:13px; color:#fff;">
//                     <a href="mailto:support@adhiba.com" style="color:#fff;">support@adhiba.com</a><br/>
//                     Coimbatore
//                   </td>
//                 </tr>
//               </table>
//             </td>
//           </tr>

//           <!-- BODY -->
//           <tr>
//             <td style="
//               padding:40px;
//               background:url('https://raw.githubusercontent.com/ADHIBA-IT-TEAM-2025/IOT-MAIL-IMAGE/main/adhiba-logo-bg-gray.png') 
//               no-repeat center;
//               background-size:300px;
//             ">

//               <h2 style="color:#FF0000; text-align:center; font-size:18px; margin-bottom:25px;">
//                 Battery Level Alert – ${location} (${deviceId}) | ${today}
//               </h2>

//               <div style="text-align:center; margin-bottom:20px;">
//                 <img 
//                   src="https://raw.githubusercontent.com/ADHIBA-IT-TEAM-2025/IOT-MAIL-IMAGE/main/battery-level-img.png"
//                   width="150"
//                   style="display:block; margin:0 auto;"
//                 />
//               </div>

//               <table cellpadding="5" style="margin:0 auto; font-size:14px;">
//                 <tr><td><strong>Device ID</strong></td><td>: ${deviceId}</td></tr>
//                 <tr><td><strong>Location</strong></td><td>: ${location}</td></tr>
//                 <tr><td><strong>Battery Level</strong></td><td>: ${battery}V (Critical)</td></tr>
//               </table>

//               <p style="text-align:center; margin-top:20px; color:#333; font-size:15px;">
//                 The battery level has dropped below the safe limit.
//               </p>

//               <p style="text-align:center; color:#666; font-size:12px;">
//                 Please replace or recharge the battery to avoid interruptions.
//               </p>

//               <hr style="margin:30px 0; border-top:1px solid #eee;" />

//               <p style="font-size:13px; color:#333;">
//                 Best Regards,<br/>
//                 <strong>Team Adhiba</strong><br/>
//                 Empowering Innovation with Smart Monitoring<br/>
//                 support@adhiba.com<br/>
//                 Coimbatore
//               </p>

//             </td>
//           </tr>

//         </table>
//       </td>
//     </tr>
//   </table>
// </body>

// </html>
//   `;
// }

export function startSerialListener(
  portPath = '/dev/ttyUSB0',
  baudRate = 9600
) {
  console.log('🔥 SERIAL LISTENER STARTED'); // 👈 ADD THIS

  try {
    const port = new SerialPort({ path: portPath, baudRate });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    console.log(
      `Listening to USB serial on ${portPath} @ ${baudRate} (Battery + Report alerts enabled)`
    );

    parser.on('data', async line => {
      console.log('[SERIAL RAW]', line);

      const parsed = parseSerialData(line);
      if (!parsed || !parsed.id) return;

      console.log(`[${dayjs().format('HH:mm:ss')}] Received →`, parsed);

      // Retrieve last saved record for this device
      const lastRecord = getLastRecord(parsed.id);

      // await checkBattery(parsed);
      // Store only if temperature or humidity changed
      if (
        !lastRecord ||
        lastRecord.temperature !== parsed.t ||
        lastRecord.humidity !== parsed.h
      ) {
        try {
          await insertIfChanged(parsed.id, parsed);
          console.log(`Saved new reading for Device ${parsed.id}`);
        } catch (err) {
          console.error(
            `DB insert error for Device ${parsed.id}:`,
            err.message || err
          );
        }
      } else {
        console.log(
          `Skipped duplicate reading for Device ${parsed.id} (T & H same)`
        );
      }

      // Cache the latest reading in Redis
      cacheDeviceReading(parsed.id, parsed).catch(err =>
        console.error('Redis cache error:', err.message || err)
      );

      // =================== BATTERY CHECK & ALERT ===================
      console.log(
        '[DEBUG] Parsed battery raw =',
        parsed.bs,
        'type =',
        typeof parsed.bs
      );

      const batteryValue = parseFloat(parsed.bs);

      console.log(
        '[BATTERY DEBUG]',
        'device:',
        parsed.id,
        'battery:',
        batteryValue,
        'threshold:',
        3.8
      );

      if (!isNaN(batteryValue) && batteryValue < 10) {
        // DEBUG LOGS TO CONFIRM EXECUTION
        console.log('[BATTERY] CHECKING BATTERY BLOCK RUNS...');
        console.log('[BATTERY] Raw:', parsed.bs, '| Parsed:', batteryValue);

        const cooldownKey = `alert:device:${parsed.id}`;
        const onCooldown = await redisClient.exists(cooldownKey);

        console.log('[REDIS] cooldown exists:', onCooldown);

        if (onCooldown) {
          const ttl = await redisClient.ttl(cooldownKey);
          const minutes = Math.floor(ttl / 60);
          console.log(
            `Skipping alert for Device ${parsed.id} — still on cooldown (${minutes} min left)`
          );
        } else {
          const alertMsg =
            `⚠️ Battery Low Alert\n` +
            `Device: ${parsed.id}\n` +
            `Battery: ${batteryValue} V`;

          console.log(
            `[Battery Alert] Triggered for Device ${parsed.id} → ${alertMsg}`
          );

          try {
            await sendPushNotification('Battery Alert', alertMsg);

            if (!ALERT_EMAIL) {
              console.error(
                '[Battery Alert] ALERT_EMAIL not set, skipping email send.'
              );
            } else {
              console.log(
                `[Battery Alert] Sending email to ${ALERT_EMAIL} for Device ${parsed.id}`
              );

              const html = batteryLowTemplate({
                deviceId: parsed.id,
                battery: batteryValue,
              });

              await sendMail(
                ALERT_EMAIL,
                `Battery Alert - Device ${parsed.id}`,
                html
              );
            }

            await redisClient.setEx(cooldownKey, 60, 'true'); // 1 minute

            console.log(
              `Cooldown started for Device ${parsed.id} (1 min, key = ${cooldownKey})`
            );
          } catch (err) {
            console.error(
              `Error during alert process for Device ${parsed.id}:`,
              err
            );
          }
        }
      }
    });

    port.on('error', err => {
      console.error('Serial port error:', err.message || err);
    });
  } catch (err) {
    console.error('Failed to start serial listener:', err.message || err);
  }
}
