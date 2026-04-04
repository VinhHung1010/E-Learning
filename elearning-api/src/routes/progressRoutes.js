const express = require('express');
const Progress = require('../models/Progress');
const Enrollment = require('../models/Enrollment');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/lesson/:lessonId', async (req, res) => {
    try {
        const progress = await Progress.getByLesson(req.user.id, req.params.lessonId);
        res.json(progress || {
            user_id: req.user.id,
            lesson_id: parseInt(req.params.lessonId),
            is_completed: 0,
            progress_percent: 0,
            last_position: 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/course/:courseId', async (req, res) => {
    try {
        const progress = await Progress.getByCourse(req.user.id, req.params.courseId);
        const stats = await Progress.getCourseStats(req.user.id, req.params.courseId);
        res.json({ progress, stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/course/:courseId/stats', async (req, res) => {
    try {
        const stats = await Progress.getCourseStats(req.user.id, req.params.courseId);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/lesson/:lessonId', async (req, res) => {
    try {
        const { is_completed, progress_percent, last_position } = req.body;
        const enrollment = await Enrollment.isEnrolled(req.user.id, req.params.courseId || req.body.course_id);

        if (!enrollment) {
            return res.status(403).json({ error: 'Bạn chưa đăng ký khóa học này' });
        }

        const id = await Progress.upsert({
            user_id: req.user.id,
            lesson_id: req.params.lessonId,
            is_completed: is_completed ? 1 : 0,
            progress_percent: progress_percent || 0,
            last_position: last_position || 0
        });

        const updated = await Progress.getByLesson(req.user.id, req.params.lessonId);
        res.json({ message: 'Cập nhật tiến độ thành công', progress: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/lesson/:lessonId/complete', async (req, res) => {
    try {
        const enrollment = await Enrollment.isEnrolled(req.user.id, req.params.courseId || req.body.course_id);

        if (!enrollment) {
            return res.status(403).json({ error: 'Bạn chưa đăng ký khóa học này' });
        }

        const id = await Progress.upsert({
            user_id: req.user.id,
            lesson_id: req.params.lessonId,
            is_completed: 1,
            progress_percent: 100,
            last_position: 0
        });

        const updated = await Progress.getByLesson(req.user.id, req.params.lessonId);
        res.json({ message: 'Đánh dấu hoàn thành thành công', progress: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/stats', async (req, res) => {
    try {
        const stats = await Progress.getUserStats(req.user.id);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const activity = await Progress.getRecentActivity(req.user.id, limit);
        res.json(activity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
