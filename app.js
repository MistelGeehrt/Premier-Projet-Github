const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const csrf = require('csurf');
const { ensureAuth } = require('./middleware/auth');
const ussdCodes = require('./config/ussd.json');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));
app.use(flash());
app.use(csrf());

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.error = req.flash('error');
  next();
});

app.get('/auction/new', ensureAuth, (req, res) => {
  res.send('New auction form');
});

app.post('/auction/:id/bid', ensureAuth, (req, res) => {
  res.send(`Bid placed on auction ${req.params.id}`);
});

app.post('/auction/:id/buy', ensureAuth, (req, res) => {
  res.send(`Buy now auction ${req.params.id}`);
});

app.get('/profile', ensureAuth, (req, res) => {
  res.send('User profile');
});

const auctions = {
  '1': { amount: 1000, ref: 'AUC1' },
  '2': { amount: 2000, ref: 'AUC2' }
};

app.get('/payment/:auctionId', ensureAuth, (req, res) => {
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

