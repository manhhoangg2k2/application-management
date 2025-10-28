/**
 * Middleware xác thực API key cho SePay webhook
 * SePay sẽ gửi API key trong header Authorization với format: "Apikey API_KEY_CUA_BAN"
 */

const sepayApiKey = process.env.SEPAY_API_KEY;

const authenticateSePay = (req, res, next) => {
    try {
        // Lấy Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Thiếu Authorization header'
            });
        }

        // Kiểm tra format "Apikey API_KEY"
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Apikey') {
            return res.status(401).json({
                success: false,
                message: 'Format Authorization header không đúng. Cần: "Apikey YOUR_API_KEY"'
            });
        }

        const providedApiKey = parts[1];

        // Kiểm tra API key
        if (!sepayApiKey) {
            console.error('SEPAY_API_KEY chưa được cấu hình trong environment variables');
            return res.status(500).json({
                success: false,
                message: 'Cấu hình API key chưa đúng'
            });
        }

        if (providedApiKey !== sepayApiKey) {
            return res.status(401).json({
                success: false,
                message: 'API key không hợp lệ'
            });
        }

        // Xác thực thành công
        next();

    } catch (error) {
        console.error('Lỗi xác thực SePay:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi xác thực'
        });
    }
};

module.exports = { authenticateSePay };
