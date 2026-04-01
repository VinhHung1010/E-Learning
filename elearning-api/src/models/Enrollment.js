const pool = require('../config/database');

class Enrollment {
    static async getAll(filters = {}) {
        let query = `
            SELECT e.*, u.name as user_name, u.email as user_email, 
            c.title as course_title, c.price as course_price,
            cat.name as category_name
            FROM enrollments e
            LEFT JOIN users u ON e.user_id = u.id
            LEFT JOIN courses c ON e.course_id = c.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.user_id) {
            query += ' AND e.user_id = ?';
            params.push(filters.user_id);
        }

        if (filters.course_id) {
            query += ' AND e.course_id = ?';
            params.push(filters.course_id);
        }

        if (filters.status) {
            query += ' AND e.status = ?';
            params.push(filters.status);
        }

        query += ' ORDER BY e.enrolled_at DESC';

        const [rows] = await pool.query(query, params);
        return rows;
    }

    static async getById(id) {
        const [rows] = await pool.query(`
            SELECT e.*, u.name as user_name, u.email as user_email, 
            c.title as course_title, c.price as course_price,
            cat.name as category_name
            FROM enrollments e
            LEFT JOIN users u ON e.user_id = u.id
            LEFT JOIN courses c ON e.course_id = c.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE e.id = ?
        `, [id]);
        return rows[0];
    }

    static async getByUserId(userId) {
        const [rows] = await pool.query(`
            SELECT e.*, c.title as course_title, c.thumbnail as course_thumbnail,
            c.description as course_description, c.price as course_price,
            cat.name as category_name,
            (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons
            FROM enrollments e
            LEFT JOIN courses c ON e.course_id = c.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE e.user_id = ?
            ORDER BY e.enrolled_at DESC
        `, [userId]);
        return rows;
    }

    static async getByCourseId(courseId) {
        const [rows] = await pool.query(`
            SELECT e.*, u.name as user_name, u.email as user_email
            FROM enrollments e
            LEFT JOIN users u ON e.user_id = u.id
            WHERE e.course_id = ?
            ORDER BY e.enrolled_at DESC
        `, [courseId]);
        return rows;
    }

    static async create(enrollmentData) {
        const { user_id, course_id, status = 'pending' } = enrollmentData;
        const [result] = await pool.query(
            'INSERT INTO enrollments (user_id, course_id, status) VALUES (?, ?, ?)',
            [user_id, course_id, status]
        );
        return { id: result.insertId, user_id, course_id, status };
    }

    static async update(id, enrollmentData) {
        const { status } = enrollmentData;
        const [result] = await pool.query(
            'UPDATE enrollments SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM enrollments WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async isEnrolled(userId, courseId) {
        const [rows] = await pool.query(
            'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
            [userId, courseId]
        );
        return rows.length > 0;
    }

    static async countByCourse(courseId) {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as count FROM enrollments WHERE course_id = ? AND status = "active"',
            [courseId]
        );
        return rows[0].count;
    }

    static async countByUser(userId) {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as count FROM enrollments WHERE user_id = ? AND status = "active"',
            [userId]
        );
        return rows[0].count;
    }
}

module.exports = Enrollment;
