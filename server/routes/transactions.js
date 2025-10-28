const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { authenticateSePay } = require('../middleware/sepayAuth');
const {
    getTransactions,
    getTransaction,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactionStatistics,
    handleSePayWebhook,
    createPaymentQR
} = require('../controllers/transactionController');

// Routes chung cho cả Admin và Client (để xem)
// GET /api/transactions: Admin xem tất cả, Client xem của họ
router.route('/').get(protect, getTransactions);

// Routes cho cả Admin và User (CRUD)
router.route('/')
    .post(protect, createTransaction); // Cả Admin và User đều có thể tạo

// Statistics endpoint
router.route('/statistics')
    .get(protect, getTransactionStatistics); // Thống kê giao dịch

// SePay webhook endpoint (không cần authentication thông thường, chỉ cần API key)
router.route('/sepay-webhook')
    .post(authenticateSePay, handleSePayWebhook); // Webhook từ SePay

// Tạo QR thanh toán
router.route('/create-payment-qr')
    .post(protect, createPaymentQR); // Tạo QR thanh toán với mã xác thực
    
router.route('/:id')
    .get(protect, getTransaction) // Chi tiết giao dịch (có kiểm tra quyền trong controller)
    .put(protect, updateTransaction) // Sửa (có kiểm tra quyền trong controller)
    .delete(protect, authorize('admin'), deleteTransaction); // Xóa (chỉ Admin)

module.exports = router;
