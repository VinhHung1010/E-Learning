const pool = require('../config/database');

class Wishlist {
    static async getByUserId(userId) {
        const [rows] = await pool.query(`
            SELECT w.*, c.title as course_title, c.description as course_description, 
                   c.thumbnail as course_thumbnail, c.price as course_price, 
                   c.lesson_count, c.average_rating, c.category_id,
                   cat.name as category_name
            FROM wishlists w
            JOIN courses c ON w.course_id = c.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC
        `, [userId]);
        return rows;
    }

    static async add(userId, courseId) {
        // Check if already exists
        const [existing] = await pool.query(
            'SELECT id FROM wishlists WHERE user_id = ? AND course_id = ?',
            [userId, courseId]
        );
        
        if (existing.length > 0) {
            return { id: existing[0].id, already_exists: true };
        }
        
        const [result] = await pool.query(
            'INSERT INTO wishlists (user_id, course_id) VALUES (?, ?)',
            [userId, courseId]
        );
        return { id: result.insertId, already_exists: false };
    }

    static async remove(userId, courseId) {
        const [result] = await pool.query(
            'DELETE FROM wishlists WHERE user_id = ? AND course_id = ?',
            [userId, courseId]
        );
        return result.affectedRows > 0;
    }

    static async check(userId, courseId) {
        const [rows] = await pool.query(
            'SELECT id FROM wishlists WHERE user_id = ? AND course_id = ?',
            [userId, courseId]
        );
        return rows.length > 0;
    }

    static async count(userId) {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as count FROM wishlists WHERE user_id = ?',
            [userId]
        );
        return rows[0].count;
    }
}

module.exports = Wishlist;
