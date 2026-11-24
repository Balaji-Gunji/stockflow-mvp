
function requireAuth(req, res, next) {
    // Check whether the user is logged in
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }

    // Allow authenticated users
    next();
}

module.exports = requireAuth;
