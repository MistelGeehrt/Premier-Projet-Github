const db = require('./db');

async function createAuction({ title, description, user_id, end_at, category }) {
  const query = `
    INSERT INTO auctions (title, description, user_id, category, start_at, end_at, status)
    VALUES ($1, $2, $3, $4, NOW(), $5, 'active')
    RETURNING id, title, description, user_id, category, start_at, end_at, status;
  `;
  const params = [title, description, user_id, category, end_at];
  const { rows } = await db.query(query, params);
  return rows[0];
}

async function getActiveAuctions() {
  const query = `
    SELECT id, title, description, user_id, category, start_at, end_at, status
    FROM auctions
    WHERE status = 'active' AND end_at > NOW();
  `;
  const { rows } = await db.query(query);
  return rows;
}

async function getAuctionsByUser(userId) {
  const query = `
    SELECT id, title, description, user_id, category, start_at, end_at, status
    FROM auctions
    WHERE user_id = $1 AND end_at > NOW();
  `;
  const { rows } = await db.query(query, [userId]);
  return rows;
}

module.exports = {
  createAuction,
  getActiveAuctions,
  getAuctionsByUser
};
