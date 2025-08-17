const db = require('./db');

async function createAuction({
  title,
  description,
  user_id,
  category,
  image_url,
  start_at,
  end_at,
  reserve_price,
  buy_now_price,
  status = 'active'
}) {
  const query = `
    INSERT INTO auctions (
      title,
      description,
      user_id,
      category,
      image_url,
      start_at,
      end_at,
      reserve_price,
      buy_now_price,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id, title, description, user_id, category, image_url, start_at, end_at, reserve_price, buy_now_price, status;
  `;
  const params = [
    title,
    description,
    user_id,
    category,
    image_url,
    start_at || new Date(),
    end_at,
    reserve_price,
    buy_now_price,
    status
  ];
  const { rows } = await db.query(query, params);
  return rows[0];
}

async function getActiveAuctions() {
  const query = `
    SELECT id, title, description, user_id, category, image_url, start_at, end_at, reserve_price, buy_now_price, status
    FROM auctions
    WHERE status = 'active' AND end_at > NOW();
  `;
  const { rows } = await db.query(query);
  return rows;
}

async function getAuctionsByUser(userId) {
  const query = `
    SELECT id, title, description, user_id, category, image_url, start_at, end_at, reserve_price, buy_now_price, status
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
