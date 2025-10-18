// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Cần để mã hóa mật khẩu

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Vui lòng nhập tên đăng nhập'],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Vui lòng nhập mật khẩu'],
        select: false // Không trả về mật khẩu khi tìm kiếm User
    },
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên người dùng']
    },
    role: {
        type: String,
        enum: ['admin', 'client'], // Chỉ chấp nhận 2 role này
        default: 'client'
    },
    // Thông tin thêm cho client
    contactInfo: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// --- Middleware Pre-save (Hash Mật khẩu) ---
UserSchema.pre('save', async function(next) {
    // Chỉ hash nếu mật khẩu bị thay đổi (hoặc là lần tạo mới)
    if (!this.isModified('password')) {
        next();
    }

    // Tạo Salt (ngẫu nhiên) và Hash mật khẩu
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// --- Phương thức so sánh mật khẩu ---
UserSchema.methods.matchPassword = async function(enteredPassword) {
    // So sánh mật khẩu người dùng nhập vào (đã hash) với mật khẩu trong DB (đã hash)
    return await bcrypt.compare(enteredPassword, this.password);
};


module.exports = mongoose.model('User', UserSchema);
