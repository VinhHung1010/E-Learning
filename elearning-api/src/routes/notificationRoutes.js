const express = require('express');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Lấy danh sách thông báo
router.get('/', auth, async (req, res) => {
    try {
        const { limit = 20, offset = 0, unread_only = false } = req.query;
        const notifications = await Notification.getByUserId(req.user.id, {
            limit: parseInt(limit),
            offset: parseInt(offset),
            unread_only: unread_only === 'true'
        });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Lấy số thông báo chưa đọc
router.get('/unread-count', auth, async (req, res) => {
    try {
        const count = await Notification.getUnreadCount(req.user.id);
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Lấy thông báo theo ID
router.get('/:id', auth, async (req, res) => {
    try {
        const notification = await Notification.getById(req.params.id);
        
        if (!notification) {
            return res.status(404).json({ error: 'Không tìm thấy thông báo' });
        }
        
        // Kiểm tra quyền sở hữu
        if (notification.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Bạn không có quyền xem thông báo này' });
        }
        
        res.json(notification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Đánh dấu đã đọc
router.put('/:id/read', auth, async (req, res) => {
    try {
        const marked = await Notification.markAsRead(req.params.id, req.user.id);
        
        if (!marked) {
            return res.status(404).json({ error: 'Không tìm thấy thông báo' });
        }
        
        res.json({ message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Đánh dấu tất cả đã đọc
router.put('/read-all', auth, async (req, res) => {
    try {
        const count = await Notification.markAllAsRead(req.user.id);
        res.json({ message: `Đã đánh dấu ${count} thông báo là đã đọc`, count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Xóa thông báo
router.delete('/:id', auth, async (req, res) => {
    try {
        const deleted = await Notification.delete(req.params.id, req.user.id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Không tìm thấy thông báo' });
        }
        
        res.json({ message: 'Xóa thông báo thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Xóa tất cả thông báo
router.delete('/', auth, async (req, res) => {
    try {
        const count = await Notification.deleteAll(req.user.id);
        res.json({ message: `Đã xóa ${count} thông báo`, count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
