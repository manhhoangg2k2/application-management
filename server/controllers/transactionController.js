const Transaction = require('../models/Transaction');

/**
 * @desc    Lấy tất cả giao dịch (Admin: tất cả, Client: chỉ của họ)
 * @route   GET /api/transactions
 * @access  Private
 */
exports.getTransactions = async (req, res) => {
    try {
        let filter = {};

        // Nếu người dùng không phải Admin, chỉ cho phép họ xem giao dịch của chính họ
        if (req.user.role !== 'admin') {
            filter.userId = req.user.id;
        }

        const transactions = await Transaction.find(filter).sort({ transactionDate: -1 });

        res.status(200).json({ success: true, count: transactions.length, data: transactions });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách giao dịch:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Lấy chi tiết giao dịch theo ID (Admin: bất kỳ, Client: chỉ của họ)
 * @route   GET /api/transactions/:id
 * @access  Private
 */
exports.getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch.' });
        }

        // Kiểm tra quyền: Nếu không phải Admin VÀ userId không khớp với user đang đăng nhập
        if (req.user.role !== 'admin' && transaction.userId._id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập giao dịch này.' });
        }

        res.status(200).json({ success: true, data: transaction });
    } catch (error) {
        console.error('Lỗi khi lấy giao dịch:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Admin: Tạo giao dịch mới
 * @route   POST /api/transactions
 * @access  Private/Admin
 */
exports.createTransaction = async (req, res) => {
    try {
        // Chỉ Admin mới có quyền tạo giao dịch
        if (req.user.role !== 'admin') {
             return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này.' });
        }
        
        const transaction = await Transaction.create(req.body);
        res.status(201).json({ success: true, data: transaction });

    } catch (error) {
        console.error('Lỗi khi tạo giao dịch:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Admin: Cập nhật giao dịch
 * @route   PUT /api/transactions/:id
 * @access  Private/Admin
 */
exports.updateTransaction = async (req, res) => {
    try {
        // Chỉ Admin mới có quyền cập nhật giao dịch
        if (req.user.role !== 'admin') {
             return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này.' });
        }
        
        const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch để cập nhật.' });
        }

        res.status(200).json({ success: true, data: transaction });

    } catch (error) {
        console.error('Lỗi khi cập nhật giao dịch:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Admin: Xóa giao dịch
 * @route   DELETE /api/transactions/:id
 * @access  Private/Admin
 */
exports.deleteTransaction = async (req, res) => {
    try {
        // Chỉ Admin mới có quyền xóa giao dịch
        if (req.user.role !== 'admin') {
             return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này.' });
        }
        
        const transaction = await Transaction.findByIdAndDelete(req.params.id);

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch để xóa.' });
        }

        res.status(200).json({ success: true, data: {} });

    } catch (error) {
        console.error('Lỗi khi xóa giao dịch:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};
