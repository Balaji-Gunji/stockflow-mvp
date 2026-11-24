
const express = require('express');
const db = require('../database/db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Protect settings routes
router.use(requireAuth);

// GET Settings page
router.get('/', (req, res) => {

    const user = req.session.user;

    const organization = db.prepare(`
        SELECT id, name, default_threshold
        FROM organizations
        WHERE id = ?
    `).get(user.organization_id);

    if (!organization) {
        return res.status(404).send('Organization not found.');
    }

    res.render('settings', {
        user,
        organization,
        error: null,
        success: req.query.updated === '1'
            ? 'Settings updated successfully.'
            : null
    });

});

// POST Update Settings
router.post('/', (req, res) => {

    const user = req.session.user;

    const organization = db.prepare(`
        SELECT id, name, default_threshold
        FROM organizations
        WHERE id = ?
    `).get(user.organization_id);

    if (!organization) {
        return res.status(404).send('Organization not found.');
    }

    const threshold = String(
        req.body.default_threshold ?? ''
    ).trim();

    // Validate threshold
    if (
        !/^\d+$/.test(threshold) ||
        !Number.isSafeInteger(Number(threshold))
    ) {
        return res.status(400).render('settings', {
            user,
            organization,
            error: 'Threshold must be a non-negative integer.',
            success: null
        });
    }

    // Update current organization's settings
    db.prepare(`
        UPDATE organizations
        SET default_threshold = ?
        WHERE id = ?
    `).run(
        Number(threshold),
        user.organization_id
    );

    res.redirect('/settings?updated=1');

});

module.exports = router;
