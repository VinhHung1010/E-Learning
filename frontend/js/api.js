const API_URL = 'http://localhost:3000/api';

// Lưu token và user info
const auth = {
    getToken: () => localStorage.getItem('token'),
    getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
    setAuth: (token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },
    clearAuth: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
    isLoggedIn: () => !!localStorage.getItem('token'),
    isAdmin: () => {
        const user = auth.getUser();
        return user && user.role === 'admin';
    }
};

// Cập nhật header theo trạng thái đăng nhập
function updateAuthNav() {
    const navAuth = document.querySelector('.nav-auth');
    if (!navAuth) return;
    
    if (auth.isLoggedIn()) {
        const user = auth.getUser();
        let adminLink = '';
        if (user.role === 'admin') {
            adminLink = '<a href="admin.html"><i class="fas fa-cog"></i> Quản trị</a>';
        }
        navAuth.innerHTML = `
            <div class="user-menu">
                <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                <span class="user-name">${user.name}</span>
                <div class="dropdown-menu">
                    ${adminLink}
                    <a href="my-courses.html"><i class="fas fa-book"></i> Khóa học của tôi</a>
                    <a href="#" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a>
                </div>
            </div>
        `;
    } else {
        navAuth.innerHTML = `
            <a href="login.html" class="btn-login">Đăng nhập</a>
            <a href="register.html" class="btn-register">Đăng ký</a>
        `;
    }
}

// Đăng xuất
function logout() {
    auth.clearAuth();
    window.location.href = 'index.html';
}

// Gọi API với fetch
async function api(endpoint, options = {}) {
    const token = auth.getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Có lỗi xảy ra');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Đăng ký
async function register(name, email, password) {
    return await api('/users/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
    });
}

// Đăng nhập
async function login(email, password) {
    return await api('/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
}

// Lấy danh sách khóa học
async function getCourses(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    return await api(`/courses${query ? '?' + query : ''}`);
}

// Lấy khóa học nổi bật
async function getFeaturedCourses(limit = 8) {
    return await api(`/courses/featured?limit=${limit}`);
}

// Lấy khóa học theo ID
async function getCourseById(id) {
    return await api(`/courses/${id}`);
}

// Lấy danh mục
async function getCategories() {
    return await api('/categories');
}

// Lấy danh mục theo ID
async function getCategoryById(id) {
    return await api(`/categories/${id}`);
}

// Lấy bài học theo khóa học
async function getLessonsByCourse(courseId) {
    return await api(`/lessons/course/${courseId}`);
}

// Lấy bài học theo ID
async function getLessonById(id) {
    return await api(`/lessons/${id}`);
}

// Tạo bài học (Admin)
async function createLesson(lessonData) {
    return await api('/lessons', {
        method: 'POST',
        body: JSON.stringify(lessonData)
    });
}

// Cập nhật bài học (Admin)
async function updateLesson(id, lessonData) {
    return await api(`/lessons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(lessonData)
    });
}

// Xóa bài học (Admin)
async function deleteLesson(id) {
    return await api(`/lessons/${id}`, {
        method: 'DELETE'
    });
}

// Sắp xếp lại bài học (Admin)
async function reorderLessons(courseId, lessons) {
    return await api(`/lessons/reorder/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify({ lessons })
    });
}

// Lấy tiến độ học tập
async function getProgress(courseId) {
    return await api(`/progress/course/${courseId}`);
}

// Cập nhật tiến độ bài học
async function updateLessonProgress(lessonId, data) {
    return await api(`/progress/lesson/${lessonId}`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// Đánh dấu hoàn thành bài học
async function markLessonComplete(lessonId) {
    return await api(`/progress/lesson/${lessonId}/complete`, {
        method: 'POST'
    });
}

// Lấy khóa học của user
async function getMyCourses() {
    return await api('/enrollments/my-courses');
}

// Đăng ký khóa học
async function enrollCourse(courseId) {
    return await api('/enrollments', {
        method: 'POST',
        body: JSON.stringify({ course_id: courseId })
    });
}

// Lấy đánh giá theo khóa học
async function getReviewsByCourse(courseId) {
    return await api(`/reviews/course/${courseId}`);
}

// Tạo đánh giá
async function createReview(courseId, rating, comment) {
    return await api('/reviews', {
        method: 'POST',
        body: JSON.stringify({ course_id: courseId, rating, comment })
    });
}

// Format tiền VND
function formatPrice(price) {
    if (price == 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// Hiển thị thông báo
function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    
    const container = document.querySelector('.container');
    container.insertBefore(alert, container.firstChild);
    
    setTimeout(() => alert.remove(), 4000);
}

// Kiểm tra đăng nhập, nếu chưa thì chuyển về trang login
function requireAuth() {
    if (!auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Kiểm tra đã đăng nhập thì chuyển về trang chủ
function redirectIfLoggedIn() {
    if (auth.isLoggedIn()) {
        window.location.href = 'index.html';
        return true;
    }
    return false;
}

// Kiểm tra có phải admin không, nếu không thì chuyển về trang chủ
function requireAdmin() {
    if (!auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    const user = auth.getUser();
    if (user.role !== 'admin') {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Tạo đường dẫn với BASE_URL
function url(path) {
    return path;
}
