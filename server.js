
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');

// Import routes and middleware
const authRoutes = require('./routes/auth');
const requireAuth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is missing in .env');
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// EJS template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Trust reverse proxy in production
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Session configuration
app.use(session({
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

// Home route
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }

    res.redirect('/login');
});

// Authentication routes
app.use('/', authRoutes);

// Temporary protected dashboard
app.get('/dashboard', requireAuth, (req, res) => {
    res.send(`
        <h1>Welcome to StockFlow Dashboard</h1>
        <p>Login successful!</p>

        <form action="/logout" method="POST">
            <button type="submit">Logout</button>
        </form>
    `);
});

// Page not found
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// Error handling
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
