import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, "../../data/edwin.db");

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// Promisify database operations
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize database schema
async function initDB() {
  try {
    // Users table
    await dbRun(`
			CREATE TABLE IF NOT EXISTS users (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				google_id TEXT UNIQUE NOT NULL,
				email TEXT NOT NULL,
				name TEXT NOT NULL,
				picture TEXT,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			)
		`);

    // Feeding entries table
    await dbRun(`
			CREATE TABLE IF NOT EXISTS feeding_entries (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id INTEGER NOT NULL,
				type TEXT NOT NULL CHECK(type IN ('food', 'milk')),
				quantity_ml INTEGER NOT NULL,
				fed_at DATETIME NOT NULL,
				notes TEXT,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
			)
		`);

    // Create indexes
    await dbRun(
      `CREATE INDEX IF NOT EXISTS idx_fed_at ON feeding_entries(fed_at)`,
    );
    await dbRun(
      `CREATE INDEX IF NOT EXISTS idx_user_type ON feeding_entries(user_id, type)`,
    );
    await dbRun(
      `CREATE INDEX IF NOT EXISTS idx_user_fed_at ON feeding_entries(user_id, fed_at)`,
    );

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Initialize on import
initDB();

export default db;
