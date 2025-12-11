// src/config/dbClient.js
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
dotenv.config();

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new Database(process.env.SQLITE_PATH, { verbose: null });
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('synchronous = NORMAL');
    dbInstance.pragma('busy_timeout = 10000');
    console.log('[DB] SQLite instance created');
  }
  return dbInstance;
}
