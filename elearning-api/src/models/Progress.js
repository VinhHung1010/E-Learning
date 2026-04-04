const pool = require('../config/database');

class Progress {
    static async getByLesson(userId, lessonId) {
        const [rows] = await pool.query(
            'SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?',
            [userId, lessonId]
        );
        return rows[0] || null;
    }

    static async getByCourse(userId, courseId) {
        const [rows] = await pool.query(`
            SELECT lp.*, l.title as lesson_title, l.position as lesson_position,
                   l.video_url, l.content
            FROM lesson_progress lp
            LEFT JOIN lessons l ON lp.lesson_id = l.id
            WHERE lp.user_id = ? AND l.course_id = ?
            ORDER BY l.position ASC
        `, [userId, courseId]);
        return rows;
    }

    static async upsert({ user_id, lesson_id, is_completed = 0, progress_percent = 0, last_position = 0 }) {
        const [existing] = await pool.query(
            'SELECT id FROM lesson_progress WHERE user_id = ? AND lesson_id = ?',
            [user_id, lesson_id]
        );

        if (existing.length > 0) {
            await pool.query(
                'UPDATE lesson_progress SET is_completed = ?, progress_percent = ?, last_position = ? WHERE user_id = ? AND lesson_id = ?',
                [is_completed, progress_percent, last_position, user_id, lesson_id]
            );
            return existing[0].id;
        } else {
            const [result] = await pool.query(
                'INSERT INTO lesson_progress (user_id, lesson_id, is_completed, progress_percent, last_position) VALUES (?, ?, ?, ?, ?)',
                [user_id, lesson_id, is_completed, progress_percent, last_position]
            );
            return result.insertId;
        }
    }

    static async markCompleted(userId, lessonId) {
        const [result] = await pool.query(
            'UPDATE lesson_progress SET is_completed = 1, progress_percent = 100 WHERE user_id = ? AND lesson_id = ?',
            [userId, lessonId]
        );
        return result.affectedRows > 0;
    }

    static async deleteByCourse(userId, courseId) {
        const [result] = await pool.query(`
            DELETE lp FROM lesson_progress lp
            JOIN lessons l ON lp.lesson_id = l.id
            WHERE lp.user_id = ? AND l.course_id = ?
        `, [userId, courseId]);
        return result.affectedRows;
    }

    static async getCourseStats(userId, courseId) {
        const [rows] = await pool.query(`
            SELECT
                COUNT(l.id) as total_lessons,
                SUM(CASE WHEN lp.is_completed = 1 THEN 1 ELSE 0 END) as completed_lessons,
                ROUND(SUM(CASE WHEN lp.is_completed = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(l.id), 0), 1) as completion_percent
            FROM lessons l
            LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = ?
            WHERE l.course_id = ?
        `, [userId, courseId]);
        return rows[0];
    }

    static async getUserStats(userId) {
        const [rows] = await pool.query(`
            SELECT
                COUNT(DISTINCT e.course_id) as enrolled_courses,
                SUM(CASE WHEN lp.is_completed = 1 THEN 1 ELSE 0 END) as completed_lessons,
                COUNT(DISTINCT lp.lesson_id) as lessons_started
            FROM enrollments e
            LEFT JOIN lessons l ON l.course_id = e.course_id
            LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.user_id = ?
            WHERE e.user_id = ?
        `, [userId, userId]);
        return rows[0];
    }

    static async getRecentActivity(userId, limit = 10) {
        const [rows] = await pool.query(`
            SELECT lp.*, l.title as lesson_title, c.title as course_title, l.course_id
            FROM lesson_progress lp
            LEFT JOIN lessons l ON lp.lesson_id = l.id
            LEFT JOIN courses c ON l.course_id = c.id
            WHERE lp.user_id = ?
            ORDER BY lp.updated_at DESC
            LIMIT ?
        `, [userId, limit]);
        return rows;
    }
}

module.exports = Progress;
