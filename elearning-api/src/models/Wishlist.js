const pool = require('../config/database');

class Wishlist {
    static async getByUserId(userId) {
        const [rows] = await pool.query(
            `
            SELECT w.id, w.course_id, w.created_at, c.title, c.price, c.thumbnail, cat.name AS category_name,
            (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) AS lesson_count
            FROM wishlists w
            JOIN courses c ON c.id = w.course_id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC
        `,
            [userId]
        );
        return rows;
    }

    static async getCourseIds(userId) {
        const [rows] = await pool.query('SELECT course_id FROM wishlists WHERE user_id = ?', [userId]);
        return rows.map((r) => r.course_id);
    }

    static async has(userId, courseId) {
        const [rows] = await pool.query(
            'SELECT id FROM wishlists WHERE user_id = ? AND course_id = ? LIMIT 1',
            [userId, courseId]
        );
        return rows.length > 0;
    }

    static async add(userId, courseId) {
        const [result] = await pool.query('INSERT INTO wishlists (user_id, course_id) VALUES (?, ?)', [
            userId,
            courseId
        ]);
        return result.affectedRows > 0;
    }

    static async remove(userId, courseId) {
        const [result] = await pool.query('DELETE FROM wishlists WHERE user_id = ? AND course_id = ?', [
            userId,
            courseId
        ]);
        return result.affectedRows > 0;
    }
}

module.exports = Wishlist;
