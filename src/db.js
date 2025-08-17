const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'auctions.db');
const db = new sqlite3.Database(dbPath);

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve({ rows });
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, err => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function placeBid(auctionId, userId, amount) {
  await query(
    `INSERT INTO bids (auction_id, user_id, amount, created_at)
     VALUES (?, ?, ?, datetime('now'))
     RETURNING id;`,
    [auctionId, userId, amount]
  );

  const { rows } = await query('SELECT end_at FROM auctions WHERE id = ?', [auctionId]);
  if (!rows.length) {
    throw new Error('Auction not found');
  }

  const endAt = rows[0].end_at;
  const remaining = new Date(endAt).getTime() - Date.now();

  if (remaining <= 120000) {
    const newEndAt = new Date(new Date(endAt).getTime() + 120000).toISOString();
    await query('UPDATE auctions SET end_at = ? WHERE id = ?', [newEndAt, auctionId]);
    return newEndAt;
  }

  return endAt;
}

async function init() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');

  await run(`CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );`);

  const files = fs.readdirSync(migrationsDir).sort();
  for (const file of files) {
    const { rows } = await query('SELECT 1 FROM migrations WHERE name = ?', [file]);
    if (rows.length) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await exec(sql);
    await run('INSERT INTO migrations (name) VALUES (?)', [file]);
  }
}

module.exports = {
  query,
  placeBid,
  init
};
