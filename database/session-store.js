
const session = require('express-session');
const db = require('./db');

class SQLiteSessionStore extends session.Store {

    constructor() {
        super();

        // Create sessions table
        db.exec(`
            CREATE TABLE IF NOT EXISTS sessions (
                sid TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                expires_at INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_sessions_expiry
            ON sessions(expires_at);
        `);

        // Remove expired sessions every 15 minutes
        const cleanupTimer = setInterval(() => {
            try {
                db.prepare(`
                    DELETE FROM sessions
                    WHERE expires_at <= ?
                `).run(Date.now());
            } catch (error) {
                console.error('Session cleanup error:', error);
            }
        }, 15 * 60 * 1000);

        cleanupTimer.unref();
    }

    // Calculate session expiry
    getExpiry(sessionData) {
        return sessionData.cookie?.expires
            ? new Date(sessionData.cookie.expires).getTime()
            : Date.now() + 24 * 60 * 60 * 1000;
    }

    // Retrieve session
    get(sid, callback) {
        try {
            const row = db.prepare(`
                SELECT data FROM sessions
                WHERE sid = ? AND expires_at > ?
            `).get(sid, Date.now());

            callback(null, row ? JSON.parse(row.data) : null);

        } catch (error) {
            callback(error);
        }
    }

    // Create or update session
    set(sid, sessionData, callback = () => { }) {
        try {
            db.prepare(`
                INSERT INTO sessions (sid, data, expires_at)
                VALUES (?, ?, ?)
                ON CONFLICT(sid) DO UPDATE SET
                    data = excluded.data,
                    expires_at = excluded.expires_at
            `).run(
                sid,
                JSON.stringify(sessionData),
                this.getExpiry(sessionData)
            );

            callback(null);

        } catch (error) {
            callback(error);
        }
    }

    // Delete session during logout
    destroy(sid, callback = () => { }) {
        try {
            db.prepare(`
                DELETE FROM sessions WHERE sid = ?
            `).run(sid);

            callback(null);

        } catch (error) {
            callback(error);
        }
    }

    // Update session expiration
    touch(sid, sessionData, callback = () => { }) {
        try {
            db.prepare(`
                UPDATE sessions
                SET expires_at = ?
                WHERE sid = ?
            `).run(
                this.getExpiry(sessionData),
                sid
            );

            callback(null);

        } catch (error) {
            callback(error);
        }
    }
}

module.exports = SQLiteSessionStore;
