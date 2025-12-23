// src/config/dbClient.js
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';

// dotenv.config();

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    // ✅ Force a single, absolute SQLite path
    const DB_PATH = process.env.SQLITE_PATH
      ? path.resolve(process.env.SQLITE_PATH)
      : '/var/www/myapp/backend/data/iot.db';

    dbInstance = new Database(DB_PATH, { verbose: null });

    // Recommended pragmas for production
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('synchronous = NORMAL');
    dbInstance.pragma('busy_timeout = 10000');

    console.log('[DB] SQLite connected at:', DB_PATH);
  }

  return dbInstance;
}
