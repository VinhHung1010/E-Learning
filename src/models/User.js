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
            'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
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
        const { name, email, password, role = 'student', is_active = 0 } = userData;
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password, role, is_active) VALUES (?, ?, ?, ?, ?)',
            [name, email, password, role, is_active]
        );
        return { id: result.insertId, name, email, role, is_active };
    }

    static async update(id, userData) {
        const { name, email, role, is_active } = userData;
        const [result] = await pool.query(
            'UPDATE users SET name = ?, email = ?, role = ?, is_active = ? WHERE id = ?',
            [name, email, role, is_active, id]
        );
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
