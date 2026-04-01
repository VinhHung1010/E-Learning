const express = require('express');
const Report = require('../models/Report');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Tất cả routes đều yêu cầu admin
router.use(auth, adminOnly);

// Thống kê tổng quan
router.get('/overview', async (req, res) => {
    try {
        const overview = await Report.getOverview();
        res.json(overview);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Thống kê theo ngày
router.get('/daily', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const stats = await Report.getDailyStats(days);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Thống kê theo tháng
router.get('/monthly', async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 12;
        const stats = await Report.getMonthlyStats(months);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Top khóa học
router.get('/top-courses', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const courses = await Report.getTopCourses(limit);
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Top khóa học doanh thu
router.get('/top-revenue', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const courses = await Report.getTopRevenueCourses(limit);
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Top giảng viên
router.get('/top-instructors', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const instructors = await Report.getTopInstructors(limit);
        res.json(instructors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Thống kê danh mục
router.get('/categories', async (req, res) => {
    try {
        const stats = await Report.getCategoryStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Học viên hoạt động
router.get('/active-students', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const students = await Report.getActiveStudents(days);
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Chi tiết khóa học
router.get('/course/:id', async (req, res) => {
    try {
        const course = await Report.getCourseDetails(req.params.id);
        
        if (!course) {
            return res.status(404).json({ error: 'Không tìm thấy khóa học' });
        }
        
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Tỷ lệ hoàn thành
router.get('/completion', async (req, res) => {
    try {
        const stats = await Report.getCompletionByCourse();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
