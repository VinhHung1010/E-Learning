const pool = require('../config/database');

class Report {
    // Thống kê tổng quan
    static async getOverview() {
        // Users count
        const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
        
        // Courses count
        const [courses] = await pool.query('SELECT COUNT(*) as count FROM courses');
        
        // Enrollments count
        const [enrollments] = await pool.query('SELECT COUNT(*) as count FROM enrollments');
        
        // Total revenue (sum of course prices from enrollments)
        const [revenue] = await pool.query(`
            SELECT COALESCE(SUM(c.price), 0) as total 
            FROM enrollments e 
            JOIN courses c ON e.course_id = c.id
        `);
        
        // Reviews count
        const [reviews] = await pool.query('SELECT COUNT(*) as count FROM reviews');
        
        // Completion rate
        const [completionStats] = await pool.query(`
            SELECT 
                COUNT(*) as total_enrollments,
                SUM(CASE WHEN progress >= 100 THEN 1 ELSE 0 END) as completed
            FROM enrollments
        `);
        
        const completionRate = completionStats[0].total_enrollments > 0
            ? Math.round((completionStats[0].completed / completionStats[0].total_enrollments) * 100)
            : 0;

        return {
            total_users: users[0].count,
            total_courses: courses[0].count,
            total_enrollments: enrollments[0].count,
            total_revenue: revenue[0].total || 0,
            total_reviews: reviews[0].count,
            completion_rate: completionRate
        };
    }

    // Thống kê theo ngày (7 ngày gần nhất)
    static async getDailyStats(days = 7) {
        const [stats] = await pool.query(`
            SELECT 
                DATE(e.created_at) as date,
                COUNT(DISTINCT e.id) as enrollments,
                COUNT(DISTINCT u.id) as new_users,
                COALESCE(SUM(c.price), 0) as revenue
            FROM (
                SELECT @start_date := DATE_SUB(CURDATE(), INTERVAL ? DAY)
            ) param
            LEFT JOIN enrollments e ON DATE(e.created_at) = DATE_SUB(CURDATE(), INTERVAL n DAY)
            LEFT JOIN users u ON DATE(u.created_at) = DATE_SUB(CURDATE(), INTERVAL n DAY)
            LEFT JOIN courses c ON e.course_id = c.id
            CROSS JOIN (
                SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 
                UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
            ) numbers
            WHERE n < ?
            GROUP BY DATE_SUB(CURDATE(), INTERVAL n DAY)
            ORDER BY date ASC
        `, [days, days]);
        
        return stats;
    }

    // Thống kê theo tháng (12 tháng gần nhất)
    static async getMonthlyStats(months = 12) {
        const [stats] = await pool.query(`
            SELECT 
                DATE_FORMAT(e.created_at, '%Y-%m') as month,
                COUNT(DISTINCT e.id) as enrollments,
                COUNT(DISTINCT u.id) as new_users,
                COALESCE(SUM(c.price), 0) as revenue
            FROM enrollments e
            LEFT JOIN courses c ON e.course_id = c.id
            LEFT JOIN users u ON DATE(u.created_at) >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
            WHERE e.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
               OR u.created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
            GROUP BY DATE_FORMAT(e.created_at, '%Y-%m')
            ORDER BY month ASC
        `, [months, months, months]);
        
        return stats;
    }

    // Top khóa học được đăng ký nhiều nhất
    static async getTopCourses(limit = 10) {
        const [courses] = await pool.query(`
            SELECT 
                c.id,
                c.title,
                c.thumbnail,
                c.price,
                COUNT(e.id) as enrollment_count,
                COALESCE(AVG(r.rating), 0) as avg_rating,
                COUNT(DISTINCT r.id) as review_count
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id
            LEFT JOIN reviews r ON c.id = r.course_id
            GROUP BY c.id
            ORDER BY enrollment_count DESC
            LIMIT ?
        `, [limit]);
        
        return courses;
    }

