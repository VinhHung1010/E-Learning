const express = require('express');
const Lesson = require('../models/Lesson');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { course_id } = req.query;
        const lessons = await Lesson.getAll(course_id);
        res.json(lessons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/course/:courseId', async (req, res) => {
    try {
        const lessons = await Lesson.getByCourseId(req.params.courseId);
        res.json(lessons);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const lesson = await Lesson.getById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ error: 'Không tìm thấy bài học' });
        }
        res.json(lesson);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', auth, isAdmin, async (req, res) => {
    try {
        const { course_id, title, content, video_url, position } = req.body;
        
        if (!course_id || !title) {
            return res.status(400).json({ error: 'Course ID và tiêu đề không được để trống' });
        }

        let finalPosition = position;
        if (!finalPosition) {
            finalPosition = await Lesson.getNextPosition(course_id);
        }

        const lesson = await Lesson.create({ course_id, title, content, video_url, position: finalPosition });
        res.status(201).json({ message: 'Tạo bài học thành công', lesson });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { title, content, video_url, position } = req.body;
        const updated = await Lesson.update(req.params.id, { title, content, video_url, position });
        
        if (!updated) {
            return res.status(404).json({ error: 'Không tìm thấy bài học' });
        }
        
        const lesson = await Lesson.getById(req.params.id);
        res.json({ message: 'Cập nhật bài học thành công', lesson });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/reorder/:courseId', auth, isAdmin, async (req, res) => {
    try {
        const { lessons } = req.body;
        if (!lessons || !Array.isArray(lessons)) {
            return res.status(400).json({ error: 'Dữ liệu sắp xếp không hợp lệ' });
        }
        await Lesson.updatePositions(lessons);
        res.json({ message: 'Sắp xếp bài học thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const deleted = await Lesson.delete(req.params.id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Không tìm thấy bài học' });
        }
        
        res.json({ message: 'Xóa bài học thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
