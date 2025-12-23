// src/services/onesignalService.js
import axios from 'axios';

const NOTIFY_URL = 'https://onesignal.com/api/v1/notifications';

export async function sendPushNotification(title, message) {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY; // App API Key

  if (!appId || !apiKey) {
    console.error('[OneSignal] ❌ Missing App ID or API Key');
    return;
  }

  const payload = {
    app_id: appId,

    headings: { en: title },
    contents: { en: message },

    // 🔥 THIS is the key part
    included_segments: ['All'],
  };

  const res = await axios.post(NOTIFY_URL, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `key ${apiKey}`,
    },
    validateStatus: () => true,
  });

  console.log('[OneSignal] Status:', res.status);
  console.log('[OneSignal] Response:', res.data);
  console.log('[OneSignal] Sending push...');
  console.log('App ID:', appId);
  console.log('Key exists:', !!apiKey);

}
