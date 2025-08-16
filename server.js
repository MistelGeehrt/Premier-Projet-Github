const express = require('express');
const session = require('express-session');
const csrf = require('csurf');
const flash = require('connect-flash');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: 'replace-with-strong-secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(flash());

app.use(csrf());

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.get('/', (req, res) => {
  res.render('form', { messages: req.flash('error') });
});

app.post('/submit', (req, res) => {
  res.send('Form submission successful');
});

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    req.flash('error', 'Invalid CSRF token');
    return res.status(403).render('403', { messages: req.flash('error') });
  }
  next(err);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
