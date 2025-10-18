// server/controllers/chplayAccountController.js
const CHPlayAccount = require('../models/CHPlayAccount');

/**
 * @desc    Admin: Lấy tất cả CHPlay Accounts
 * @route   GET /api/chplay-accounts
 * @access  Private/Admin
 */
exports.getCHPlayAccounts = async (req, res) => {
    try {
        const accounts = await CHPlayAccount.find().sort({ name: 1 });
        res.status(200).json({ success: true, count: accounts.length, data: accounts });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách tài khoản CHPlay:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Admin: Tạo mới một CHPlay Account
 * @route   POST /api/chplay-accounts
 * @access  Private/Admin
 */
exports.createCHPlayAccount = async (req, res) => {
    try {
        if (!req.body.name) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên tài khoản CHPlay.' });
        }
        const account = await CHPlayAccount.create(req.body);
        res.status(201).json({ success: true, data: account });
    } catch (error) {
        console.error('Lỗi khi tạo tài khoản CHPlay:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Tên tài khoản CHPlay đã tồn tại.' });
        }
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Admin: Cập nhật CHPlay Account
 * @route   PUT /api/chplay-accounts/:id
 * @access  Private/Admin
 */
exports.updateCHPlayAccount = async (req, res) => {
    try {
        const account = await CHPlayAccount.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!account) {
            return res.status(404).json({ success: false, message: `Không tìm thấy tài khoản CHPlay với ID: ${req.params.id}` });
        }
        res.status(200).json({ success: true, data: account });
    } catch (error) {
        console.error('Lỗi khi cập nhật tài khoản CHPlay:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Admin: Xóa CHPlay Account
 * @route   DELETE /api/chplay-accounts/:id
 * @access  Private/Admin
 */
exports.deleteCHPlayAccount = async (req, res) => {
    try {
        const account = await CHPlayAccount.findByIdAndDelete(req.params.id);
        if (!account) {
            return res.status(404).json({ success: false, message: `Không tìm thấy tài khoản CHPlay với ID: ${req.params.id}` });
        }
        res.status(200).json({ success: true, message: 'Tài khoản CHPlay đã được xóa thành công.' });
    } catch (error) {
        console.error('Lỗi khi xóa tài khoản CHPlay:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};
