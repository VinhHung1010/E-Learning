// Admin Panel JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and is admin
    if (!auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const user = auth.getUser();
    if (user.role !== 'admin') {
        showToast('Bạn không có quyền truy cập trang này', 'error');
        window.location.href = 'index.html';
        return;
    }

    // Update admin name
    document.getElementById('admin-name').textContent = user.name;

    // Setup navigation
    setupNavigation();

    // Load dashboard data
    loadDashboard();

    // Setup form handlers
    setupForms();

    // Setup search handlers
    setupSearch();

    // Sidebar toggle for mobile
    window.toggleSidebar = toggleSidebar;
});

// Navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);
        });
    });
}

function showSection(sectionId) {
    // Update nav items
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        }
    });

    // Update sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${sectionId}-section`).classList.add('active');

    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'users': 'Quản lý người dùng',
        'courses': 'Quản lý khóa học',
        'categories': 'Quản lý danh mục',
        'enrollments': 'Quản lý đăng ký',
        'reviews': 'Quản lý đánh giá',
        'lessons': 'Quản lý bài học'
    };
    document.getElementById('page-title').textContent = titles[sectionId] || 'Dashboard';

    // Load section data
    switch(sectionId) {
        case 'dashboard': loadDashboard(); break;
        case 'users': loadUsers(); break;
        case 'courses': loadCourses(); break;
        case 'categories': loadCategories(); break;
        case 'enrollments': loadEnrollments(); break;
        case 'reviews': loadReviews(); break;
        case 'lessons': loadLessons(); loadCoursesForLessonSelect(); break;
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const [users, courses, enrollments, reviews] = await Promise.all([
            api('/users'),
            api('/courses'),
            api('/enrollments'),
            api('/reviews')
        ]);

        document.getElementById('stat-users').textContent = users.length || 0;
        document.getElementById('stat-courses').textContent = courses.length || 0;

        const pendingEnrollments = enrollments.filter(e => e.status === 'pending').length;
        const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
        document.getElementById('stat-enrollments').innerHTML = `${enrollments.length || 0} <small style="font-size:0.7em;opacity:0.8;">(${pendingEnrollments > 0 ? `<span style="color:var(--accent)">${pendingEnrollments} chờ</span>` : '0 chờ'})</small>`;

        const pendingReviews = reviews.filter(r => r.status === 'pending').length;
        document.getElementById('stat-reviews').innerHTML = `${reviews.length || 0} <small style="font-size:0.7em;opacity:0.8;">(${pendingReviews > 0 ? `<span style="color:var(--accent)">${pendingReviews} chờ</span>` : '0 chờ'})</small>`;

        // Recent enrollments (prioritize pending)
        const recentEnrollments = document.getElementById('recent-enrollments');
        const sortedEnrollments = [...enrollments].sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return new Date(b.enrolled_at) - new Date(a.enrolled_at);
        });

        if (sortedEnrollments.length > 0) {
            recentEnrollments.innerHTML = sortedEnrollments.slice(0, 5).map(e => `
                <div class="recent-item" style="${e.status === 'pending' ? 'border-left: 3px solid var(--accent); background: #fffbeb;' : ''}">
                    <div class="recent-item-info">
                        <h4>${e.user_name || 'User'}</h4>
                        <p>${e.course_title || 'Course'} ${e.status === 'pending' ? '<span style="color:var(--accent);font-weight:600;">(Chờ duyệt)</span>' : ''}</p>
                    </div>
                    <span class="recent-item-date">${formatDate(e.enrolled_at)}</span>
                </div>
            `).join('');
        } else {
            recentEnrollments.innerHTML = '<p class="empty-message">Không có dữ liệu</p>';
        }

        // Popular courses
        const popularCourses = document.getElementById('popular-courses');
        if (courses.length > 0) {
            const sorted = [...courses].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
            popularCourses.innerHTML = sorted.slice(0, 5).map(c => `
                <div class="recent-item">
                    <div class="recent-item-info">
                        <h4>${c.title}</h4>
                        <p>${formatPrice(c.price)}</p>
                    </div>
                    <span class="rating-stars">${'★'.repeat(Math.round(c.average_rating || 0))}</span>
                </div>
            `).join('');
        } else {
            popularCourses.innerHTML = '<p class="empty-message">Không có dữ liệu</p>';
        }
    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

