
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database/db');

const router = express.Router();

// Display signup page
router.get('/signup', (req, res) => {
    res.render('signup', { error: null });
});

// Register new user
router.post('/signup', async (req, res, next) => {
    try {
        const email = String(req.body.email || '')
            .trim().toLowerCase();

        const organization = String(
            req.body.organization || ''
        ).trim();

        const password = req.body.password;
        const confirmPassword = req.body.confirmPassword;

        // Validate required fields
        if (!email || !organization ||
            typeof password !== 'string' ||
            !password || !confirmPassword) {
            return res.render('signup', {
                error: 'All fields are required.'
            });
        }

        // Validate email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.render('signup', {
                error: 'Enter a valid email address.'
            });
        }

        // Validate password
        if (password.length < 8 ||
            Buffer.byteLength(password, 'utf8') > 72) {
            return res.render('signup', {
                error: 'Password must have at least 8 characters and at most 72 bytes.'
            });
        }

        if (password !== confirmPassword) {
            return res.render('signup', {
                error: 'Passwords do not match.'
            });
        }

        // Check existing user
        const existingUser = db.prepare(
            'SELECT id FROM users WHERE email = ?'
        ).get(email);

        if (existingUser) {
            return res.render('signup', {
                error: 'Email is already registered.'
            });
        }

        // Hash password securely
        const passwordHash = await bcrypt.hash(password, 12);

        // Create organization and user together
        const registerUser = db.transaction(() => {
            const org = db.prepare(
                'INSERT INTO organizations (name) VALUES (?)'
            ).run(organization);

            db.prepare(`
                INSERT INTO users
                (organization_id, email, password_hash)
                VALUES (?, ?, ?)
            `).run(
                org.lastInsertRowid,
                email,
                passwordHash
            );
        });

        registerUser();

        res.redirect('/login');

    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.render('signup', {
                error: 'Email is already registered.'
            });
        }

        next(error);
    }
});

// Display login page
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Authenticate user
router.post('/login', async (req, res, next) => {
    try {
        const email = String(req.body.email || '')
            .trim().toLowerCase();

        const password = req.body.password;

        if (!email || typeof password !== 'string' ||
            !password ||
            Buffer.byteLength(password, 'utf8') > 72) {
            return res.render('login', {
                error: 'Enter a valid email and password.'
            });
        }

        const user = db.prepare(`
            SELECT users.*, organizations.name AS organization_name
            FROM users
            JOIN organizations
            ON users.organization_id = organizations.id
            WHERE users.email = ?
        `).get(email);

        if (!user || !(await bcrypt.compare(
            password, user.password_hash
        ))) {
            return res.status(401).render('login', {
                error: 'Invalid email or password.'
            });
        }

        // Create a fresh session after login
        req.session.regenerate((error) => {
            if (error) return next(error);

            req.session.user = {
                id: user.id,
                email: user.email,
                organization_id: user.organization_id,
                organization_name: user.organization_name
            };

            req.session.save((error) => {
                if (error) return next(error);

                res.redirect('/dashboard');
            });
        });

    } catch (error) {
        next(error);
    }
});

// Logout user
router.post('/logout', (req, res, next) => {
    req.session.destroy((error) => {
        if (error) return next(error);

        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

module.exports = router;
