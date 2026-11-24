
function requireAuth(req, res, next) {

    // Prevent caching of protected pages
    res.setHeader('Cache-Control', 'no-store');

    // Check whether the user is logged in
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }

    next();
}

module.exports = requireAuth;
