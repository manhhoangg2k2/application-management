// server/controllers/applicationController.js
const Application = require('../models/Application');
const User = require('../models/User'); 
const CHPlayAccount = require('../models/CHPlayAccount');
// Giả định CHPlayAccount Model sẽ được tạo sau

exports.getSingleApplication = async (req, res) => {
    try {
        const app = await Application.findById(req.params.id)
            .populate('client', 'name username contactInfo')
            .populate('chplayAccount', 'name type');

        if (!app) {
            return res.status(404).json({ success: false, message: `Không tìm thấy ứng dụng với ID: ${req.params.id}` });
        }

        // Kiểm tra quyền truy cập nếu là Client
        if (req.user.role !== 'admin' && app.client.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền xem ứng dụng này.' });
        }

        res.status(200).json({ success: true, data: app });

    } catch (error) {
        console.error('Lỗi khi lấy ứng dụng đơn lẻ:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Admin: Lấy tất cả Applications, Client: Chỉ lấy Applications của họ
 * @route   GET /api/applications
 * @access  Private
 */
exports.getApplications = async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const query = {};

        // Pagination & Filters
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
        const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : null;
        const toDate = req.query.toDate ? new Date(req.query.toDate) : null;

        // Nếu là Client, chỉ lấy các ứng dụng mà họ là Client
        if (!isAdmin) {
            query.client = req.user._id;
        }

        // Date range filter on createdAt
        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate && !isNaN(fromDate)) query.createdAt.$gte = fromDate;
            if (toDate && !isNaN(toDate)) {
                // set to end of day if time not provided
                const end = new Date(toDate);
                if (
                    end.getHours() === 0 &&
                    end.getMinutes() === 0 &&
                    end.getSeconds() === 0 &&
                    end.getMilliseconds() === 0
                ) {
                    end.setHours(23, 59, 59, 999);
                }
                query.createdAt.$lte = end;
            }
            if (Object.keys(query.createdAt).length === 0) delete query.createdAt;
        }

        const total = await Application.countDocuments(query);
        const applications = await Application.find(query)
            .populate('client', 'name username contactInfo') // Lấy tên khách hàng
            .populate('chplayAccount', 'name type') // Lấy tên tài khoản CHPlay
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            success: true,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
            count: applications.length,
            data: applications
        });

    } catch (error) {
        console.error('Lỗi khi lấy danh sách ứng dụng:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Admin: Tạo mới một Application
 * @route   POST /api/applications
 * @access  Private/Admin
 */
exports.createApplication = async (req, res) => {
    try {
        if (!req.body.name || !req.body.appId || !req.body.client || !req.body.chplayAccount || !req.body.updateDate) {
            return res.status(400).json({ success: false, message: 'Thiếu các trường bắt buộc (Tên App, ID App, Client ID, CHPlay Account ID, Ngày Up).' });
        }

        // Kiểm tra ngày up nếu có
        if (req.body.updateDate) {
            req.body.dateUploaded = new Date(req.body.updateDate);
        }

        // Kiểm tra IAP IDs nếu có
        if (req.body.iapIds && req.body.iapIds.length > 0) {
            const validIapIds = req.body.iapIds.filter(id => id && id.trim() !== '');
            if (validIapIds.length < 5) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập ít nhất 5 IAP ID hợp lệ.' });
            }
            req.body.iapIds = validIapIds; // Chỉ lưu các IAP ID hợp lệ
        }

        const newApp = await Application.create(req.body);

        const app = await Application.findById(newApp._id)
            .populate('client', 'name username contactInfo')
            .populate('chplayAccount', 'name username type');

        res.status(201).json({ success: true, data: app });

    } catch (error) {
        console.error('Lỗi khi tạo ứng dụng:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Tên hoặc ID ứng dụng đã tồn tại.' });
        }
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Admin: Cập nhật Application
 * @route   PUT /api/applications/:id
 * @access  Private/Admin
 */
exports.updateApplication = async (req, res) => {
    try {
        // Kiểm tra ngày up nếu có
        if (req.body.updateDate) {
            req.body.dateUploaded = new Date(req.body.updateDate);
        }

        // Kiểm tra IAP IDs nếu có trong request
        if (req.body.iapIds && req.body.iapIds.length > 0) {
            const validIapIds = req.body.iapIds.filter(id => id && id.trim() !== '');
            if (validIapIds.length < 5) {
                return res.status(400).json({ success: false, message: 'Vui lòng nhập ít nhất 5 IAP ID hợp lệ.' });
            }
            req.body.iapIds = validIapIds; // Chỉ lưu các IAP ID hợp lệ
        }

        const app = await Application.findByIdAndUpdate(req.params.id, req.body, {
            new: true, 
            runValidators: true 
        })
        .populate('client', 'name username contactInfo')
        .populate('chplayAccount', 'name type');

        if (!app) {
            return res.status(404).json({ success: false, message: `Không tìm thấy ứng dụng với ID: ${req.params.id}` });
        }

        res.status(200).json({ success: true, data: app });

    } catch (error) {
        console.error('Lỗi khi cập nhật ứng dụng:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Admin: Xóa Application
 * @route   DELETE /api/applications/:id
 * @access  Private/Admin
 */
exports.deleteApplication = async (req, res) => {
    try {
        const app = await Application.findByIdAndDelete(req.params.id);

        if (!app) {
            return res.status(404).json({ success: false, message: `Không tìm thấy ứng dụng với ID: ${req.params.id}` });
        }

        res.status(200).json({ success: true, message: 'Ứng dụng đã được xóa thành công.' });

    } catch (error) {
        console.error('Lỗi khi xóa ứng dụng:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};