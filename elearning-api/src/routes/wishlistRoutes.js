const express = require('express');
const Wishlist = require('../models/Wishlist');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách yêu thích
router.get('/', auth, async (req, res) => {
    try {
        const wishlists = await Wishlist.getByUserId(req.user.id);
        res.json(wishlists);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Kiểm tra khóa học có trong wishlist không
router.get('/check/:courseId', auth, async (req, res) => {
    try {
        const isInWishlist = await Wishlist.check(req.user.id, req.params.courseId);
        res.json({ isInWishlist });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Thêm vào wishlist
router.post('/', auth, async (req, res) => {
    try {
        const { course_id } = req.body;
        
        if (!course_id) {
            return res.status(400).json({ error: 'Course ID không được để trống' });
        }
        
        const result = await Wishlist.add(req.user.id, course_id);
        
        if (result.already_exists) {
            return res.status(400).json({ error: 'Khóa học đã có trong danh sách yêu thích' });
        }
        
        res.status(201).json({ message: 'Đã thêm vào danh sách yêu thích', wishlist_id: result.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Xóa khỏi wishlist
router.delete('/:courseId', auth, async (req, res) => {
    try {
        const deleted = await Wishlist.remove(req.user.id, req.params.courseId);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Không tìm thấy trong danh sách yêu thích' });
        }
        
        res.json({ message: 'Đã xóa khỏi danh sách yêu thích' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Toggle wishlist (thêm nếu chưa có, xóa nếu đã có)
router.post('/toggle/:courseId', auth, async (req, res) => {
    try {
        const isInWishlist = await Wishlist.check(req.user.id, req.params.courseId);
        
        if (isInWishlist) {
            await Wishlist.remove(req.user.id, req.params.courseId);
            res.json({ message: 'Đã xóa khỏi danh sách yêu thích', isInWishlist: false });
        } else {
            await Wishlist.add(req.user.id, req.params.courseId);
            res.json({ message: 'Đã thêm vào danh sách yêu thích', isInWishlist: true });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
