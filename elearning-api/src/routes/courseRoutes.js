const express = require('express');
const Course = require('../models/Course');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { category_id, search, min_price, max_price } = req.query;
        const filters = { category_id, search, min_price, max_price };
        const courses = await Course.getAll(filters);
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/featured', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const courses = await Course.getFeatured(limit);
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/category/:categoryId', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const courses = await Course.getByCategory(req.params.categoryId, limit);
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const course = await Course.getById(req.params.id);
        if (!course) {
            return res.status(404).json({ error: 'Không tìm thấy khóa học' });
        }
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', auth, isAdmin, async (req, res) => {
    try {
        const { title, description, category_id, price, thumbnail } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: 'Tiêu đề không được để trống' });
        }

        const course = await Course.create({ title, description, category_id, price, thumbnail });
        res.status(201).json({ message: 'Tạo khóa học thành công', course });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { title, description, category_id, price, thumbnail } = req.body;
        const updated = await Course.update(req.params.id, { title, description, category_id, price, thumbnail });
        
        if (!updated) {
            return res.status(404).json({ error: 'Không tìm thấy khóa học' });
        }
        
        const course = await Course.getById(req.params.id);
        res.json({ message: 'Cập nhật khóa học thành công', course });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const deleted = await Course.delete(req.params.id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Không tìm thấy khóa học' });
        }
        
        res.json({ message: 'Xóa khóa học thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
