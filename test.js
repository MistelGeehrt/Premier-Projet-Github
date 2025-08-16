const { db, insertAuction, getAuction } = require('./db');
const { placeBid, updateExpiredAuctions } = require('./auctionService');

(async () => {
  await new Promise((resolve, reject) => db.run('DELETE FROM auctions', err => err ? reject(err) : resolve()));
  const now = Date.now();
  await insertAuction({ id: 1, current_price: 100, reserve_price: 200, end_at: now + 60000, status: 'open' });
  await insertAuction({ id: 2, current_price: 100, reserve_price: 50, end_at: now - 1000, status: 'open' });
  await insertAuction({ id: 3, current_price: 10, reserve_price: 20, end_at: now - 1000, status: 'open' });

  console.log('Before bid:', await getAuction(1));
  await placeBid(1, 150);
  console.log('After bid:', await getAuction(1));

  await updateExpiredAuctions();
  console.log('Auction 2:', await getAuction(2));
  console.log('Auction 3:', await getAuction(3));

  db.close();
})();
