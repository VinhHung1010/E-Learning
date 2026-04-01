const BASE_URL = 'E-Learning';
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
        navAuth.innerHTML = `
            <div class="user-menu">
                <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                <span class="user-name">${user.name}</span>
                <div class="dropdown-menu">
                    <a href="${BASE_URL}/frontend/my-courses.html"><i class="fas fa-book"></i> Khóa học của tôi</a>
                    <a href="#" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a>
                </div>
            </div>
        `;
    } else {
        navAuth.innerHTML = `
            <a href="${BASE_URL}/frontend/login.html" class="btn-login">Đăng nhập</a>
            <a href="${BASE_URL}/frontend/register.html" class="btn-register">Đăng ký</a>
        `;
    }
}

// Đăng xuất
function logout() {
    auth.clearAuth();
    window.location.href = `${BASE_URL}/frontend/index.html`;
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
        window.location.href = `${BASE_URL}/frontend/login.html`;
        return false;
    }
    return true;
}

// Kiểm tra đã đăng nhập thì chuyển về trang chủ
function redirectIfLoggedIn() {
    if (auth.isLoggedIn()) {
        window.location.href = `${BASE_URL}/frontend/index.html`;
        return true;
    }
    return false;
}

// Tạo đường dẫn với BASE_URL
function url(path) {
    return `${BASE_URL}/frontend/${path}`;
}
