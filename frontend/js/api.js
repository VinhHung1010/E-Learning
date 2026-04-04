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
            <a href="notifications.html" class="nav-bell" title="Thông báo">
                <i class="fas fa-bell"></i>
                <span class="nav-bell-badge" id="nav-notif-badge"></span>
            </a>
            <div class="user-menu">
                <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                <span class="user-name">${user.name}</span>
                <div class="dropdown-menu">
                    ${adminLink}
                    <a href="wishlist.html"><i class="fas fa-heart"></i> Yêu thích</a>
                    <a href="my-courses.html"><i class="fas fa-book"></i> Khóa học của tôi</a>
                    <a href="#" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a>
                </div>
            </div>
        `;
        refreshNavNotifBadge();
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
async function createLesson(data) {
    return await api('/lessons', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// Cập nhật bài học (Admin)
async function updateLesson(id, data) {
    return await api(`/lessons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

// Xóa bài học (Admin)
async function deleteLesson(id) {
    return await api(`/lessons/${id}`, { method: 'DELETE' });
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

async function getWishlistCourseIds() {
    if (!auth.isLoggedIn()) return [];
    try {
        const data = await api('/wishlist/ids');
        return data.course_ids || [];
    } catch {
        return [];
    }
}

async function addToWishlist(courseId) {
    return await api('/wishlist', {
        method: 'POST',
        body: JSON.stringify({ course_id: courseId })
    });
}

async function removeFromWishlist(courseId) {
    return await api(`/wishlist/course/${courseId}`, { method: 'DELETE' });
}

async function checkWishlist(courseId) {
    if (!auth.isLoggedIn()) return false;
    const data = await api(`/wishlist/check/${courseId}`);
    return !!data.in_wishlist;
}

async function toggleWishlistDetail(courseId, btn) {
    const isActive = btn.classList.contains('active');
    try {
        if (isActive) {
            await removeFromWishlist(courseId);
            btn.classList.remove('active');
            btn.innerHTML = '<i class="far fa-heart"></i> Yêu thích';
        } else {
            await addToWishlist(courseId);
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-heart"></i> Đã yêu thích';
        }
    } catch (error) {
        alert(error.message || 'Không thể cập nhật yêu thích');
    }
}

async function getWishlist() {
    return await api('/wishlist');
}

async function getNotifications(query = {}) {
    const q = new URLSearchParams(query).toString();
    return await api(`/notifications${q ? '?' + q : ''}`);
}

async function getUnreadNotificationCount() {
    return await api('/notifications/unread-count');
}

async function markNotificationRead(id) {
    return await api(`/notifications/${id}/read`, { method: 'PATCH' });
}

async function markAllNotificationsRead() {
    return await api('/notifications/read-all', { method: 'PATCH' });
}

function wishlistHeartHtml(courseId, filled) {
    return `<button type="button" class="wishlist-heart ${filled ? 'active' : ''}" onclick="event.preventDefault(); event.stopPropagation(); toggleWishlistBtn(${courseId}, this)" aria-label="Yêu thích" title="Yêu thích"><i class="fas fa-heart"></i></button>`;
}

async function toggleWishlistBtn(courseId, btn) {
    if (!auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    try {
        const active = btn.classList.contains('active');
        if (active) {
            await removeFromWishlist(courseId);
            btn.classList.remove('active');
        } else {
            await addToWishlist(courseId);
            btn.classList.add('active');
        }
    } catch (error) {
        alert(error.message || 'Không thể cập nhật yêu thích');
    }
}

async function refreshNavNotifBadge() {
    if (!auth.isLoggedIn()) return;
    const el = document.getElementById('nav-notif-badge');
    if (!el) return;
    try {
        const { count } = await getUnreadNotificationCount();
        if (count > 0) {
            el.textContent = count > 9 ? '9+' : String(count);
            el.classList.add('visible');
        } else {
            el.textContent = '';
            el.classList.remove('visible');
        }
    } catch {
        el.classList.remove('visible');
    }
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