    // Top khóa học có doanh thu cao nhất
    static async getTopRevenueCourses(limit = 10) {
        const [courses] = await pool.query(`
            SELECT 
                c.id,
                c.title,
                c.thumbnail,
                c.price,
                COUNT(e.id) as enrollment_count,
                COALESCE(SUM(c.price), 0) as total_revenue
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id
            GROUP BY c.id
            HAVING total_revenue > 0
            ORDER BY total_revenue DESC
            LIMIT ?
        `, [limit]);
        
        return courses;
    }

    // Top giảng viên
    static async getTopInstructors(limit = 10) {
        const [instructors] = await pool.query(`
            SELECT 
                c.instructor_id,
                u.name as instructor_name,
                u.avatar,
                COUNT(DISTINCT c.id) as course_count,
                COUNT(e.id) as total_enrollments,
                COALESCE(SUM(c.price), 0) as total_revenue
            FROM courses c
            JOIN users u ON c.instructor_id = u.id
            LEFT JOIN enrollments e ON c.id = e.course_id
            GROUP BY c.instructor_id
            ORDER BY total_enrollments DESC
            LIMIT ?
        `, [limit]);
        
        return instructors;
    }

    // Thống kê danh mục
    static async getCategoryStats() {
        const [stats] = await pool.query(`
            SELECT 
                cat.id,
                cat.name,
                cat.icon,
                COUNT(DISTINCT c.id) as course_count,
                COUNT(e.id) as enrollment_count,
                COALESCE(SUM(c.price), 0) as revenue
            FROM categories cat
            LEFT JOIN courses c ON cat.id = c.category_id
            LEFT JOIN enrollments e ON c.id = e.course_id
            GROUP BY cat.id
            ORDER BY enrollment_count DESC
        `);
        
        return stats;
    }

    // Thống kê học viên hoạt động (học trong 7 ngày gần nhất)
    static async getActiveStudents(days = 7) {
        const [students] = await pool.query(`
            SELECT 
                u.id,
                u.name,
                u.email,
                u.avatar,
                COUNT(DISTINCT e.id) as enrolled_courses,
                SUM(e.progress) / COUNT(e.id) as avg_progress,
                MAX(e.updated_at) as last_activity
            FROM users u
            JOIN enrollments e ON u.id = e.user_id
            WHERE e.updated_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY u.id
            ORDER BY last_activity DESC
            LIMIT 50
        `, [days]);
        
        return students;
    }

    // Chi tiết khóa học
    static async getCourseDetails(courseId) {
        const [course] = await pool.query(`
            SELECT 
                c.*,
                cat.name as category_name,
                u.name as instructor_name,
                COUNT(DISTINCT e.id) as enrollment_count,
                COALESCE(AVG(r.rating), 0) as avg_rating,
                COUNT(DISTINCT r.id) as review_count,
                AVG(e.progress) as avg_progress
            FROM courses c
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN users u ON c.instructor_id = u.id
            LEFT JOIN enrollments e ON c.id = e.course_id
            LEFT JOIN reviews r ON c.id = r.course_id
            WHERE c.id = ?
            GROUP BY c.id
        `, [courseId]);
        
        return course[0];
    }

    // Thống kê đăng ký theo nguồn (mock data)
    static async getEnrollmentSources() {
        // Mock data - có thể mở rộng để track theo source thực tế
        const [sources] = await pool.query(`
            SELECT 
                'direct' as source,
                COUNT(*) as count
            FROM enrollments
            UNION ALL
            SELECT 
                'wishlist' as source,
                COUNT(*) as count
            FROM wishlists
        `);
        
        return sources;
    }

    // Tỷ lệ hoàn thành theo khóa học
    static async getCompletionByCourse() {
        const [stats] = await pool.query(`
            SELECT 
                c.id,
                c.title,
                COUNT(e.id) as total_students,
                SUM(CASE WHEN e.progress >= 100 THEN 1 ELSE 0 END) as completed,
                ROUND(AVG(e.progress), 1) as avg_progress
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id
            GROUP BY c.id
            HAVING total_students > 0
            ORDER BY avg_progress DESC
        `);
        
        return stats;
    }
}

module.exports = Report;
