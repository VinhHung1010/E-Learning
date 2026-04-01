const express = require('express');
const pool = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Lấy tiến độ theo khóa học
router.get('/course/:courseId', auth, async (req, res) => {
    try {
        const [progress] = await pool.query(`
            SELECT lp.*, l.title as lesson_title, l.position
            FROM lesson_progress lp
            JOIN lessons l ON lp.lesson_id = l.id
            WHERE lp.user_id = ? AND l.course_id = ?
            ORDER BY l.position ASC
        `, [req.user.id, req.params.courseId]);
        
        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cập nhật tiến độ bài học
router.post('/lesson/:lessonId', auth, async (req, res) => {
    try {
        const { progress_percent, last_position } = req.body;
        
        // Kiểm tra lesson tồn tại
        const [lessons] = await pool.query('SELECT id, course_id FROM lessons WHERE id = ?', [req.params.lessonId]);
        if (lessons.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bài học' });
        }
        
        // Kiểm tra user đã đăng ký khóa học chưa
        const [enrollments] = await pool.query(
            'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND status = "active"',
            [req.user.id, lessons[0].course_id]
        );
        if (enrollments.length === 0) {
            return res.status(403).json({ error: 'Bạn chưa đăng ký khóa học này' });
        }
        
        // Upsert tiến độ
        await pool.query(`
            INSERT INTO lesson_progress (user_id, lesson_id, progress_percent, last_position)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                progress_percent = VALUES(progress_percent),
                last_position = VALUES(last_position),
                updated_at = CURRENT_TIMESTAMP
        `, [req.user.id, req.params.lessonId, progress_percent || 0, last_position || 0]);
        
        res.json({ message: 'Cập nhật tiến độ thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Đánh dấu hoàn thành bài học
router.post('/lesson/:lessonId/complete', auth, async (req, res) => {
    try {
        // Kiểm tra lesson tồn tại
        const [lessons] = await pool.query('SELECT id, course_id FROM lessons WHERE id = ?', [req.params.lessonId]);
        if (lessons.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bài học' });
        }
        
        // Upsert tiến độ với is_completed = 1
        await pool.query(`
            INSERT INTO lesson_progress (user_id, lesson_id, is_completed, progress_percent)
            VALUES (?, ?, 1, 100)
            ON DUPLICATE KEY UPDATE 
                is_completed = 1,
                progress_percent = 100,
                updated_at = CURRENT_TIMESTAMP
        `, [req.user.id, req.params.lessonId]);
        
        res.json({ message: 'Đã đánh dấu hoàn thành' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Lấy % hoàn thành khóa học
router.get('/course/:courseId/stats', auth, async (req, res) => {
    try {
        // Đếm tổng bài học
        const [total] = await pool.query(
            'SELECT COUNT(*) as total FROM lessons WHERE course_id = ?',
            [req.params.courseId]
        );
        
        // Đếm bài đã hoàn thành
        const [completed] = await pool.query(`
            SELECT COUNT(*) as completed 
            FROM lesson_progress lp
            JOIN lessons l ON lp.lesson_id = l.id
            WHERE lp.user_id = ? AND l.course_id = ? AND lp.is_completed = 1
        `, [req.user.id, req.params.courseId]);
        
        const percent = total[0].total > 0 
            ? Math.round((completed[0].completed / total[0].total) * 100) 
            : 0;
        
        res.json({
            total_lessons: total[0].total,
            completed_lessons: completed[0].completed,
            percent: percent
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
