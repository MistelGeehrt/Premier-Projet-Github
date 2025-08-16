const { getAuction, updateAuction, getAllAuctions } = require('./db');

async function placeBid(auctionId, amount) {
  const auction = await getAuction(auctionId);
  if (!auction) throw new Error('Auction not found');
  if (amount <= auction.current_price) throw new Error('Bid must be higher');

  let { current_price, reserve_price, end_at, status } = auction;
  current_price = amount;
  const now = Date.now();

  // Extend auction if within last 120 seconds
  if (end_at - now <= 120000) {
    end_at += 120000;
  }

  // Update status if auction has ended
  if (now > end_at) {
    status = current_price < reserve_price ? 'unsold' : 'sold';
  }

  await updateAuction(auctionId, { current_price, end_at, status });
  return { ...auction, current_price, end_at, status };
}

async function updateExpiredAuctions() {
  const auctions = await getAllAuctions();
  const now = Date.now();
  for (const auction of auctions) {
    if (now > auction.end_at && auction.status === 'open') {
      const status =
        auction.current_price < auction.reserve_price ? 'unsold' : 'sold';
      await updateAuction(auction.id, { status });
    }
  }
}

module.exports = { placeBid, updateExpiredAuctions };
