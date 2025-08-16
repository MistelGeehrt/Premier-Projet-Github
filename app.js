const express = require('express');
const path = require('path');
const ussdCodes = require('./config/ussd.json');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const auctions = {
  '1': { amount: 1000, ref: 'AUC1' },
  '2': { amount: 2000, ref: 'AUC2' }
};

app.get('/payment/:auctionId', (req, res) => {
  const auction = auctions[req.params.auctionId];
  if (!auction) {
    return res.status(404).send('Auction not found');
  }

  const ussdLinks = {};
  const ussdStrings = {};
  Object.entries(ussdCodes).forEach(([operator, code]) => {
    const str = `*${code}*${auction.amount}*${auction.ref}#`;
    ussdStrings[operator] = str;
    ussdLinks[operator] = `tel:${str.replace('#', '%23')}`;
  });

  res.render('payment', {
    amount: auction.amount,
    ref: auction.ref,
    ussdLinks,
    ussdStrings,
    operators: Object.keys(ussdCodes)
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
