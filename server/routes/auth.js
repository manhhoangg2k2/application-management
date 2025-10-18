// server/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route 1: Đăng ký Admin (Chỉ cho lần đầu tiên)
// Phương thức POST tới /api/auth/register-admin
router.post('/register-admin', authController.registerAdmin);

// Route 2: Đăng ký User (Chỉ Admin mới có thể tạo User Client)
router.post('/register-user', authController.registerUser); // Sẽ triển khai sau

// Route 3: Đăng nhập (Cho cả Admin và User)
// Phương thức POST tới /api/auth/login
router.post('/login', authController.login);

router.post('/token', authController.refreshToken); 

// Export router để server.js có thể sử dụng
module.exports = router;
