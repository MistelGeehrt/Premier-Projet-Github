const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('auctions.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS auctions (
    id INTEGER PRIMARY KEY,
    current_price INTEGER NOT NULL,
    reserve_price INTEGER NOT NULL,
    end_at INTEGER NOT NULL,
    status TEXT NOT NULL
  )`);
});

function getAuction(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM auctions WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function updateAuction(id, fields) {
  const entries = Object.entries(fields);
  if (entries.length === 0) return Promise.resolve();
  const sets = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  return new Promise((resolve, reject) => {
    db.run(`UPDATE auctions SET ${sets} WHERE id = ?`, [...values, id], function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

function getAllAuctions() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM auctions', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function insertAuction(auction) {
  const { id, current_price, reserve_price, end_at, status } = auction;
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO auctions (id, current_price, reserve_price, end_at, status) VALUES (?, ?, ?, ?, ?)`,
      [id, current_price, reserve_price, end_at, status],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

module.exports = { db, getAuction, updateAuction, getAllAuctions, insertAuction };
