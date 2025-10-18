// server/models/Application.js
const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vui lòng nhập tên Ứng dụng.'],
        trim: true,
        unique: true
    },
    appId: {
        type: String,
        required: [true, 'Vui lòng nhập ID độc nhất của Ứng dụng (Package ID).'],
        trim: true,
        unique: true
    },
    dateUploaded: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['draft', 'testing', 'waiting_for_review', 'approved', 'suspended', 'finished'],
        default: 'draft'
    },
    description: {
        type: String,
        required: false
    },
    assetLinks: {
        type: Object, 
        default: {} 
    },
    iapIds: {
        type: [String], 
        default: [],
        validate: {
            validator: function(v) {
                // Ít nhất phải có 5 IAP ID không rỗng
                return v.filter(id => id && id.trim() !== '').length >= 5;
            },
            message: 'Vui lòng nhập ít nhất 5 IAP ID hợp lệ.'
        }
    },
    costDevelopment: {
        type: Number,
        default: 0
    },
    costTesting: {
        type: Number,
        default: 0
    },
    costOther: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        required: false
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Vui lòng chọn Khách hàng sở hữu ứng dụng.']
    },
    chplayAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CHPlayAccount', 
        required: [true, 'Vui lòng chọn Tài khoản CHPlay được sử dụng.']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Application', ApplicationSchema);