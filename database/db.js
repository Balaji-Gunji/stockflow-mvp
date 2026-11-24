
const Database = require('better-sqlite3');
const path = require('path');

// Connect to SQLite database
const db = new Database(
    path.join(__dirname, 'stockflow.db')
);

// Enable WAL mode and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Organizations table
db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        default_threshold INTEGER NOT NULL DEFAULT 5
            CHECK (default_threshold >= 0),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Users table
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id INTEGER NOT NULL UNIQUE,
        email TEXT NOT NULL COLLATE NOCASE UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id)
            REFERENCES organizations(id)
    )
`);

// Products table
db.exec(`
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        organization_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        sku TEXT NOT NULL COLLATE NOCASE,
        description TEXT,
        quantity INTEGER NOT NULL DEFAULT 0
            CHECK (quantity >= 0),
        cost_price REAL CHECK (cost_price >= 0),
        selling_price REAL CHECK (selling_price >= 0),
        low_stock_threshold INTEGER
            CHECK (low_stock_threshold >= 0),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        UNIQUE (organization_id, sku),

        FOREIGN KEY (organization_id)
            REFERENCES organizations(id)
    )
`);

console.log('StockFlow database initialized successfully');

module.exports = db;
