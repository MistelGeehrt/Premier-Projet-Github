const { Pool } = require('pg');

const pool = new Pool();

async function placeBid(auctionId, userId, amount) {
  // Insert the bid
  const insertQuery = `
    INSERT INTO bids (auction_id, user_id, amount, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING id;
  `;
  await pool.query(insertQuery, [auctionId, userId, amount]);

  // Retrieve current end time
  const { rows } = await pool.query('SELECT end_at FROM auctions WHERE id = $1', [auctionId]);
  if (!rows.length) {
    throw new Error('Auction not found');
  }

  const endAt = rows[0].end_at;
  const remaining = new Date(endAt).getTime() - Date.now();

  // Extend auction if less than or equal to 2 minutes remain
  if (remaining <= 120000) {
    const newEndAt = new Date(new Date(endAt).getTime() + 120000);
    await pool.query('UPDATE auctions SET end_at = $1 WHERE id = $2', [newEndAt, auctionId]);
    return newEndAt;
  }

  return endAt;
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  placeBid
};
