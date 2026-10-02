/* ===========================================================
   MoveMyCar — server.js
   Now backed by a real SQLite database (see db.js) instead of
   plain JavaScript arrays. The routes themselves look almost
   the same as before — what changed is how data is saved and
   read: through SQL queries instead of .push() and .find().
   =========================================================== */

const express = require('express');
const cors = require('cors');
const db = require('./db'); // our database connection, set up in db.js
const { sendSMS } = require('./notifications'); // real SMS sending, set up in notifications.js

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;

// Strip spaces and make uppercase, e.g. "ka 01 mj 8821" -> "KA01MJ8821"
const normalizePlate = p => (p || '').toUpperCase().replace(/\s/g, '');


/* ---------- Routes ---------- */

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Look up whether a plate is registered.
app.get('/api/vehicles/:plate', (req, res) => {
  const plate = normalizePlate(req.params.plate);

  // .prepare() writes the SQL once; .get() runs it and returns one row (or undefined).
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE plate = ?').get(plate);

  if (!vehicle) return res.status(404).json({ found: false });
  res.json({ found: true, vehicle });
});

// List every registered vehicle (used by the "My Cars" screen, later).
app.get('/api/vehicles', (req, res) => {
  const vehicles = db.prepare('SELECT * FROM vehicles').all();
  res.json({ vehicles });
});

// Register a new vehicle (used by the "Register vehicle" screen's Save button).
app.post('/api/vehicles', (req, res) => {
  const plate = normalizePlate(req.body.plate);
  const { nickname, ownerName, phone } = req.body;

  if (!plate || plate.length < 6) {
    return res.status(400).json({ error: 'A valid plate number is required.' });
  }

  // INSERT OR REPLACE: if this plate is already registered, update it
  // instead of failing. Handy while you're testing the same plate repeatedly.
  db.prepare(
    'INSERT OR REPLACE INTO vehicles (plate, nickname, ownerName, phone) VALUES (?, ?, ?, ?)'
  ).run(plate, nickname || '', ownerName || 'You', phone || null);

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE plate = ?').get(plate);
  res.status(201).json({ vehicle });
});

// Create a new alert.
app.post('/api/alerts', async (req, res) => {
  const plate = normalizePlate(req.body.plate);
  const { urgency, note } = req.body;

  if (!plate || plate.length < 6) {
    return res.status(400).json({ error: 'A valid plate number is required.' });
  }

  const createdAt = Date.now();

  // .run() executes an INSERT/UPDATE/DELETE. The "?" marks keep user input
  // safely separated from the SQL itself (this prevents a common attack
  // called "SQL injection" — always use "?" placeholders, never paste
  // user text directly into a query string).
  const result = db.prepare(
    'INSERT INTO alerts (plate, urgency, note, createdAt) VALUES (?, ?, ?, ?)'
  ).run(plate, urgency || 'Can wait', note || '', createdAt);

  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(result.lastInsertRowid);

  // Try to actually message the owner, but never let a messaging failure
  // stop the alert from being created — the alert in the database is the
  // source of truth; SMS is just one way of delivering it.
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE plate = ?').get(plate);
  let notification = { sent: false, reason: 'No vehicle registered for this plate.' };

  if (vehicle) {
    const text = `MoveMyCar: your car ${plate} may be blocking someone (${alert.urgency}). ${alert.note || ''}`.trim();
    notification = await sendSMS(vehicle.phone, text);
  }

  res.status(201).json({ alert, notification });
});

// List every alert, most recent first. Used by the "My Cars" screen's
// Recent Alerts section. We cap it at 20 so the response stays small.
app.get('/api/alerts', (req, res) => {
  const alerts = db.prepare('SELECT * FROM alerts ORDER BY id DESC LIMIT 20').all();
  res.json({ alerts });
});

// Get the current status of one alert.
app.get('/api/alerts/:id', (req, res) => {
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found.' });

  const elapsedMs = Date.now() - alert.createdAt;

  let status = 'sent';
  if (elapsedMs > 1200) status = 'delivered';
  if (elapsedMs > 2800) status = 'seen';
  if (elapsedMs > 4800 || alert.ownerReply) status = 'owner_responded';

  const escalationSecondsLeft = Math.max(0, 255 - Math.floor(elapsedMs / 1000));

  res.json({ alert, status, escalationSecondsLeft });
});

// The owner replies to an alert.
app.post('/api/alerts/:id/reply', (req, res) => {
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found.' });

  const message = req.body.message || 'Coming';
  db.prepare('UPDATE alerts SET ownerReply = ?, ownerReplyAt = ? WHERE id = ?')
    .run(message, Date.now(), alert.id);

  const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alert.id);
  res.json({ alert: updated });
});

app.listen(PORT, () => {
  console.log(`MoveMyCar server running at http://localhost:${PORT}`);
  console.log(`Data is saved in movemycar.db — it will survive a restart now.`);
});
