const pool = require('../config/database');

class Lesson {
    static async getAll(courseId = null) {
        let query = `
            SELECT l.*, c.title as course_title
            FROM lessons l
            LEFT JOIN courses c ON l.course_id = c.id
        `;
        const params = [];
        
        if (courseId) {
            query += ' WHERE l.course_id = ?';
            params.push(courseId);
        }
        
        query += ' ORDER BY l.course_id, l.position ASC';
        
        const [rows] = await pool.query(query, params);
        return rows;
    }

    static async getById(id) {
        const [rows] = await pool.query(`
            SELECT l.*, c.title as course_title
            FROM lessons l
            LEFT JOIN courses c ON l.course_id = c.id
            WHERE l.id = ?
        `, [id]);
        return rows[0];
    }

    static async getByCourseId(courseId) {
        const [rows] = await pool.query(`
            SELECT l.*, 
            (SELECT COUNT(*) FROM comments WHERE lesson_id = l.id) as comment_count
            FROM lessons l
            WHERE l.course_id = ?
            ORDER BY l.position ASC
        `, [courseId]);
        return rows;
    }

    static async create(lessonData) {
        const { course_id, title, content, video_url, position } = lessonData;
        const [result] = await pool.query(
            'INSERT INTO lessons (course_id, title, content, video_url, position) VALUES (?, ?, ?, ?, ?)',
            [course_id, title, content, video_url, position || 0]
        );
        return { id: result.insertId, course_id, title, content, video_url, position: position || 0 };
    }

    static async update(id, lessonData) {
        const { title, content, video_url, position } = lessonData;
        const [result] = await pool.query(
            'UPDATE lessons SET title = ?, content = ?, video_url = ?, position = ? WHERE id = ?',
            [title, content, video_url, position, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM lessons WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getNextPosition(courseId) {
        const [rows] = await pool.query(
            'SELECT MAX(position) as max_pos FROM lessons WHERE course_id = ?',
            [courseId]
        );
        return (rows[0].max_pos || 0) + 1;
    }

    static async updatePositions(lessons) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            for (const lesson of lessons) {
                await connection.query(
                    'UPDATE lessons SET position = ? WHERE id = ?',
                    [lesson.position, lesson.id]
                );
            }
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = Lesson;
