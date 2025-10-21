const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
    getUserApplications,
    getUserApplication,
    getUserTransactions,
    createUserTransaction,
    getUserTransactionStatistics,
    getUserProfile,
    updateUserProfile,
    getAllUsers,
    getUsers
} = require('../controllers/userController');

// Middleware: Chỉ cho phép User truy cập
const userOnly = authorize('user');
// Middleware: Chỉ cho phép Admin truy cập
const adminOnly = authorize('admin');

// ==================== ADMIN ROUTES ====================
// Route cho Admin lấy danh sách tất cả users với pagination và filter
router.route('/')
    .get(protect, adminOnly, getUsers);

// Route cho Admin lấy danh sách tất cả users (simple)
router.route('/all')
    .get(protect, adminOnly, getAllUsers);

// ==================== USER PROFILE ====================
router.route('/profile')
    .get(protect, userOnly, getUserProfile)
    .put(protect, userOnly, updateUserProfile);

// ==================== USER APPLICATIONS ====================
router.route('/applications')
    .get(protect, userOnly, getUserApplications);

router.route('/applications/:id')
    .get(protect, userOnly, getUserApplication);

// ==================== USER TRANSACTIONS ====================
router.route('/transactions')
    .get(protect, userOnly, getUserTransactions)
    .post(protect, userOnly, createUserTransaction);

router.route('/transactions/statistics')
    .get(protect, userOnly, getUserTransactionStatistics);

module.exports = router;