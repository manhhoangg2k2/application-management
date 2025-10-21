const Transaction = require('../models/Transaction');

/**
 * @desc    Lấy tất cả giao dịch (Admin: tất cả, User: chỉ của họ)
 * @route   GET /api/transactions
 * @access  Private
 */
exports.getTransactions = async (req, res) => {
    try {
        let filter = {};
        let query = Transaction.find();

        // Nếu người dùng không phải Admin, chỉ cho phép họ xem giao dịch của chính họ
        if (req.user.role !== 'admin') {
            filter.userId = req.user.id;
        }

        // Apply filters
        if (Object.keys(filter).length > 0) {
            query = query.where(filter);
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Date filters
        if (req.query.fromDate) {
            query = query.where('transactionDate').gte(new Date(req.query.fromDate));
        }
        if (req.query.toDate) {
            query = query.where('transactionDate').lte(new Date(req.query.toDate));
        }

        // Execute query with pagination
        const transactions = await query
            .sort({ transactionDate: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const total = await Transaction.countDocuments(filter);

        // Process transactions based on user role
        let processedTransactions = transactions;
        if (req.user.role === 'user') {
            processedTransactions = transactions.map(transaction => {
                const processedTransaction = transaction.toObject();
                // Đảo ngược type để hiển thị đúng cho User
                if (processedTransaction.type === 'expense') {
                    processedTransaction.type = 'revenue'; // Admin chi -> User thu
                } else if (processedTransaction.type === 'revenue') {
                    processedTransaction.type = 'expense'; // Admin thu -> User chi
                }
                return processedTransaction;
            });
        }

        res.status(200).json({
            success: true,
            count: processedTransactions.length,
            total: total,
            page: page,
            totalPages: Math.ceil(total / limit),
            data: processedTransactions
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách giao dịch:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Lấy chi tiết giao dịch theo ID
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

        // Process transaction for User
        let processedTransaction = transaction.toObject();
        if (req.user.role === 'user') {
            if (processedTransaction.type === 'expense') {
                processedTransaction.type = 'revenue'; // Admin chi -> User thu
            } else if (processedTransaction.type === 'revenue') {
                processedTransaction.type = 'expense'; // Admin thu -> User chi
            }
        }

        res.status(200).json({ success: true, data: processedTransaction });
    } catch (error) {
        console.error('Lỗi khi lấy giao dịch:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Tạo giao dịch mới
 * @route   POST /api/transactions
 * @access  Private
 */
exports.createTransaction = async (req, res) => {
    try {
        let transactionData = { ...req.body };
        
        // Validate required fields
        if (!transactionData.amount || transactionData.amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Số tiền phải lớn hơn 0.' 
            });
        }

        if (!transactionData.description || transactionData.description.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Mô tả giao dịch không được để trống.' 
            });
        }

        // Xử lý logic dựa trên role
        if (req.user.role === 'user') {
            // User tạo giao dịch
            transactionData.userId = req.user.id;
            
            // Logic ngược: User thu = Admin chi, User chi = Admin thu
            if (transactionData.type === 'revenue') {
                // User thu -> Admin chi tiền cho User
                transactionData.type = 'expense';
                transactionData.category = 'user_income';
            } else if (transactionData.type === 'expense') {
                // User chi -> Admin thu tiền từ User
                transactionData.type = 'revenue';
                transactionData.category = 'user_payment';
            }
            
            // Set default status for User
            transactionData.status = 'completed';
            
        } else if (req.user.role === 'admin') {
            // Admin tạo giao dịch
            transactionData.userId = transactionData.userId || req.user.id;
            
            // Set default category if not provided
            if (!transactionData.category) {
                if (transactionData.type === 'revenue') {
                    transactionData.category = 'other_income';
                } else {
                    transactionData.category = 'other_expense';
                }
            }
        }
        
        const transaction = await Transaction.create(transactionData);
        
        // Populate để trả về thông tin đầy đủ
        await transaction.populate('applicationId', 'name appId');
        
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
 * @desc    Cập nhật giao dịch
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
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Xóa giao dịch
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

/**
 * @desc    Lấy thống kê giao dịch
 * @route   GET /api/transactions/statistics
 * @access  Private
 */
exports.getTransactionStatistics = async (req, res) => {
    try {
        let filter = {};

        // Nếu người dùng không phải Admin, chỉ tính thống kê của họ
        if (req.user.role !== 'admin') {
            filter.userId = req.user.id;
        }

        // Date filters
        if (req.query.fromDate) {
            filter.transactionDate = { ...filter.transactionDate, $gte: new Date(req.query.fromDate) };
        }
        if (req.query.toDate) {
            filter.transactionDate = { ...filter.transactionDate, $lte: new Date(req.query.toDate) };
        }

        const transactions = await Transaction.find(filter);

        const statistics = {
            totalTransactions: transactions.length,
            totalRevenue: 0,
            totalExpense: 0,
            netBalance: 0
        };

        transactions.forEach(transaction => {
            if (transaction.type === 'revenue') {
                statistics.totalRevenue += transaction.amount;
            } else if (transaction.type === 'expense') {
                statistics.totalExpense += transaction.amount;
            }
        });

        statistics.netBalance = statistics.totalRevenue - statistics.totalExpense;

        // Nếu là User, đảo ngược logic hiển thị
        if (req.user.role === 'user') {
            const userStats = {
                totalTransactions: statistics.totalTransactions,
                totalExpense: statistics.totalRevenue, // Admin thu = User chi
                totalAppRevenue: statistics.totalExpense, // Admin chi = User thu
                balance: statistics.totalExpense - statistics.totalRevenue // User thu - User chi
            };
            return res.status(200).json({ success: true, data: userStats });
        }

        res.status(200).json({ success: true, data: statistics });
    } catch (error) {
        console.error('Lỗi khi lấy thống kê giao dịch:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};