const express = require('express');
const Notification = require('../models/Notification');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/unread-count', auth, async (req, res) => {
    try {
        const count = await Notification.unreadCount(req.user.id);
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/read-all', auth, async (req, res) => {
    try {
        await Notification.markAllRead(req.user.id);
        res.json({ message: 'Đã đánh dấu tất cả là đã đọc' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const unreadOnly = req.query.unread_only === '1' || req.query.unread_only === 'true';
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
        const items = await Notification.getByUserId(req.user.id, { unreadOnly, limit });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/:id/read', auth, async (req, res) => {
    try {
        const ok = await Notification.markRead(req.user.id, req.params.id);
        if (!ok) {
            return res.status(404).json({ error: 'Không tìm thấy thông báo' });
        }
        res.json({ message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
