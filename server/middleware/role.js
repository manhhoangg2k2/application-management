// server/middleware/role.js

/**
 * @desc    Hàm kiểm tra vai trò của người dùng (Admin, Client).
 * @param   {...string} roles - Danh sách các vai trò được phép truy cập.
 * @access  Private Routes
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        // Kiểm tra xem vai trò của người dùng hiện tại (req.user.role)
        // có nằm trong danh sách các vai trò được phép (roles) không
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Quyền truy cập bị từ chối. Người dùng ${req.user.role} không được phép thực hiện hành động này.`,
            });
        }
        next(); // Được phép truy cập
    };
};