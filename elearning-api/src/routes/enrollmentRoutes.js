const express = require('express');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const { user_id, course_id, status } = req.query;
            const enrollments = await Enrollment.getAll({ user_id, course_id, status });
            res.json(enrollments);
        } else {
            const enrollments = await Enrollment.getByUserId(req.user.id);
            res.json(enrollments);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/user/:userId', auth, isAdmin, async (req, res) => {
    try {
        const enrollments = await Enrollment.getByUserId(req.params.userId);
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/course/:courseId', auth, async (req, res) => {
    try {
        const enrollments = await Enrollment.getByCourseId(req.params.courseId);
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/my-courses', auth, async (req, res) => {
    try {
        const enrollments = await Enrollment.getByUserId(req.user.id);
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const enrollment = await Enrollment.getById(req.params.id);
        if (!enrollment) {
            return res.status(404).json({ error: 'Không tìm thấy đăng ký' });
        }
        if (req.user.role !== 'admin' && enrollment.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Bạn không có quyền truy cập' });
        }
        res.json(enrollment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({ error: 'Course ID không được để trống' });
        }

        const isEnrolled = await Enrollment.isEnrolled(req.user.id, course_id);
        if (isEnrolled) {
            return res.status(400).json({ error: 'Bạn đã đăng ký khóa học này' });
        }

        const course = await Course.getById(course_id);
        if (!course) {
            return res.status(404).json({ error: 'Không tìm thấy khóa học' });
        }

        const enrollment = await Enrollment.create({
            user_id: req.user.id,
            course_id,
            status: course.price > 0 ? 'pending' : 'active'
        });

        const title =
            enrollment.status === 'active' ? 'Đăng ký thành công' : 'Đăng ký đang chờ xử lý';
        const body =
            enrollment.status === 'active'
                ? `Bạn đã đăng ký khóa "${course.title}". Vào mục Khóa học của tôi để bắt đầu học.`
                : `Đăng ký khóa "${course.title}" đang chờ thanh toán hoặc kích hoạt từ quản trị viên.`;
        await Notification.create({
            user_id: req.user.id,
            title,
            body,
            type: 'enrollment'
        });

        res.status(201).json({ message: 'Đăng ký khóa học thành công', enrollment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const prev = await Enrollment.getById(req.params.id);
        if (!prev) {
            return res.status(404).json({ error: 'Không tìm thấy đăng ký' });
        }

        const updated = await Enrollment.update(req.params.id, { status });

        if (!updated) {
            return res.status(404).json({ error: 'Không tìm thấy đăng ký' });
        }

        if (status === 'active' && prev.status === 'pending') {
            await Notification.create({
                user_id: prev.user_id,
                title: 'Khóa học đã được kích hoạt',
                body: `Đăng ký khóa "${prev.course_title || 'khóa học'}" đã được duyệt. Bạn có thể vào Khóa học của tôi để học.`,
                type: 'enrollment'
            });
        }

        const enrollment = await Enrollment.getById(req.params.id);
        res.json({ message: 'Cập nhật đăng ký thành công', enrollment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const deleted = await Enrollment.delete(req.params.id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Không tìm thấy đăng ký' });
        }
        
        res.json({ message: 'Xóa đăng ký thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
