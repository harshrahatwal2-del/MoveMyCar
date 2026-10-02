/* ===========================================================
   MoveMyCar — db.js
   Sets up a real, on-disk database using SQLite. Unlike the plain
   JavaScript arrays we used before, this data survives a server
   restart — it's saved to a file called movemycar.db right next
   to this script.
   =========================================================== */

const Database = require('better-sqlite3');
const path = require('path');

// Opens (or creates, if it doesn't exist yet) the database file.
const db = new Database(path.join(__dirname, 'movemycar.db'));

// A little safety setting that makes writes more reliable.
db.pragma('journal_mode = WAL');

/* ---------- Define the tables (this only matters the very first time) ---------- */

// "IF NOT EXISTS" means: only create the table if it isn't already there.
// This makes it safe to run this file every time the server starts.
db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    plate      TEXT PRIMARY KEY,
    nickname   TEXT,
    ownerName  TEXT
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    plate         TEXT NOT NULL,
    urgency       TEXT,
    note          TEXT,
    createdAt     INTEGER NOT NULL,
    ownerReply    TEXT,
    ownerReplyAt  INTEGER
  );
`);

/* ---------- Migration: add a "phone" column if it's missing ---------- */
// (We didn't collect phone numbers in earlier steps. This safely adds the
// column to any database created before now, without losing existing data.)

const columns = db.prepare("PRAGMA table_info(vehicles)").all().map(c => c.name);
if (!columns.includes('phone')) {
  db.exec('ALTER TABLE vehicles ADD COLUMN phone TEXT');
  console.log('Migrated database: added "phone" column to vehicles.');
}

/* ---------- Seed a couple of vehicles, only if the table is empty ---------- */

const vehicleCount = db.prepare('SELECT COUNT(*) AS n FROM vehicles').get().n;

if (vehicleCount === 0) {
  const insertVehicle = db.prepare(
    'INSERT INTO vehicles (plate, nickname, ownerName) VALUES (?, ?, ?)'
  );
  insertVehicle.run('KA01MJ8821', 'White Creta / Office commute', 'Rohan');
  insertVehicle.run('KA05EQ4410', 'Black Activa', 'Rohan');
  console.log('Seeded starter vehicles into the database.');
}

// Other files (server.js) will import this "db" object to run queries.
module.exports = db;
