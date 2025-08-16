const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));

// Middleware pour exposer l'utilisateur aux vues
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Accueil
app.get('/', async (req, res) => {
  const auctions = await db.getActiveAuctions();
  res.render('index', { auctions });
});

// Inscription
app.get('/register', (req, res) => {
  res.render('register');
});
app.post('/register', async (req, res) => {
  const { name, phone, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await db.createUser(name, phone, email, hash);
  res.redirect('/login');
});

// Connexion
app.get('/login', (req, res) => {
  res.render('login');
});
app.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  const user = await db.findUserByPhone(phone);
  if (user && await bcrypt.compare(password, user.password_hash)) {
    req.session.user = user;
    res.redirect('/');
  } else {
    res.render('login', { error: 'Identifiants incorrects' });
  }
});

// Déconnexion
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Liste des enchères
app.get('/auctions', async (req, res) => {
  const auctions = await db.getActiveAuctions();
  res.render('auctions', { auctions });
});

// Créer une enchère
app.get('/auction/new', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('new-auction');
});
app.post('/auction/new', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { title, description, start_price, reserve_price, buy_now_price, duration } = req.body;
  const end_at = db.computeEndAt(duration);
  await db.createAuction(req.session.user.id, title, description, start_price, reserve_price, buy_now_price, end_at);
  res.redirect('/auctions');
});

// Détail enchère
app.get('/auction/:id', async (req, res) => {
  const auction = await db.getAuction(req.params.id);
  const bids = await db.getBids(req.params.id);
  res.render('auction', { auction, bids });
});

// Enchérir
app.post('/auction/:id/bid', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { amount } = req.body;
  try {
    await db.placeBid(req.params.id, req.session.user.id, amount);
    res.redirect(`/auction/${req.params.id}`);
  } catch (e) {
    const auction = await db.getAuction(req.params.id);
    const bids = await db.getBids(req.params.id);
    res.render('auction', { auction, bids, error: e.message });
  }
});

// Acheter maintenant
app.post('/auction/:id/buy', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  await db.buyNow(req.params.id, req.session.user.id);
  res.redirect(`/auction/${req.params.id}`);
});

// Profil utilisateur
app.get('/profile', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const myAuctions = await db.getAuctionsByUser(req.session.user.id);
  const myBids = await db.getBidsByUser(req.session.user.id);
  const wins = await db.getWinsByUser(req.session.user.id);
  res.render('profile', { myAuctions, myBids, wins });
});

// Paiement
app.get('/payment/:auctionId', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const auction = await db.getAuction(req.params.auctionId);
  res.render('payment', { auction });
});
app.post('/payment/:auctionId', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { operator } = req.body;
  await db.logPayment(req.params.auctionId, req.session.user.id, operator);
  res.redirect('/profile');
});

// Admin basique
app.get('/admin', async (req, res) => {
  const stats = await db.getAdminStats();
  res.render('admin', { stats });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
