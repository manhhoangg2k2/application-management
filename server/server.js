// server/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// 1. Tải và cấu hình Biến Môi trường từ file .env
dotenv.config(); 

// Import hàm kết nối Database
const connectDB = require('./config/database');
connectDB(); // Thực thi kết nối DB

const app = express();
// Lấy cổng từ .env hoặc mặc định là 5000
const PORT = process.env.PORT || 5000;

// --- Khai báo Routes ---
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications'); 
const chplayAccountRoutes = require('./routes/chplayAccount');   
const userRoutes = require('./routes/user');
const transactionRoutes = require('./routes/transactions');
// Khi có thêm routes, bạn sẽ khai báo ở đây

// --- Middleware Cần Thiết ---

// Cho phép các yêu cầu từ Frontend (React)
app.use(cors()); 
// Cho phép server đọc body request dưới dạng JSON
app.use(express.json()); 

// --- Định nghĩa các Route API ---

// 1. Routes Authentication
app.use('/api/auth', authRoutes);

// 2. Routes Applications
app.use('/api/applications', applicationRoutes);

app.use('/api/chplay-accounts', chplayAccountRoutes);

app.use('/api/users', userRoutes);

app.use('/api/transactions', transactionRoutes);

// *Các routes mới sẽ được thêm vào đây* 


// Route kiểm tra trạng thái sức khỏe của server
app.get('/', (req, res) => {
    res.send('Server Quản Lý Ứng Dụng đang chạy và kết nối Database...');
});

// --- Xử lý lỗi (Error Handling) ---

// Route lỗi 404 (Nếu không có route nào khớp)
app.use((req, res, next) => {
    res.status(404).json({ 
        success: false,
        message: `Không tìm thấy đường dẫn: ${req.originalUrl}` 
    });
});


// Khởi động server
app.listen(PORT, () => {
    const env = process.env.NODE_ENV || 'development';
    console.log(`Server đang chạy tại http://localhost:${PORT} (Môi trường: ${env})`);
});