function ensureAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    req.flash('error', 'Authentication required');
    return res.redirect('/login');
  }
  next();
}

module.exports = { ensureAuth };
