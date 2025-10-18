// server/controllers/userController.js
const User = require('../models/User');

/**
 * @desc    Admin: Lấy tất cả người dùng với phân trang và tìm kiếm
 * @route   GET /api/users?page=1&limit=10&search=keyword&role=admin
 * @access  Private/Admin
 */
exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const role = req.query.role || '';
        
        // Tạo điều kiện tìm kiếm
        let searchCondition = {};
        
        if (search) {
            searchCondition = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } }
                ]
            };
        }
        
        if (role) {
            searchCondition.role = role;
        }
        
        // Tính toán skip
        const skip = (page - 1) * limit;
        
        // Lấy tổng số bản ghi
        const total = await User.countDocuments(searchCondition);
        
        // Lấy dữ liệu với phân trang
        const users = await User.find(searchCondition)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        // Tính toán thông tin phân trang
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        res.status(200).json({ 
            success: true, 
            data: users,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                itemsPerPage: limit,
                hasNextPage,
                hasPrevPage
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách người dùng:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Lấy thông tin profile của người dùng hiện tại (Admin/Client)
 * @route   GET /api/users/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
    // Thông tin người dùng đã được đính kèm vào req.user bởi middleware 'protect'
    try {
        // Dùng select('-password') để đảm bảo mật khẩu không bao giờ bị trả về
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng.' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin cá nhân:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Admin: Lấy thông tin user theo ID
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy người dùng với ID này.' 
            });
        }
        
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Admin: Tạo tài khoản Client mới (Admin có thể dùng API này thay cho /api/auth/register-user)
 * @route   POST /api/users
 * @access  Private/Admin
 */
exports.createUser = async (req, res) => {
    try {
        const { username, name, password, role } = req.body;
        
        if (await User.findOne({ username })) {
            return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại.' });
        }
        
        // Đảm bảo Admin không tạo nhầm tài khoản Admin khác qua API này (luôn là 'client')
        const newRole = role === 'admin' ? 'client' : role || 'client';

        const user = await User.create({
            username,
            name,
            password,
            role: newRole
        });
        
        // Trả về thông tin user mà không bao gồm password
        res.status(201).json({ success: true, data: user.toJSON() }); 

    } catch (error) {
        console.error('Lỗi khi tạo người dùng:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Admin: Cập nhật thông tin user
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
exports.updateUser = async (req, res) => {
    try {
        const { name, username, role, password } = req.body;
        const userId = req.params.id;
        
        // Kiểm tra user có tồn tại không
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy người dùng với ID này.' 
            });
        }
        
        // Kiểm tra username có bị trùng không (nếu có thay đổi username)
        if (username && username !== existingUser.username) {
            const usernameExists = await User.findOne({ 
                username, 
                _id: { $ne: userId } 
            });
            if (usernameExists) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Tên đăng nhập đã tồn tại.' 
                });
            }
        }
        
        // Chuẩn bị dữ liệu cập nhật
        const updateData = {};
        if (name) updateData.name = name;
        if (username) updateData.username = username;
        if (role) updateData.role = role;
        if (password) updateData.password = password;
        
        // Cập nhật user
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            updateData, 
            { new: true, runValidators: true }
        ).select('-password');
        
        res.status(200).json({ 
            success: true, 
            message: 'Cập nhật thông tin người dùng thành công.',
            data: updatedUser 
        });
        
    } catch (error) {
        console.error('Lỗi khi cập nhật người dùng:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Admin: Xóa user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Kiểm tra user có tồn tại không
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy người dùng với ID này.' 
            });
        }
        
        // Không cho phép xóa chính mình
        if (userId === req.user.id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Bạn không thể xóa tài khoản của chính mình.' 
            });
        }
        
        // Xóa user
        await User.findByIdAndDelete(userId);
        
        res.status(200).json({ 
            success: true, 
            message: 'Xóa người dùng thành công.' 
        });
        
    } catch (error) {
        console.error('Lỗi khi xóa người dùng:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};