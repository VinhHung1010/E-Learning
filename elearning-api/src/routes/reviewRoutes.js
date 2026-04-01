const express = require('express');
const db = require('../config/database');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all reviews (admin only)
router.get('/', auth, async (req, res) => {
    try {
        const { course_id, status, user_id } = req.query;
        
        let query = `
            SELECT r.*, u.name as user_name, c.title as course_title
            FROM course_reviews r
            JOIN users u ON r.user_id = u.id
            JOIN courses c ON r.course_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (course_id) {
            query += ' AND r.course_id = ?';
            params.push(course_id);
        }
        if (status) {
            query += ' AND r.status = ?';
            params.push(status);
        }
        if (user_id) {
            query += ' AND r.user_id = ?';
            params.push(user_id);
        }

        query += ' ORDER BY r.created_at DESC';

        const [reviews] = await db.query(query, params);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get reviews by course (public)
router.get('/course/:courseId', async (req, res) => {
    try {
        const query = `
            SELECT r.*, u.name as user_name
            FROM course_reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.course_id = ? AND r.status = 'approved'
            ORDER BY r.created_at DESC
        `;
        const [reviews] = await db.query(query, [req.params.courseId]);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create review
router.post('/', auth, async (req, res) => {
    try {
        const { course_id, rating, comment } = req.body;

        if (!course_id || !rating) {
            return res.status(400).json({ error: 'Vui lòng cung cấp course_id và rating' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating phải từ 1 đến 5' });
        }

        // Check if user is enrolled
        const [enrollments] = await db.query(
            'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ? AND status = "active"',
            [req.user.id, course_id]
        );

        if (enrollments.length === 0) {
            return res.status(403).json({ error: 'Bạn cần đăng ký khóa học trước' });
        }

        // Check if already reviewed
        const [existing] = await db.query(
            'SELECT * FROM course_reviews WHERE user_id = ? AND course_id = ?',
            [req.user.id, course_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Bạn đã đánh giá khóa học này' });
        }

        const [result] = await db.query(
            'INSERT INTO course_reviews (course_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
            [course_id, req.user.id, rating, comment || '']
        );

        // Update course average rating
        await updateCourseRating(course_id);

        res.status(201).json({ message: 'Đánh giá thành công', review_id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update review status (admin only)
router.put('/:id/status', auth, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
        }

        const [result] = await db.query(
            'UPDATE course_reviews SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đánh giá' });
        }

        res.json({ message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete review (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        // Get course_id before deleting
        const [reviews] = await db.query('SELECT course_id FROM course_reviews WHERE id = ?', [req.params.id]);
        
        if (reviews.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đánh giá' });
        }

        const courseId = reviews[0].course_id;

        const [result] = await db.query('DELETE FROM course_reviews WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đánh giá' });
        }

        // Update course average rating
        await updateCourseRating(courseId);

        res.json({ message: 'Xóa đánh giá thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper function to update course rating
async function updateCourseRating(courseId) {
    const [result] = await db.query(`
        UPDATE courses 
        SET average_rating = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM course_reviews 
            WHERE course_id = ? AND status = 'approved'
        ),
        review_count = (
            SELECT COUNT(*) 
            FROM course_reviews 
            WHERE course_id = ? AND status = 'approved'
        )
        WHERE id = ?
    `, [courseId, courseId, courseId]);
}

module.exports = router;
