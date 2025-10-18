// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Cần model User

/**
 * @desc    Bảo vệ các route riêng tư. 
 * Kiểm tra Access Token trong Header Authorization.
 * @access  Private Routes
 */
exports.protect = async (req, res, next) => {
    let token;

    // 1. Kiểm tra Header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        // Lấy token từ chuỗi: "Bearer <token>"
        token = req.headers.authorization.split(' ')[1];
    } 

    // Nếu không tìm thấy token trong header
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Không có Access Token. Vui lòng đăng nhập.' 
        });
    }

    try {
        // 2. Xác thực Token
        // Sử dụng JWT_SECRET cho Access Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Tìm kiếm người dùng và đính kèm vào đối tượng Request
        // Dùng select('-password') để không bao gồm mật khẩu
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Người dùng sở hữu token này không tồn tại.' 
            });
        }

        // Đính kèm thông tin người dùng vào request (req.user)
        req.user = user;
        next(); // Chuyển sang Controller tiếp theo

    } catch (error) {
        // Xử lý lỗi Token hết hạn hoặc không hợp lệ
        if (error.name === 'TokenExpiredError') {
             return res.status(401).json({ 
                success: false, 
                message: 'Access Token đã hết hạn. Vui lòng làm mới token.',
                errorCode: 'TOKEN_EXPIRED'
            });
        }
        return res.status(401).json({ 
            success: false, 
            message: 'Access Token không hợp lệ.' 
        });
    }
};