// Users Management
async function loadUsers(search = '') {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Đang tải...</td></tr>';

    try {
        let users = await api('/users');
        
        if (search) {
            users = users.filter(u => 
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">Không có người dùng</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="badge badge-${user.role === 'admin' ? 'admin' : 'student'}">${user.role === 'admin' ? 'Admin' : 'Học viên'}</span></td>
                <td><span class="badge badge-${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Hoạt động' : 'Khóa'}</span></td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-warning" onclick="toggleUserStatus(${user.id}, ${!user.is_active})">
                            <i class="fas fa-${user.is_active ? 'lock' : 'unlock'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load users error:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Lỗi khi tải dữ liệu</td></tr>';
    }
}

async function toggleUserStatus(userId, newStatus) {
    try {
        await api(`/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ is_active: newStatus })
        });
        showToast(newStatus ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản', 'success');
        loadUsers();
    } catch (error) {
        showToast('Có lỗi xảy ra', 'error');
    }
}

// Courses Management
async function loadCourses(search = '') {
    const tbody = document.getElementById('courses-table-body');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Đang tải...</td></tr>';

    try {
        const [courses, categories] = await Promise.all([
            api('/courses'),
            api('/categories')
        ]);

        if (search) {
            courses = courses.filter(c => 
                c.title.toLowerCase().includes(search.toLowerCase())
            );
        }

        const categoryMap = {};
        categories.forEach(c => categoryMap[c.id] = c.name);

        if (courses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">Không có khóa học</td></tr>';
            return;
        }

        tbody.innerHTML = courses.map(course => `
            <tr>
                <td>${course.id}</td>
                <td>${course.title}</td>
                <td>${categoryMap[course.category_id] || 'N/A'}</td>
                <td><span class="badge badge-${course.price == 0 ? 'free' : 'paid'}">${formatPrice(course.price)}</span></td>
                <td>${course.lesson_count || 0}</td>
                <td><span class="rating-stars">${'★'.repeat(Math.round(course.average_rating || 0))}</span> (${course.review_count || 0})</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-warning" onclick="editCourse(${course.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteCourse(${course.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load courses error:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Lỗi khi tải dữ liệu</td></tr>';
    }
}

async function loadCategoriesForSelect() {
    try {
        const categories = await api('/categories');
        const select = document.getElementById('course-category');
        select.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    } catch (error) {
        console.error('Load categories error:', error);
    }
}

function showCourseModal(courseId = null) {
    loadCategoriesForSelect();
    const modal = document.getElementById('course-modal');
    const title = document.getElementById('course-modal-title');
    const form = document.getElementById('course-form');

    form.reset();
    document.getElementById('course-id').value = '';
    document.getElementById('course-thumbnail').value = '';

    if (courseId) {
        title.textContent = 'Sửa khóa học';
        loadCourseData(courseId);
    } else {
        title.textContent = 'Thêm khóa học';
    }

    modal.classList.add('show');
}

function closeCourseModal() {
    document.getElementById('course-modal').classList.remove('show');
}

async function loadCourseData(courseId) {
    try {
        const course = await api(`/courses/${courseId}`);
        document.getElementById('course-id').value = course.id;
        document.getElementById('course-title').value = course.title;
        document.getElementById('course-description').value = course.description || '';
        document.getElementById('course-category').value = course.category_id;
        document.getElementById('course-price').value = course.price || 0;
        document.getElementById('course-thumbnail').value = course.thumbnail || '';
    } catch (error) {
        showToast('Có lỗi khi tải dữ liệu khóa học', 'error');
    }
}

async function editCourse(courseId) {
    showCourseModal(courseId);
}

async function deleteCourse(courseId) {
    if (!confirm('Bạn có chắc muốn xóa khóa học này?')) return;

    try {
        await api(`/courses/${courseId}`, { method: 'DELETE' });
        showToast('Đã xóa khóa học', 'success');
        loadCourses();
    } catch (error) {
        showToast('Có lỗi xảy ra', 'error');
    }
}

// Categories Management
async function loadCategories() {
    const tbody = document.getElementById('categories-table-body');
    tbody.innerHTML = '<tr><td colspan="4" class="loading">Đang tải...</td></tr>';

    try {
        const [categories, courses] = await Promise.all([
            api('/categories'),
            api('/courses')
        ]);

        const courseCount = {};
        courses.forEach(c => {
            courseCount[c.category_id] = (courseCount[c.category_id] || 0) + 1;
        });

        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading">Không có danh mục</td></tr>';
            return;
        }

        tbody.innerHTML = categories.map(cat => `
            <tr>
                <td>${cat.id}</td>
                <td>${cat.name}</td>
                <td>${courseCount[cat.id] || 0}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-warning" onclick="editCategory(${cat.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteCategory(${cat.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load categories error:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="loading">Lỗi khi tải dữ liệu</td></tr>';
    }
}

function showCategoryModal(categoryId = null) {
    const modal = document.getElementById('category-modal');
    const title = document.getElementById('category-modal-title');
    const form = document.getElementById('category-form');

    form.reset();
    document.getElementById('category-id').value = '';

    if (categoryId) {
        title.textContent = 'Sửa danh mục';
        loadCategoryData(categoryId);
    } else {
        title.textContent = 'Thêm danh mục';
    }

    modal.classList.add('show');
}

function closeCategoryModal() {
    document.getElementById('category-modal').classList.remove('show');
}

async function loadCategoryData(categoryId) {
    try {
        const category = await api(`/categories/${categoryId}`);
        document.getElementById('category-id').value = category.id;
        document.getElementById('category-name').value = category.name;
    } catch (error) {
        showToast('Có lỗi khi tải dữ liệu danh mục', 'error');
    }
}

async function editCategory(categoryId) {
    showCategoryModal(categoryId);
}

async function deleteCategory(categoryId) {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;

    try {
        await api(`/categories/${categoryId}`, { method: 'DELETE' });
        showToast('Đã xóa danh mục', 'success');
        loadCategories();
    } catch (error) {
        showToast('Có lỗi xảy ra', 'error');
    }
}

// Enrollments Management
async function loadEnrollments(search = '') {
    const tbody = document.getElementById('enrollments-table-body');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Đang tải...</td></tr>';

    const statusFilter = document.getElementById('enrollment-status-filter').value;

    try {
        let enrollments = await api('/enrollments');

        // Filter by status
        if (statusFilter) {
            enrollments = enrollments.filter(e => e.status === statusFilter);
        }

        if (search) {
            enrollments = enrollments.filter(e =>
                (e.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
                (e.course_title || '').toLowerCase().includes(search.toLowerCase())
            );
        }

        if (enrollments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">Không có đăng ký</td></tr>';
            return;
        }

        tbody.innerHTML = enrollments.map(e => `
            <tr>
                <td>${e.id}</td>
                <td>
                    <div class="user-cell">
                        <strong>${e.user_name || 'User'}</strong>
                        <small>${e.user_email || ''}</small>
                    </div>
                </td>
                <td>${e.course_title || 'Course'}</td>
                <td><span class="badge badge-${e.course_price == 0 ? 'free' : 'paid'}">${formatPrice(e.course_price)}</span></td>
                <td>${formatDate(e.enrolled_at)}</td>
                <td><span class="badge badge-${e.status === 'active' ? 'active' : 'pending'}">${e.status === 'active' ? 'Hoạt động' : 'Chờ duyệt'}</span></td>
                <td>
                    <div class="action-buttons">
                        ${e.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="activateEnrollment(${e.id}, '${e.course_title || 'khóa học'}')" title="Kích hoạt">
                                <i class="fas fa-unlock"></i>
                            </button>
                        ` : `
                            <span style="color: var(--secondary); font-size: 0.85rem;"><i class="fas fa-check-circle"></i> Đã mở</span>
                        `}
                        <button class="btn btn-sm btn-danger" onclick="deleteEnrollment(${e.id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load enrollments error:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Lỗi khi tải dữ liệu</td></tr>';
    }
}

async function activateEnrollment(enrollmentId, courseTitle) {
    if (!confirm(`Bạn có chắc muốn kích hoạt đăng ký khóa "${courseTitle}"?\n\nHọc viên sẽ có thể bắt đầu học ngay.`)) return;

    try {
        await api(`/enrollments/${enrollmentId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'active' })
        });
        showToast('Đã kích hoạt đăng ký thành công! Học viên có thể bắt đầu học.', 'success');
        loadEnrollments();
    } catch (error) {
        showToast('Có lỗi xảy ra: ' + (error.message || ''), 'error');
    }
}

async function deleteEnrollment(enrollmentId) {
    if (!confirm('Bạn có chắc muốn xóa đăng ký này?')) return;

    try {
        await api(`/enrollments/${enrollmentId}`, { method: 'DELETE' });
        showToast('Đã xóa đăng ký', 'success');
        loadEnrollments();
    } catch (error) {
        showToast('Có lỗi xảy ra', 'error');
    }
}

// Reviews Management
async function loadReviews() {
    const tbody = document.getElementById('reviews-table-body');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Đang tải...</td></tr>';

    const filter = document.getElementById('review-filter').value;

    try {
        let reviews = await api('/reviews');
        
        if (filter) {
            reviews = reviews.filter(r => r.status === filter);
        }

        if (reviews.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">Không có đánh giá</td></tr>';
            return;
        }

        tbody.innerHTML = reviews.map(r => `
            <tr>
                <td>${r.id}</td>
                <td>${r.user_name || 'User'}</td>
                <td>${r.course_title || 'Course'}</td>
                <td><span class="rating-stars">${'★'.repeat(r.rating)}</span></td>
                <td>${r.comment ? (r.comment.length > 50 ? r.comment.substring(0, 50) + '...' : r.comment) : '-'}</td>
                <td><span class="badge badge-${r.status}">${getStatusText(r.status)}</span></td>
                <td>
                    <div class="action-buttons">
                        ${r.status === 'pending' ? `
                            <button class="btn btn-sm btn-success" onclick="updateReviewStatus(${r.id}, 'approved')">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="updateReviewStatus(${r.id}, 'rejected')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load reviews error:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Lỗi khi tải dữ liệu</td></tr>';
    }
}

async function updateReviewStatus(reviewId, status) {
    try {
        await api(`/reviews/${reviewId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        showToast(status === 'approved' ? 'Đã duyệt đánh giá' : 'Đã từ chối đánh giá', 'success');
        loadReviews();
    } catch (error) {
        showToast('Có lỗi xảy ra', 'error');
    }
}

// Forms Setup
function setupForms() {
    // Course form
    document.getElementById('course-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const courseId = document.getElementById('course-id').value;
        const data = {
            title: document.getElementById('course-title').value,
            description: document.getElementById('course-description').value,
            category_id: document.getElementById('course-category').value,
            price: parseInt(document.getElementById('course-price').value),
            thumbnail: document.getElementById('course-thumbnail').value
        };

        try {
            if (courseId) {
                await api(`/courses/${courseId}`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                showToast('Đã cập nhật khóa học', 'success');
            } else {
                await api('/courses', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                showToast('Đã thêm khóa học', 'success');
            }
            closeCourseModal();
            loadCourses();
        } catch (error) {
            showToast('Có lỗi xảy ra', 'error');
        }
    });

    // Category form
    document.getElementById('category-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const categoryId = document.getElementById('category-id').value;
        const data = {
            name: document.getElementById('category-name').value
        };

        try {
            if (categoryId) {
                await api(`/categories/${categoryId}`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                showToast('Đã cập nhật danh mục', 'success');
            } else {
                await api('/categories', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                showToast('Đã thêm danh mục', 'success');
            }
            closeCategoryModal();
            loadCategories();
        } catch (error) {
            showToast('Có lỗi xảy ra', 'error');
        }
    });

    // Lesson form
    document.getElementById('lesson-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const lessonId = document.getElementById('lesson-id').value;
        const data = {
            course_id: parseInt(document.getElementById('lesson-course').value),
            title: document.getElementById('lesson-title').value,
            content: document.getElementById('lesson-content').value,
            video_url: document.getElementById('lesson-video').value,
            position: parseInt(document.getElementById('lesson-position').value) || 1
        };

        try {
            if (lessonId) {
                await api(`/lessons/${lessonId}`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                showToast('Đã cập nhật bài học', 'success');
            } else {
                await api('/lessons', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                showToast('Đã thêm bài học', 'success');
            }
            closeLessonModal();
            loadLessons();
        } catch (error) {
            showToast('Có lỗi xảy ra', 'error');
        }
    });
}

// Search Setup
function setupSearch() {
    let userTimeout, courseTimeout, enrollmentTimeout;

    document.getElementById('user-search').addEventListener('input', (e) => {
        clearTimeout(userTimeout);
        userTimeout = setTimeout(() => loadUsers(e.target.value), 500);
    });

    document.getElementById('course-search').addEventListener('input', (e) => {
        clearTimeout(courseTimeout);
        courseTimeout = setTimeout(() => loadCourses(e.target.value), 500);
    });

    document.getElementById('enrollment-search').addEventListener('input', (e) => {
        clearTimeout(enrollmentTimeout);
        enrollmentTimeout = setTimeout(() => loadEnrollments(e.target.value), 500);
    });
}

// Sidebar Toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    sidebar.classList.toggle('show');
}

// Logout
function logout() {
    auth.clearAuth();
    window.location.href = 'login.html';
}

// Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Utilities
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
}

function formatPrice(price) {
    if (price == 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function getStatusText(status) {
    const texts = {
        'pending': 'Chờ duyệt',
        'approved': 'Đã duyệt',
        'rejected': 'Từ chối'
    };
    return texts[status] || status;
}

// Lessons Management
async function loadCoursesForLessonSelect() {
    try {
        const courses = await api('/courses');
        const select = document.getElementById('lesson-course-filter');
        select.innerHTML = '<option value="">Tất cả khóa học</option>' +
            courses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');

        const modalSelect = document.getElementById('lesson-course');
        modalSelect.innerHTML = courses.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
    } catch (error) {
        console.error('Load courses for lesson select error:', error);
    }
}

async function loadLessons() {
    const tbody = document.getElementById('lessons-table-body');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Đang tải...</td></tr>';

    const courseId = document.getElementById('lesson-course-filter').value;

    try {
        const [lessons, courses] = await Promise.all([
            api('/lessons'),
            api('/courses')
        ]);

        const courseMap = {};
        courses.forEach(c => courseMap[c.id] = c.title);

        let filtered = lessons;
        if (courseId) {
            filtered = lessons.filter(l => String(l.course_id) === courseId);
        }

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="loading">Không có bài học</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(l => `
            <tr>
                <td>${l.id}</td>
                <td>${courseMap[l.course_id] || 'N/A'}</td>
                <td>${l.title}</td>
                <td>${l.video_url ? '<a href="' + l.video_url + '" target="_blank"><i class="fas fa-play-circle"></i> Xem</a>' : '<span style="color:#999">Không có</span>'}</td>
                <td>${l.position || 1}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-warning" onclick="editLesson(${l.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteLesson(${l.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Load lessons error:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Lỗi khi tải dữ liệu</td></tr>';
    }
}

function showLessonModal(lessonId = null) {
    const modal = document.getElementById('lesson-modal');
    const title = document.getElementById('lesson-modal-title');
    const form = document.getElementById('lesson-form');

    form.reset();
    document.getElementById('lesson-id').value = '';
    document.getElementById('lesson-position').value = '1';

    if (lessonId) {
        title.textContent = 'Sửa bài học';
        loadLessonData(lessonId);
    } else {
        title.textContent = 'Thêm bài học';
        // Set selected course from filter if any
        const filterVal = document.getElementById('lesson-course-filter').value;
        if (filterVal) {
            document.getElementById('lesson-course').value = filterVal;
        }
    }

    modal.classList.add('show');
}

function closeLessonModal() {
    document.getElementById('lesson-modal').classList.remove('show');
}

async function loadLessonData(lessonId) {
    try {
        const lesson = await api(`/lessons/${lessonId}`);
        document.getElementById('lesson-id').value = lesson.id;
        document.getElementById('lesson-course').value = lesson.course_id;
        document.getElementById('lesson-title').value = lesson.title;
        document.getElementById('lesson-content').value = lesson.content || '';
        document.getElementById('lesson-video').value = lesson.video_url || '';
        document.getElementById('lesson-position').value = lesson.position || 1;
    } catch (error) {
        showToast('Có lỗi khi tải dữ liệu bài học', 'error');
    }
}

async function editLesson(lessonId) {
    showLessonModal(lessonId);
}

async function deleteLesson(lessonId) {
    if (!confirm('Bạn có chắc muốn xóa bài học này?')) return;

    try {
        await api(`/lessons/${lessonId}`, { method: 'DELETE' });
        showToast('Đã xóa bài học', 'success');
        loadLessons();
    } catch (error) {
        showToast('Có lỗi xảy ra', 'error');
    }
}
