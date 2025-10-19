const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction
} = require('../controllers/transactionController');

// Routes chung cho cả Admin và Client (để xem)
// GET /api/transactions: Admin xem tất cả, Client xem của họ
router.route('/').get(protect, getTransactions);

// Routes chỉ dành cho Admin (CRUD)
router.route('/')
    .post(protect, authorize('admin'), createTransaction); // Thêm
    
router.route('/:id')
    .get(protect, getTransaction) // Chi tiết giao dịch (có kiểm tra quyền trong controller)
    .put(protect, authorize('admin'), updateTransaction) // Sửa
    .delete(protect, authorize('admin'), deleteTransaction); // Xóa

module.exports = router;
