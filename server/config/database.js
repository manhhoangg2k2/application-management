const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;

const connectDB = async () => {
    if (!mongoURI || mongoURI === 'ĐIỀN CHUỖI KẾT NỐI MONGODB CỦA BẠN VÀO ĐÂY') {
        console.error("LỖI: MONGO_URI chưa được cấu hình trong file .env. Vui lòng cập nhật.");
        process.exit(1);
    }
    
    try {
        const conn = await mongoose.connect(mongoURI);

        console.log(`Kết nối MongoDB thành công: ${conn.connection.host}`);
    } catch (error) {
        console.error(`LỖI KẾT NỐI DB: ${error.message}`);
        process.exit(1); 
    }
};

module.exports = connectDB;
