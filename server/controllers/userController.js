const Application = require('../models/Application');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

/**
 * @desc    User: Lấy danh sách ứng dụng của mình
 * @route   GET /api/user/applications
 * @access  Private/User
 */
exports.getUserApplications = async (req, res) => {
    try {
        // Build filter based on query params
        const filter = { client: req.user.id };

        // Search by name or appId (case-insensitive)
        if (req.query.search) {
            // sanitize search input for regex
            const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const q = escapeRegExp(req.query.search.trim());
            const regex = new RegExp(q, 'i');
            filter.$or = [ { name: regex }, { appId: regex } ];
        }

        // Status filter
        if (req.query.status && req.query.status !== 'all') {
            filter.status = req.query.status;
        }

        // Date range filter on createdAt
        if (req.query.fromDate || req.query.toDate) {
            filter.createdAt = {};
            if (req.query.fromDate) filter.createdAt.$gte = new Date(req.query.fromDate);
            if (req.query.toDate) filter.createdAt.$lte = new Date(req.query.toDate);
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const total = await Application.countDocuments(filter);

        // Query with pagination
        const applications = await Application.find(filter)
            .populate('chplayAccount', 'email status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: total,
            page: page,
            totalPages: Math.ceil(total / limit) || 1,
            data: applications
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách ứng dụng của user:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ nội bộ.'
        });
    }
};

/**
 * @desc    User: Lấy chi tiết ứng dụng của mình
 * @route   GET /api/user/applications/:id
 * @access  Private/User
 */
exports.getUserApplication = async (req, res) => {
    try {
        const application = await Application.findOne({
            _id: req.params.id,
            client: req.user.id
        }).populate('chplayAccount', 'email status');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy ứng dụng hoặc bạn không có quyền truy cập.'
            });
        }

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết ứng dụng:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ nội bộ.'
        });
    }
};

/**
 * @desc    User: Lấy danh sách giao dịch của mình
 * @route   GET /api/users/transactions
 * @access  Private/User
 */
exports.getUserTransactions = async (req, res) => {
    try {
        let query = Transaction.find({ userId: req.user.id });

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
            .populate('applicationId', 'name appId')
            .sort({ transactionDate: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const total = await Transaction.countDocuments({ userId: req.user.id });

        // Đảo ngược logic hiển thị cho User
        const processedTransactions = transactions.map(transaction => {
            const processedTransaction = transaction.toObject();
            // Đảo ngược type để hiển thị đúng cho User
            if (processedTransaction.type === 'expense') {
                processedTransaction.type = 'income'; // Admin chi -> User thu
            } else if (processedTransaction.type === 'income') {
                processedTransaction.type = 'expense'; // Admin thu -> User chi
            }
            return processedTransaction;
        });

        res.status(200).json({
            success: true,
            count: processedTransactions.length,
            total: total,
            page: page,
            totalPages: Math.ceil(total / limit),
            data: processedTransactions
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách giao dịch của user:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ nội bộ.'
        });
    }
};

/**
 * @desc    User: Tạo giao dịch mới
 * @route   POST /api/users/transactions
 * @access  Private/User
 */
exports.createUserTransaction = async (req, res) => {
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
        
        // User tạo giao dịch sẽ được lưu với userId của họ
        transactionData.userId = req.user.id;
        
        // Logic ngược: User thu = Admin chi, User chi = Admin thu
        if (transactionData.type === 'revenue') {
            // User thu -> Admin chi tiền cho User
            transactionData.type = 'expense';
            transactionData.category = 'user_income';
        } else if (transactionData.type === 'expense') {
            // User chi -> Admin thu tiền từ User
            transactionData.type = 'income';
            transactionData.category = 'user_payment';
        }

        // Set default status
        transactionData.status = 'completed';

        const transaction = await Transaction.create(transactionData);
        
        // Populate để trả về thông tin đầy đủ
        await transaction.populate('applicationId', 'name appId');
        
        res.status(201).json({
            success: true,
            data: transaction
        });

    } catch (error) {
        console.error('Lỗi khi tạo giao dịch:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ nội bộ.'
        });
    }
};

/**
 * @desc    User: Lấy thống kê giao dịch của mình
 * @route   GET /api/users/transactions/statistics
 * @access  Private/User
 */
exports.getUserTransactionStatistics = async (req, res) => {
    try {
        let filter = { userId: req.user.id };

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
            totalExpense: 0,      // User chi
            totalAppRevenue: 0,   // User thu
            balance: 0
        };

        transactions.forEach(transaction => {
            if (transaction.type === 'expense') {
                // Admin chi = User thu (app revenue)
                statistics.totalAppRevenue += transaction.amount;
            } else if (transaction.type === 'income') {
                // Admin thu = User chi (expense)
                statistics.totalExpense += transaction.amount;
            }
        });

        statistics.balance = statistics.totalAppRevenue - statistics.totalExpense;

        res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error('Lỗi khi lấy thống kê giao dịch:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ nội bộ.'
        });
    }
};

/**
 * @desc    User: Lấy thông tin profile của mình
 * @route   GET /api/user/profile
 * @access  Private/User
 */
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng.'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin profile:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ nội bộ.'
        });
    }
};

/**
 * @desc    User: Cập nhật thông tin profile của mình
 * @route   PUT /api/user/profile
 * @access  Private/User
 */
exports.updateUserProfile = async (req, res) => {
    try {
        const allowedUpdates = ['name', 'email', 'phone'];
        const updates = {};
        
        // Chỉ cho phép cập nhật một số field nhất định
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng.'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật profile:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }
        res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ nội bộ.'
        });
    }
};

/**
 * @desc    Admin: Lấy danh sách tất cả users (clients)
 * @route   GET /api/users/all
 * @access  Private/Admin
 */
exports.getAllUsers = async (req, res) => {
    try {
        // Chỉ lấy users có role 'user' (không lấy admin)
        const users = await User.find({ role: 'user' })
            .select('-password')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách users:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ nội bộ.'
        });
    }
};

exports.getUsers = async (req, res) => {
    try {
        let filter = {};
        let query = User.find();

        // Apply filters
        if (Object.keys(filter).length > 0) {
            query = query.where(filter);
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Role filter
        if (req.query.role && req.query.role !== 'all') {
            query = query.where('role').equals(req.query.role);
        }

        // Date filters
        if (req.query.fromDate) {
            query = query.where('createdAt').gte(new Date(req.query.fromDate));
        }
        if (req.query.toDate) {
            query = query.where('createdAt').lte(new Date(req.query.toDate));
        }

        // Execute query with pagination
        const users = await query
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const total = await User.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: users.length,
            total: total,
            page: page,
            totalPages: Math.ceil(total / limit),
            data: users
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách users:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};