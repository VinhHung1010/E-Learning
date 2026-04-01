const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
        }

        const existingUser = await User.getByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email đã được sử dụng' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Đăng ký thành công',
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
        }

        const user = await User.getByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Tài khoản chưa được kích hoạt' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Đăng nhập thành công',
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.getById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/profile', auth, async (req, res) => {
    try {
        const { name, phone, address, bio, avatar_url } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Tên không được để trống' });
        }
        
        const updated = await User.update(req.user.id, { name, phone, address, bio, avatar_url });
        
        if (!updated) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        
        const user = await User.getById(req.user.id);
        res.json({ message: 'Cập nhật thông tin thành công', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/profile/password', auth, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        
        if (!current_password || !new_password) {
            return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin' });
        }
        
        if (new_password.length < 6) {
            return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }
        
        const user = await User.getById(req.user.id);
        const isMatch = await bcrypt.compare(current_password, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
        }
        
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await User.update(req.user.id, { password: hashedPassword });
        
        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', auth, isAdmin, async (req, res) => {
    try {
        const users = await User.getAll();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/status', auth, isAdmin, async (req, res) => {
    try {
        const { is_active } = req.body;
        const updated = await User.update(req.params.id, { is_active });
        
        if (!updated) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        
        res.json({ message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.getById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { name, email, role, is_active } = req.body;
        const updated = await User.update(req.params.id, { name, email, role, is_active });
        
        if (!updated) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        
        const user = await User.getById(req.params.id);
        res.json({ message: 'Cập nhật thành công', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        const deleted = await User.delete(req.params.id);
        
        if (!deleted) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        
        res.json({ message: 'Xóa người dùng thành công' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
