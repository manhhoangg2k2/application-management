// server/routes/users.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const userController = require('../controllers/userController');

// Route lấy thông tin cá nhân (Admin và Client đều dùng)
router.get('/me', protect, userController.getMe);

// Route quản lý người dùng (Chỉ Admin)
router.route('/')
    // GET /api/users: Lấy danh sách tất cả người dùng với phân trang và tìm kiếm
    .get(protect, authorize('admin'), userController.getUsers)
    // POST /api/users: Admin tạo người dùng Client
    .post(protect, authorize('admin'), userController.createUser);

// Route quản lý người dùng theo ID (Chỉ Admin)
router.route('/:id')
    // GET /api/users/:id: Lấy thông tin user theo ID
    .get(protect, authorize('admin'), userController.getUserById)
    // PUT /api/users/:id: Cập nhật thông tin user
    .put(protect, authorize('admin'), userController.updateUser)
    // DELETE /api/users/:id: Xóa user
    .delete(protect, authorize('admin'), userController.deleteUser);

module.exports = router;