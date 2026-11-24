
const crypto = require('crypto');

function csrfProtection(req, res, next) {

    // Generate a secure token for the session
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto
            .randomBytes(32)
            .toString('hex');
    }

    // Make the token available to EJS templates
    res.locals.csrfToken = req.session.csrfToken;

    // Allow safe HTTP methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Get the submitted token
    const submittedToken = req.body?._csrf;
    const sessionToken = req.session.csrfToken;

    // Validate token format
    if (
        typeof submittedToken !== 'string' ||
        !/^[a-f0-9]{64}$/.test(submittedToken)
    ) {
        return res.status(403).send(
            'Invalid CSRF token. Please refresh the page and try again.'
        );
    }

    // Secure token comparison
    const isValid = crypto.timingSafeEqual(
        Buffer.from(submittedToken, 'hex'),
        Buffer.from(sessionToken, 'hex')
    );

    if (!isValid) {
        return res.status(403).send(
            'Invalid CSRF token. Please refresh the page and try again.'
        );
    }

    next();
}

module.exports = csrfProtection;
