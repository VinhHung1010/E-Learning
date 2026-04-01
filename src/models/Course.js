const pool = require('../config/database');

class Course {
    static async getAll(filters = {}) {
        let query = `
            SELECT c.*, cat.name as category_name,
            (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count
            FROM courses c
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.category_id) {
            query += ' AND c.category_id = ?';
            params.push(filters.category_id);
        }

        if (filters.search) {
            query += ' AND (c.title LIKE ? OR c.description LIKE ?)';
            params.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        if (filters.min_price !== undefined) {
            query += ' AND c.price >= ?';
            params.push(filters.min_price);
        }

        if (filters.max_price !== undefined) {
            query += ' AND c.price <= ?';
            params.push(filters.max_price);
        }

        query += ' ORDER BY c.created_at DESC';

        const [rows] = await pool.query(query, params);
        return rows;
    }

    static async getById(id) {
        const [rows] = await pool.query(`
            SELECT c.*, cat.name as category_name,
            (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count,
            (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) as student_count
            FROM courses c
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.id = ?
        `, [id]);
        return rows[0];
    }

    static async getFeatured(limit = 10) {
        const [rows] = await pool.query(`
            SELECT c.*, cat.name as category_name,
            (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count
            FROM courses c
            LEFT JOIN categories cat ON c.category_id = cat.id
            ORDER BY c.average_rating DESC, c.review_count DESC
            LIMIT ?
        `, [limit]);
        return rows;
    }

    static async create(courseData) {
        const { title, description, category_id, price = 0, thumbnail } = courseData;
        const [result] = await pool.query(
            'INSERT INTO courses (title, description, category_id, price, thumbnail) VALUES (?, ?, ?, ?, ?)',
            [title, description, category_id, price, thumbnail]
        );
        return { id: result.insertId, title, description, category_id, price, thumbnail };
    }

    static async update(id, courseData) {
        const { title, description, category_id, price, thumbnail } = courseData;
        const [result] = await pool.query(
            'UPDATE courses SET title = ?, description = ?, category_id = ?, price = ?, thumbnail = ? WHERE id = ?',
            [title, description, category_id, price, thumbnail, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM courses WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async updateRating(courseId) {
        const [rows] = await pool.query(`
            SELECT AVG(rating) as avg_rating, COUNT(*) as count
            FROM course_reviews
            WHERE course_id = ? AND status = 'approved'
        `, [courseId]);

        if (rows[0].count > 0) {
            await pool.query(
                'UPDATE courses SET average_rating = ?, review_count = ? WHERE id = ?',
                [rows[0].avg_rating, rows[0].count, courseId]
            );
        }
    }

    static async getByCategory(categoryId, limit = 10) {
        const [rows] = await pool.query(`
            SELECT c.*, cat.name as category_name,
            (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as lesson_count
            FROM courses c
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.category_id = ?
            ORDER BY c.created_at DESC
            LIMIT ?
        `, [categoryId, limit]);
        return rows;
    }
}

module.exports = Course;
