// src/services/onesignalService.js
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Change this to EU if your OneSignal app is in the EU region:
// const BASE_URL = "https://api.eu.onesignal.com";
const BASE_URL = 'https://api.onesignal.com';
const NOTIFY_URL = `${BASE_URL}/api/v1/notifications`;

function mask(val, keep = 6) {
  if (!val) return 'undefined';
  return val.slice(0, keep) + '***';
}

// Optional: quick runtime check to verify values are loaded
export function logOneSignalEnv() {
  console.log('OneSignal App ID:', process.env.ONESIGNAL_APP_ID);
  console.log(
    'OneSignal API Key (first 6):',
    mask(process.env.ONESIGNAL_API_KEY)
  );
}

export async function sendPushNotification(title, message, options = {}) {
  try {
    const appId = process.env.ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_API_KEY;

    if (!appId || !apiKey) {
      console.error(
        '[OneSignal] Missing ONESIGNAL_APP_ID or ONESIGNAL_API_KEY. Push will NOT be sent.'
      );
      logOneSignalEnv();
      return;
    }

    const payload = {
      app_id: appId,
      headings: { en: title },
      contents: { en: message },
      included_segments: ['All'], // default: send to all users
      ...options,
    };

    console.log('[OneSignal] Sending push payload:', JSON.stringify(payload));

const res = await axios.post(NOTIFY_URL, payload, {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Basic ${apiKey}`, // ← FIXED
  },
  validateStatus: () => true,
});


    if (res.status >= 200 && res.status < 300) {
      console.log('[OneSignal] Push sent OK:', res.data?.id || res.data);
    } else {
      console.error(
        '[OneSignal] Push failed:',
        res.status,
        res.data || res.statusText
      );
    }
  } catch (err) {
    console.error(
      '[OneSignal] Exception while sending push:',
      err.response?.data || err.message || err
    );
  }
}
