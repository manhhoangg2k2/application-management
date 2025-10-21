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
    updateUserProfile
} = require('../controllers/userController');

// Middleware: Chỉ cho phép User truy cập
const userOnly = authorize('user');

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