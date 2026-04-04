const express = require('express');
const Wishlist = require('../models/Wishlist');
const Course = require('../models/Course');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/ids', auth, async (req, res) => {
    try {
        const course_ids = await Wishlist.getCourseIds(req.user.id);
        res.json({ course_ids });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/check/:courseId', auth, async (req, res) => {
    try {
        const in_wishlist = await Wishlist.has(req.user.id, req.params.courseId);
        res.json({ in_wishlist });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const items = await Wishlist.getByUserId(req.user.id);
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { course_id } = req.body;
        if (!course_id) {
            return res.status(400).json({ error: 'Thiếu course_id' });
        }

        const course = await Course.getById(course_id);
        if (!course) {
            return res.status(404).json({ error: 'Không tìm thấy khóa học' });
        }

        const exists = await Wishlist.has(req.user.id, course_id);
        if (exists) {
            return res.status(400).json({ error: 'Khóa học đã có trong yêu thích' });
        }

        await Wishlist.add(req.user.id, course_id);
        res.status(201).json({ message: 'Đã thêm vào yêu thích' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/course/:courseId', auth, async (req, res) => {
    try {
        const removed = await Wishlist.remove(req.user.id, req.params.courseId);
        if (!removed) {
            return res.status(404).json({ error: 'Không có trong yêu thích' });
        }
        res.json({ message: 'Đã xóa khỏi yêu thích' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
