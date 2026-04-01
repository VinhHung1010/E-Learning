const pool = require('../config/database');

class Category {
    static async getAll() {
        const [rows] = await pool.query(
            'SELECT * FROM categories ORDER BY name ASC'
        );
        return rows;
    }

    static async getById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async create(categoryData) {
        const { name } = categoryData;
        const [result] = await pool.query(
            'INSERT INTO categories (name) VALUES (?)',
            [name]
        );
        return { id: result.insertId, name };
    }

    static async update(id, categoryData) {
        const { name } = categoryData;
        const [result] = await pool.query(
            'UPDATE categories SET name = ? WHERE id = ?',
            [name, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getCourseCount(categoryId) {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as count FROM courses WHERE category_id = ?',
            [categoryId]
        );
        return rows[0].count;
    }
}

module.exports = Category;
