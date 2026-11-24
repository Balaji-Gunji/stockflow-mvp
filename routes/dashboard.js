
const express = require('express');
const db = require('../database/db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Protect dashboard route
router.use(requireAuth);

// GET Dashboard
router.get('/', (req, res) => {

    const user = req.session.user;
    const organizationId = user.organization_id;

    // Calculate inventory statistics
    const stats = db.prepare(`
        SELECT
            COUNT(p.id) AS total_products,

            COALESCE(SUM(p.quantity), 0) AS total_quantity,

            COUNT(
                CASE
                    WHEN p.quantity <= COALESCE(
                        p.low_stock_threshold,
                        o.default_threshold
                    )
                    THEN 1
                END
            ) AS low_stock_count

        FROM products p

        JOIN organizations o
            ON p.organization_id = o.id

        WHERE p.organization_id = ?
    `).get(organizationId);

    // Get low stock products
    const lowStockProducts = db.prepare(`
        SELECT
            p.id,
            p.name,
            p.sku,
            p.quantity,

            COALESCE(
                p.low_stock_threshold,
                o.default_threshold
            ) AS effective_threshold

        FROM products p

        JOIN organizations o
            ON p.organization_id = o.id

        WHERE p.organization_id = ?

        AND p.quantity <= COALESCE(
            p.low_stock_threshold,
            o.default_threshold
        )

        ORDER BY p.quantity ASC, p.name ASC

    `).all(organizationId);

    // Render dashboard page
    res.render('dashboard', {
        user,
        stats,
        lowStockProducts
    });

});

module.exports = router;
