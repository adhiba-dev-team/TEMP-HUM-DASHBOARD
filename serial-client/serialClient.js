import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import dotenv from 'dotenv';

dotenv.config();

const SERIAL_PORT = process.env.SERIAL_PORT || 'COM3';
const BAUD_RATE = Number(process.env.BAUD_RATE) || 9600;
const SERVER_URL = process.env.SERVER_URL;
const RAW_API_KEY = process.env.DEVICE_API_KEY;

if (!SERVER_URL) {
  console.error('❌ SERVER_URL missing');
  process.exit(1);
}

function safeHeader(value) {
  return Buffer.from(String(value), 'utf8')
    .toString('ascii')
    .replace(/[^\x20-\x7E]/g, '');
}

const API_KEY = RAW_API_KEY ? safeHeader(RAW_API_KEY) : null;

console.log('SERVER_URL:', SERVER_URL);
console.log('API_KEY SAFE:', API_KEY);

const port = new SerialPort({
  path: SERIAL_PORT,
  baudRate: BAUD_RATE,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

parser.on('data', async line => {
  try {
    if (!line || !line.trim()) return;

    console.log('USB Data:', line);

    const match = line.match(
      /ID:(\d+)\s*T:\s*([\d.]+)\s*H:\s*([\d.]+)\s*B:([\d.]+)/
    );
    if (!match) return;

    const payload = {
      deviceId: Number(match[1]),
      temperature: Number(match[2]),
      humidity: Number(match[3]),
      battery: Number(match[4]),
      timestamp: new Date().toISOString(),
    };

    const headers = {
      'Content-Type': 'application/json',
    };

    if (API_KEY) {
      headers['x-api-key'] = API_KEY;
    }

    const res = await fetch(SERVER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    console.log('✅ Sent to server:', payload);
  } catch (err) {
    console.error('❌ Send error:', err.message);
  }
});
