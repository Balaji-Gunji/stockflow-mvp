
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

const SQLiteSessionStore = require('./database/session-store');
const csrfProtection = require('./middleware/csrf');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3000;

// Check session secret
if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is missing in .env');
}

// Trust proxy in production
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            upgradeInsecureRequests:
                process.env.NODE_ENV === 'production'
                    ? []
                    : null
        }
    },
    strictTransportSecurity:
        process.env.NODE_ENV === 'production'
            ? undefined
            : false
}));

// Login rate limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: 'Too many login attempts. Please try again after 15 minutes.'
});

// Signup rate limiting
const signupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: 'Too many signup attempts. Please try again later.'
});

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// EJS configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// SQLite session store
const sessionStore = new SQLiteSessionStore();

// Session configuration
app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Authentication rate limiting
app.post('/login', loginLimiter);
app.post('/signup', signupLimiter);

// Prevent caching of dynamic pages
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});

// CSRF protection
app.use(csrfProtection);

// Home route
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }

    res.redirect('/login');
});

// Application routes
app.use('/', authRoutes);
app.use('/products', productRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/settings', settingsRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Something went wrong.');
});

// Start server
app.listen(PORT, () => {
    console.log(
        `StockFlow server running at http://localhost:${PORT}`
    );
});
