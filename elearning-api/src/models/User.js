const pool = require('../config/database');

class User {
    static async getAll() {
        const [rows] = await pool.query(
            'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
        );
        return rows;
    }

    static async getById(id) {
        const [rows] = await pool.query(
            'SELECT id, name, email, role, phone, address, bio, avatar_url, is_active, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async getByEmail(email) {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    }

    static async create(userData) {
        const { name, email, password, role = 'student', is_active = 1 } = userData;
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
            [name, email, password, role, is_active]
        );
        return { id: result.insertId, name, email, role, is_active };
    }

    static async update(id, userData) {
        const { name, email, role, is_active, password, phone, address, bio, avatar_url } = userData;
        
        // Build dynamic update query
        let query = 'UPDATE users SET ';
        let params = [];
        let updates = [];
        
        if (name !== undefined) { updates.push('name = ?'); params.push(name); }
        if (email !== undefined) { updates.push('email = ?'); params.push(email); }
        if (role !== undefined) { updates.push('role = ?'); params.push(role); }
        if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }
        if (password !== undefined) { updates.push('password = ?'); params.push(password); }
        if (phone !== undefined) { updates.push('phone = ?'); params.push(phone || ''); }
        if (address !== undefined) { updates.push('address = ?'); params.push(address || ''); }
        if (bio !== undefined) { updates.push('bio = ?'); params.push(bio || ''); }
        if (avatar_url !== undefined) { updates.push('avatar_url = ?'); params.push(avatar_url || ''); }
        
        if (updates.length === 0) {
            return false;
        }
        
        query += updates.join(', ') + ' WHERE id = ?';
        params.push(id);
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async count() {
        const [rows] = await pool.query('SELECT COUNT(*) as total FROM users');
        return rows[0].total;
    }
}

module.exports = User;
