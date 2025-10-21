// server/models/Application.js
const mongoose = require('mongoose');

// Counter schema for auto-incrementing APP ID
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

const ApplicationSchema = new mongoose.Schema({
    appServerId: {
        type: String,
        unique: true
    },
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
        enum: [
            'requested',      // Yêu cầu
            'in_progress',    // Đang thực hiện
            'testing',        // Đang thử nghiệm
            'pending_review', // Chờ duyệt
            'approved',       // Đã duyệt
            'transferred'     // Đã duyệt (đã chuyển)
        ],
        default: 'requested'
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
    linkApp: {
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

// Pre-save middleware to generate appServerId
ApplicationSchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                'appServerId',
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.appServerId = 'APP' + counter.seq.toString().padStart(4, '0');
        } catch (error) {
            return next(error);
        }
    }
    next();
});

module.exports = mongoose.model('Application', ApplicationSchema);