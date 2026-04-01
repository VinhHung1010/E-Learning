const express = require('express');
const Category = require('../models/Category');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const categories = await Category.getAll();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const category = await Category.getById(req.params.id);
        if (!category) {
            return res.status(404).json({ error: 'Không tìm thấy danh mục' });
        }
        const courseCount = await Category.getCourseCount(req.params.id);
        res.json({ ...category, course_count: courseCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', auth, isAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Tên danh mục không được để trống' });
        }
        const category = await Category.create({ name });
        res.status(201).json({ message: 'Tạo danh mục thành công', category });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { name } = req.body;
        const updated = await Category.update(req.params.id, { name });
        if (!updated) {
            return res.status(404).json({ error: 'Không tìm thấy danh mục' });
        }
        const category = await Category.getById(req.params.id);
        res.json({ message: 'Cập nhật danh mục thành công', category });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const deleted = await Category.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Không tìm thấy danh mục' });
        }
        res.json({ message: 'Xóa danh mục thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
