import fetch from 'node-fetch';

export async function sendBatteryLowPush(deviceId, battery) {
  const payload = {
    app_id: process.env.ONESIGNAL_APP_ID,
    headings: { en: '⚠️ Battery Low Alert' },
    contents: {
      en: `Device ${deviceId} battery is low (${battery}V)`,
    },
    included_segments: ['Subscribed Users'],
    url: `https://www.nystai.in/devices/${deviceId}`,
  };

  const res = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log('OneSignal response:', data);
}
