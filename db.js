const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let dbPromise;

async function init() {
  dbPromise = open({ filename: path.join(__dirname, 'data.db'), driver: sqlite3.Database });
  const db = await dbPromise;
  await db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT UNIQUE,
    email TEXT,
    password_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);
  await db.exec(`CREATE TABLE IF NOT EXISTS auctions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    desc TEXT,
    start_price INTEGER,
    current_price INTEGER,
    end_at DATETIME,
    reserve_price INTEGER,
    buy_now_price INTEGER,
    status TEXT DEFAULT 'active'
  );`);
  await db.exec(`CREATE TABLE IF NOT EXISTS bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auction_id INTEGER,
    user_id INTEGER,
    amount INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);
  await db.exec(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auction_id INTEGER,
    user_id INTEGER,
    operator TEXT,
    amount INTEGER,
    reference TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);
}

init();

function computeEndAt(duration) {
  const now = new Date();
  const mapping = { '24h': 24, '48h': 48, '72h': 72, '7d': 24*7 };
  const hours = mapping[duration] || 24;
  now.setHours(now.getHours() + hours);
  return now.toISOString();
}

async function createUser(name, phone, email, password_hash) {
  const db = await dbPromise;
  await db.run('INSERT INTO users (name, phone, email, password_hash) VALUES (?,?,?,?)', [name, phone, email, password_hash]);
}

async function findUserByPhone(phone) {
  const db = await dbPromise;
  return db.get('SELECT * FROM users WHERE phone = ?', [phone]);
}

async function getActiveAuctions() {
  const db = await dbPromise;
  return db.all("SELECT * FROM auctions WHERE status='active' ORDER BY end_at ASC");
}

async function createAuction(user_id, title, desc, start_price, reserve_price, buy_now_price, end_at) {
  const db = await dbPromise;
  await db.run('INSERT INTO auctions (user_id, title, desc, start_price, current_price, reserve_price, buy_now_price, end_at) VALUES (?,?,?,?,?,?,?,?)',
    [user_id, title, desc, start_price, start_price, reserve_price, buy_now_price || null, end_at]);
}

async function getAuction(id) {
  const db = await dbPromise;
  return db.get('SELECT * FROM auctions WHERE id=?', [id]);
}

async function getBids(auction_id) {
  const db = await dbPromise;
  return db.all('SELECT b.*, u.name FROM bids b JOIN users u ON b.user_id=u.id WHERE auction_id=? ORDER BY amount DESC', [auction_id]);
}

async function placeBid(auction_id, user_id, amount) {
  const db = await dbPromise;
  const auction = await getAuction(auction_id);
  if (!auction || auction.status !== 'active') throw new Error('Enchère non disponible');
  const min = auction.current_price + 100;
  if (amount < min) throw new Error('Offre trop basse');
  await db.run('INSERT INTO bids (auction_id, user_id, amount) VALUES (?,?,?)', [auction_id, user_id, amount]);
  await db.run('UPDATE auctions SET current_price=? WHERE id=?', [amount, auction_id]);
}

async function buyNow(auction_id, user_id) {
  const db = await dbPromise;
  const auction = await getAuction(auction_id);
  if (!auction.buy_now_price) throw new Error('Option indisponible');
  await db.run('UPDATE auctions SET current_price=?, status="sold" WHERE id=?', [auction.buy_now_price, auction_id]);
}

async function getAuctionsByUser(user_id) {
  const db = await dbPromise;
  return db.all('SELECT * FROM auctions WHERE user_id=? ORDER BY end_at DESC', [user_id]);
}

async function getBidsByUser(user_id) {
  const db = await dbPromise;
  return db.all('SELECT b.*, a.title FROM bids b JOIN auctions a ON b.auction_id=a.id WHERE b.user_id=? ORDER BY b.created_at DESC', [user_id]);
}

async function getWinsByUser(user_id) {
  const db = await dbPromise;
  return db.all('SELECT * FROM auctions WHERE status="sold" AND user_id=?', [user_id]);
}

async function logPayment(auction_id, user_id, operator) {
  const db = await dbPromise;
  const auction = await getAuction(auction_id);
  const ref = `PAY-${Date.now()}`;
  await db.run('INSERT INTO payments (auction_id, user_id, operator, amount, reference) VALUES (?,?,?,?,?)', [auction_id, user_id, operator, auction.current_price, ref]);
}

async function getAdminStats() {
  const db = await dbPromise;
  const active = await db.get("SELECT COUNT(*) as c FROM auctions WHERE status='active'");
  const pendingPayments = await db.get("SELECT COUNT(*) as c FROM payments WHERE status='pending'");
  return { active: active.c, pendingPayments: pendingPayments.c };
}

module.exports = {
  computeEndAt,
  createUser,
  findUserByPhone,
  getActiveAuctions,
  createAuction,
  getAuction,
  getBids,
  placeBid,
  buyNow,
  getAuctionsByUser,
  getBidsByUser,
  getWinsByUser,
  logPayment,
  getAdminStats
};
