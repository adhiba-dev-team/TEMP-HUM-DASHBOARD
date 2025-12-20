import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { google } from 'googleapis';

const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

function loadCredentials() {
  return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
}

async function generateToken() {
  const credentials = loadCredentials();
  const { client_secret, client_id, redirect_uris } = credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('👉 Authorize this app by visiting this URL:\n');
  console.log(authUrl, '\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter the code from that page here: ', async code => {
    rl.close();
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('\n✅ token.json created successfully!');
  });
}

generateToken();

// Client ID
// 658782675551-7md9o8s86e77fjo67ijtd0oufk5tje9a.apps.googleusercontent.com

// Client secret
// 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