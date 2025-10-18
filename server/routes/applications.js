// server/routes/applications.js
const express = require('express');
const router = express.Router();

// 1. Import Middleware
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

// 2. Import Controller
const applicationController = require('../controllers/applicationController');

// --- BÀI KIỂM TRA ĐỘ CHÍNH XÁC ---
console.log('Kiểm tra Middleware: protect:', typeof protect);
console.log('Kiểm tra Middleware: authorize:', typeof authorize);
console.log('Kiểm tra Controller: getApplications:', typeof applicationController.getApplications);
// --- KẾT THÚC KIỂM TRA ---

// Chắc chắn rằng protect và authorize là function (và controller cũng là function)
if (typeof protect !== 'function' || typeof authorize !== 'function' || typeof applicationController.getApplications !== 'function') {
    // Nếu có lỗi, chúng ta sẽ in thông báo rõ ràng hơn và dừng lại
    console.error('LỖI ĐĂNG KÝ ROUTE: Một trong các hàm xử lý không phải là FUNCTION.');
    process.exit(1); // Dừng server với mã lỗi để dễ debug
}


router.route('/')
    .get(protect, authorize('admin', 'client'), applicationController.getApplications) // Dòng này là dòng 19
    .post(protect, authorize('admin'), applicationController.createApplication);

router.route('/:id')
    .get(protect, authorize('admin', 'client'), applicationController.getSingleApplication) 
    .put(protect, authorize('admin'), applicationController.updateApplication)
    .delete(protect, authorize('admin'), applicationController.deleteApplication);

module.exports = router;

    
