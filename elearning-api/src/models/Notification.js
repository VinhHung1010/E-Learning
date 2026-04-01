const pool = require('../config/database');

class Notification {
    // Loại thông báo
    static TYPES = {
        ENROLLMENT: 'enrollment',           // Đăng ký khóa học
        REVIEW: 'review',                    // Đánh giá khóa học
        LESSON: 'lesson',                   // Bài học mới
        COURSE: 'course',                   // Khóa học mới
        COMPLETION: 'completion',            // Hoàn thành khóa học
        SYSTEM: 'system'                     // Thông báo hệ thống
    };

    // Cấp độ
    static LEVELS = {
        INFO: 'info',
        SUCCESS: 'success',
        WARNING: 'warning',
        ERROR: 'error'
    };

    static async getByUserId(userId, options = {}) {
        const { limit = 20, offset = 0, unread_only = false } = options;
        
        let query = `
            SELECT n.*, c.title as course_title, c.thumbnail as course_thumbnail
            FROM notifications n
            LEFT JOIN courses c ON n.course_id = c.id
            WHERE n.user_id = ?
        `;
        
        if (unread_only) {
            query += ' AND n.is_read = 0';
        }
        
        query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
        
        const [rows] = await pool.query(query, [userId, limit, offset]);
        return rows;
    }

    static async getById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM notifications WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    static async create(data) {
        const { user_id, type, title, message, level = 'info', course_id = null, link = null } = data;
        
        const [result] = await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, level, course_id, link) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, type, title, message, level, course_id, link]
        );
        
        return { id: result.insertId, ...data };
    }

    static async markAsRead(id, userId) {
        const [result] = await pool.query(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async markAllAsRead(userId) {
        const [result] = await pool.query(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
            [userId]
        );
        return result.affectedRows;
    }

    static async delete(id, userId) {
        const [result] = await pool.query(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async deleteAll(userId) {
        const [result] = await pool.query(
            'DELETE FROM notifications WHERE user_id = ?',
            [userId]
        );
        return result.affectedRows;
    }

    static async getUnreadCount(userId) {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
            [userId]
        );
        return rows[0].count;
    }

    // Tạo thông báo khi có đăng ký khóa học
    static async notifyEnrollment(userId, courseTitle, courseId) {
        return await this.create({
            user_id: userId,
            type: this.TYPES.ENROLLMENT,
            title: 'Đăng ký khóa học thành công!',
            message: `Bạn đã đăng ký khóa học "${courseTitle}" thành công. Hãy bắt đầu học ngay!`,
            level: this.LEVELS.SUCCESS,
            course_id: courseId,
            link: `/lesson-player.html?course=${courseId}`
        });
    }

    // Tạo thông báo khi có đánh giá mới (cho admin)
    static async notifyNewReview(adminId, courseTitle, reviewerName, rating) {
        return await this.create({
            user_id: adminId,
            type: this.TYPES.REVIEW,
            title: 'Đánh giá mới!',
            message: `${reviewerName} đã đánh giá ${rating} sao cho khóa học "${courseTitle}"`,
            level: this.LEVELS.INFO,
            link: '/admin.html'
        });
    }

    // Tạo thông báo khi hoàn thành khóa học
    static async notifyCourseCompletion(userId, courseTitle, courseId) {
        return await this.create({
            user_id: userId,
            type: this.TYPES.COMPLETION,
            title: 'Chúc mừng! Hoàn thành khóa học!',
            message: `Bạn đã hoàn thành khóa học "${courseTitle}". Hãy tiếp tục với khóa học tiếp theo nhé!`,
            level: this.LEVELS.SUCCESS,
            course_id: courseId,
            link: `/course-detail.html?id=${courseId}`
        });
    }

    // Tạo thông báo khi có khóa học mới
    static async notifyNewCourse(userId, courseTitle, courseId) {
        return await this.create({
            user_id: userId,
            type: this.TYPES.COURSE,
            title: 'Khóa học mới!',
            message: `Khóa học mới "${courseTitle}" đã được thêm. Khám phá ngay!`,
            level: this.LEVELS.INFO,
            course_id: courseId,
            link: `/course-detail.html?id=${courseId}`
        });
    }

    // Tạo thông báo hệ thống
    static async notifySystem(userId, title, message) {
        return await this.create({
            user_id: userId,
            type: this.TYPES.SYSTEM,
            title,
            message,
            level: this.LEVELS.INFO,
            link: null
        });
    }
}

module.exports = Notification;
