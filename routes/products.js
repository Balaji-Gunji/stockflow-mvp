
const express = require('express');
const db = require('../database/db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Protect all product routes
router.use(requireAuth);

// Validate product input
function validateProduct(body) {
    const product = {
        name: String(body.name || '').trim(),
        sku: String(body.sku || '').trim(),
        description: String(body.description || '').trim(),
        quantity: String(body.quantity ?? '').trim(),
        cost_price: String(body.cost_price ?? '').trim(),
        selling_price: String(body.selling_price ?? '').trim(),
        low_stock_threshold: String(
            body.low_stock_threshold ?? ''
        ).trim()
    };

    if (!product.name || !product.sku) {
        return { error: 'Product name and SKU are required.', product };
    }

    if (!/^\d+$/.test(product.quantity) ||
        !Number.isSafeInteger(Number(product.quantity))) {
        return {
            error: 'Quantity must be a non-negative integer.',
            product
        };
    }

    for (const field of ['cost_price', 'selling_price']) {
        if (product[field] !== '' &&
            (!Number.isFinite(Number(product[field])) ||
                Number(product[field]) < 0)) {
            return {
                error: 'Prices must be non-negative numbers.',
                product
            };
        }
    }

    if (product.low_stock_threshold !== '' &&
        (!/^\d+$/.test(product.low_stock_threshold) ||
            !Number.isSafeInteger(Number(product.low_stock_threshold)))) {
        return {
            error: 'Low stock threshold must be a non-negative integer.',
            product
        };
    }

    product.quantity = Number(product.quantity);

    for (const field of [
        'cost_price',
        'selling_price',
        'low_stock_threshold'
    ]) {
        product[field] = product[field] === ''
            ? null
            : Number(product[field]);
    }

    return { error: null, product };
}

// READ: List and search products
router.get('/', (req, res) => {
    const user = req.session.user;
    const search = String(req.query.search || '').trim();

    const products = db.prepare(`
        SELECT p.*,
            COALESCE(
                p.low_stock_threshold,
                o.default_threshold
            ) AS effective_threshold
        FROM products p
        JOIN organizations o
            ON p.organization_id = o.id
        WHERE p.organization_id = ?
        AND (p.name LIKE ? OR p.sku LIKE ?)
        ORDER BY p.created_at DESC, p.id DESC
    `).all(
        user.organization_id,
        `%${search}%`,
        `%${search}%`
    );

    res.render('products', {
        user,
        products,
        search
    });
});

// Display add product form
router.get('/add', (req, res) => {
    res.render('add-product', {
        user: req.session.user,
        error: null,
        product: {}
    });
});

// CREATE: Add new product
router.post('/add', (req, res, next) => {
    const user = req.session.user;
    const { error, product } = validateProduct(req.body);

    if (error) {
        return res.status(400).render('add-product', {
            user, error, product
        });
    }

    try {
        db.prepare(`
            INSERT INTO products (
                organization_id,
                name,
                sku,
                description,
                quantity,
                cost_price,
                selling_price,
                low_stock_threshold
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            user.organization_id,
            product.name,
            product.sku,
            product.description,
            product.quantity,
            product.cost_price,
            product.selling_price,
            product.low_stock_threshold
        );

        res.redirect('/products');

    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).render('add-product', {
                user,
                product,
                error: 'A product with this SKU already exists.'
            });
        }

        next(err);
    }
});

// Display edit product form
router.get('/edit/:id', (req, res) => {
    const user = req.session.user;

    const product = db.prepare(`
        SELECT * FROM products
        WHERE id = ? AND organization_id = ?
    `).get(req.params.id, user.organization_id);

    if (!product) {
        return res.status(404).send('Product not found.');
    }

    res.render('edit-product', {
        user,
        product,
        error: null
    });
});

// UPDATE: Edit existing product
router.post('/edit/:id', (req, res, next) => {
    const user = req.session.user;
    const id = req.params.id;

    const existing = db.prepare(`
        SELECT id FROM products
        WHERE id = ? AND organization_id = ?
    `).get(id, user.organization_id);

    if (!existing) {
        return res.status(404).send('Product not found.');
    }

    const { error, product } = validateProduct(req.body);
    product.id = existing.id;

    if (error) {
        return res.status(400).render('edit-product', {
            user, error, product
        });
    }

    try {
        const result = db.prepare(`
            UPDATE products
            SET name = ?,
                sku = ?,
                description = ?,
                quantity = ?,
                cost_price = ?,
                selling_price = ?,
                low_stock_threshold = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND organization_id = ?
        `).run(
            product.name,
            product.sku,
            product.description,
            product.quantity,
            product.cost_price,
            product.selling_price,
            product.low_stock_threshold,
            id,
            user.organization_id
        );

        if (!result.changes) {
            return res.status(404).send('Product not found.');
        }

        res.redirect('/products');

    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).render('edit-product', {
                user,
                product,
                error: 'A product with this SKU already exists.'
            });
        }

        next(err);
    }
});

// DELETE: Remove product
router.post('/delete/:id', (req, res) => {
    const user = req.session.user;

    const result = db.prepare(`
        DELETE FROM products
        WHERE id = ? AND organization_id = ?
    `).run(
        req.params.id,
        user.organization_id
    );

    if (!result.changes) {
        return res.status(404).send('Product not found.');
    }

    res.redirect('/products');
});

module.exports = router;
