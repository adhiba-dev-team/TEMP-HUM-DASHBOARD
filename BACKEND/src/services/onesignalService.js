// src/services/onesignalService.js
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const NOTIFY_URL = 'https://onesignal.com/api/v1/notifications';

export async function sendPushNotification(title, message) {
  try {
    const appId = process.env.ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY; // 🔥 use REST API KEY

    if (!appId || !apiKey) {
      console.error('[OneSignal] ❌ Missing App ID or REST API Key');
      return;
    }

    const payload = {
      app_id: appId,
      headings: { en: title },
      contents: { en: message },

      // send to all subscribed browsers
      included_segments: ['Subscribed Users'],

      // optional but recommended
      priority: 10,
      ttl: 3600, // 1 hour
    };

    const res = await axios.post(NOTIFY_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${apiKey}`, // ✅ CORRECT
      },
      validateStatus: () => true,
    });

    console.log('[OneSignal] Status:', res.status);
    console.log('[OneSignal] Response:', res.data);

    if (res.status >= 200 && res.status < 300) {
      console.log('[OneSignal] ✅ Push sent successfully');
    } else {
      console.error('[OneSignal] ❌ Push failed');
    }
  } catch (err) {
    console.error('[OneSignal] Exception:', err.response?.data || err.message);
  }
}
