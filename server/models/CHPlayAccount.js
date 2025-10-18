// server/models/CHPlayAccount.js
const mongoose = require('mongoose');

const CHPlayAccountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên tài khoản CHPlay.'],
        trim: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['individual', 'developer', 'company'],
        default: 'developer'
    },
    address: {
        type: String,
        default: null
    },
    username: {
        type: String,
        default: null
    },
    password: { // Lưu ý: Nên lưu mật khẩu đã hash nếu có
        type: String,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CHPlayAccount', CHPlayAccountSchema);
