import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = new URL('.', import.meta.url).pathname;

const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../token.json');


function loadCredentials() {
  return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
}

function loadToken() {
  return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
}

export async function sendMail(to, subject, html, attachments = []) {
  // 🔧 Step 3: Log before sending mail (TEMP)
  console.log('[MAIL DEBUG]', {
    cwd: process.cwd(),
    credentialsExists: fs.existsSync(CREDENTIALS_PATH),
    tokenExists: fs.existsSync(TOKEN_PATH),
    mailUser: process.env.MAIL_USER,
  });

  try {
    if (!to || to.trim() === '') {
      throw new Error('Recipient email is required');
    }

const credentials = loadCredentials();
const token = loadToken();

const { client_id, client_secret, redirect_uris } = credentials.web;

const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

auth.setCredentials(token);


    const gmail = google.gmail({ version: 'v1', auth });

    const boundary = '----=_Boundary_' + Date.now();

    // Email Header (NO leading newline)
    let message = `From: IoT Dashboard <${process.env.MAIL_USER}>
To: ${to}
Subject: ${subject}
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="${boundary}"

--${boundary}
Content-Type: text/html; charset="UTF-8"

${html}
`;

    // Attachments
    for (const file of attachments) {
      const fileData = fs.readFileSync(file.path).toString('base64');

      message += `
--${boundary}
Content-Type: application/octet-stream; name="${file.filename}"
Content-Disposition: attachment; filename="${file.filename}"
Content-Transfer-Encoding: base64

${fileData}
`;
    }

    message += `\n--${boundary}--`;

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });

    console.log('📨 Gmail sent to:', to);
  } catch (error) {
    console.error('❌ Gmail Error full:', {
      message: error.message,
      errors: error.errors,
      response: error.response?.data,
    });
    throw error;
  }
}


export async function sendGmail(to, subject, html, attachments = []) {
  try {
    const credentials = loadCredentials();
    const token = loadToken();

    const { client_id, client_secret, redirect_uris } = credentials.installed;

    const auth = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    auth.setCredentials(token);

    const gmail = google.gmail({ version: 'v1', auth });

    let boundary = '__MAIL_BOUNDARY__';
    let messageParts = [];

    // 🚀 FIXED: Start header with NO leading newline
    messageParts.push(`From: IoT Dashboard <${process.env.MAIL_USER}>`);
    messageParts.push(`To: ${to}`);
    messageParts.push(`Subject: ${subject}`);
    messageParts.push(
      `Content-Type: multipart/mixed; boundary="${boundary}"\n`
    );

    // HTML PART
    messageParts.push(`--${boundary}`);
    messageParts.push(`Content-Type: text/html; charset="UTF-8"\n`);
    messageParts.push(html);

    // ATTACHMENTS
    for (const file of attachments) {
      const fileContent = fs.readFileSync(file.path).toString('base64');

      messageParts.push(`--${boundary}`);
      messageParts.push(
        `Content-Type: application/octet-stream; name="${file.filename}"`
      );
      messageParts.push(
        `Content-Disposition: attachment; filename="${file.filename}"`
      );
      messageParts.push('Content-Transfer-Encoding: base64\n');
      messageParts.push(fileContent);
    }

    messageParts.push(`--${boundary}--`);

    const rawMessage = Buffer.from(messageParts.join('\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawMessage },
    });

    console.log(
      '📨 Gmail sent successfully with attachments:',
      attachments.length
    );
  } catch (err) {
    console.error('Gmail sending error:', err);
    throw err;
  }
}
