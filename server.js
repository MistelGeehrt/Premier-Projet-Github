const express = require('express');
const session = require('express-session');
const { ensureAuth } = require('./middleware/auth');

const app = express();

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));

app.get('/auction/new', ensureAuth, (req, res) => {
  res.send('New auction form');
});

app.post('/auction/:id/bid', ensureAuth, (req, res) => {
  res.send(`Bid placed on auction ${req.params.id}`);
});

module.exports = app;
