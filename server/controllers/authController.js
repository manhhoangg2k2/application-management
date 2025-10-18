// server/controllers/authController.js
const User = require('../models/User'); 
const jwt = require('jsonwebtoken'); 

// --- Hàm Helper để tạo Access Token & Refresh Token ---
const getSignedTokens = (user) => {
    // 1. Tạo Access Token (Ngắn hạn)
    const accessToken = jwt.sign(
        { id: user._id, role: user.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
    );

    // 2. Tạo Refresh Token (Dài hạn)
    const refreshToken = jwt.sign(
        { id: user._id }, 
        process.env.JWT_REFRESH_SECRET, 
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    return { accessToken, refreshToken };
};


/**
 * @desc    Đăng ký tài khoản Admin (Chỉ cho Admin đầu tiên)
 * @route   POST /api/auth/register-admin
 * @access  Public
 */
exports.registerAdmin = async (req, res) => {
    try {
        const { username, name, password } = req.body;
        
        if (!username || !password || !name) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ tên, tên đăng nhập và mật khẩu.' });
        }

        // 1. Kiểm tra xem đã có Admin nào tồn tại chưa
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount > 0) {
            return res.status(403).json({ success: false, message: 'Đã có tài khoản Admin tồn tại. Không thể đăng ký thêm.' });
        }
        
        // 2. Kiểm tra xem username đã tồn tại chưa
        if (await User.findOne({ username })) {
            return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại.' });
        }

        // 3. Tạo tài khoản Admin mới
        const user = await User.create({
            username,
            name,
            password,
            role: 'admin'
        });

        // 4. Tạo token và gửi phản hồi
        const { accessToken, refreshToken } = getSignedTokens(user);

        res.status(201).json({
            success: true,
            accessToken,
            refreshToken, 
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Lỗi khi đăng ký Admin:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Đăng ký tài khoản User Client
 * @route   POST /api/auth/register-user
 * @access  Public (Sử dụng cho Admin tạo hoặc Client tự đăng ký)
 */
exports.registerUser = async (req, res) => {
    try {
        const { username, name, password, role } = req.body;
        
        if (!username || !password || !name) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ tên, tên đăng nhập và mật khẩu.' });
        }
        
        // Kiểm tra xem username đã tồn tại chưa
        if (await User.findOne({ username })) {
            return res.status(400).json({ success: false, message: 'Tên đăng nhập đã tồn tại.' });
        }

        // 1. Tạo tài khoản Client mới (role mặc định là 'client')
        const user = await User.create({
            username,
            name,
            password,
            // Đảm bảo không thể tạo Admin qua API này
            role: (role === 'admin' && !req.user) ? 'client' : role || 'client' 
        });

        // 2. Tạo token và gửi phản hồi
        const { accessToken, refreshToken } = getSignedTokens(user);

        res.status(201).json({
            success: true,
            accessToken,
            refreshToken, 
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Lỗi khi đăng ký User:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Đăng nhập cho cả Admin và User Client
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên đăng nhập và mật khẩu.' });
        }

        // Tìm kiếm người dùng và lấy mật khẩu để so sánh
        const user = await User.findOne({ username }).select('+password');

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Thông tin đăng nhập không hợp lệ.' });
        }

        // Tạo Access Token và Refresh Token
        const { accessToken, refreshToken } = getSignedTokens(user);

        res.status(200).json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
    }
};

/**
 * @desc    Tạo Access Token mới từ Refresh Token cũ
 * @route   POST /api/auth/token
 * @access  Public (yêu cầu Refresh Token)
 */
exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Không tìm thấy Refresh Token.' });
    }

    try {
        // 1. Xác thực Refresh Token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        
        // 2. Tìm người dùng
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Người dùng không tồn tại.' });
        }
        
        // 3. Tạo Access Token MỚI 
        const newAccessToken = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m' }
        );

        res.status(200).json({ 
            success: true, 
            accessToken: newAccessToken,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        res.status(401).json({ success: false, message: 'Refresh Token không hợp lệ hoặc đã hết hạn.' });
    }
};