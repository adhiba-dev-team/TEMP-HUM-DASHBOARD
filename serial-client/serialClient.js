import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const SERIAL_PORT = process.env.SERIAL_PORT || 'COM3';
const BAUD_RATE = Number(process.env.BAUD_RATE) || 9600;

const SERVER_URL = process.env.SERVER_URL;
const API_KEY = process.env.DEVICE_API_KEY;
const DEVICE_ID = process.env.DEVICE_ID;

if (!SERVER_URL) {
  console.log('SERVER_URL missing in .env');
  process.exit(1);
}

console.log('Starting Serial Client...');
console.log('Port:', SERIAL_PORT);
console.log('Baud:', BAUD_RATE);
console.log('Server:', SERVER_URL);

const port = new SerialPort({
  path: SERIAL_PORT,
  baudRate: BAUD_RATE,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

parser.on('data', async line => {
  try {
    if (!line || !line.trim()) return;
    console.log('USB Data:', line);

    const regex = /ID:(\d+)\s*T:\s*([\d.]+)\s*H:\s*([\d.]+)\s*B:([\d.]+)/;
    const match = line.match(regex);
    if (!match) {
      console.log('Invalid data format:', line);
      return;
    }

    const deviceId = Number(match[1]);
    const temperature = Number(match[2]);
    const humidity = Number(match[3]);
    const battery = Number(match[4]);
    const timestamp = new Date().toISOString();

    const payload = { deviceId, temperature, humidity, battery, timestamp };

    await axios.post(SERVER_URL, payload, {
      headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    });

    console.log('Sent to server:', payload);
  } catch (err) {
    console.log(
      ' Error sending data:',
      err.response?.status,
      err.response?.data || err.message
    );
  }
});

