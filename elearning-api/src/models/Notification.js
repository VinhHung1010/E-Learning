const pool = require('../config/database');

class Notification {
    static async create({ user_id, title, body, type = 'system' }) {
        const [result] = await pool.query(
            'INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, ?)',
            [user_id, title, body || null, type]
        );
        return { id: result.insertId };
    }

    static async getByUserId(userId, { unreadOnly = false, limit = 50 } = {}) {
        let query = 'SELECT * FROM notifications WHERE user_id = ?';
        const params = [userId];
        if (unreadOnly) {
            query += ' AND is_read = 0';
        }
        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(Number(limit));
        const [rows] = await pool.query(query, params);
        return rows;
    }

    static async unreadCount(userId) {
        const [rows] = await pool.query(
            'SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0',
            [userId]
        );
        return rows[0].c;
    }

    static async markRead(userId, id) {
        const [result] = await pool.query(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async markAllRead(userId) {
        await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [userId]);
        return true;
    }
}

module.exports = Notification;
