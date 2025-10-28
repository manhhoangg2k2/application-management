const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    // Tham chiếu đến người dùng (Admin hoặc Client)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Transaction phải liên kết với một User.'],
    },
    // Tham chiếu đến ứng dụng liên quan (nếu có)
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        default: null, // Cho phép null nếu giao dịch không liên quan trực tiếp đến App
    },
    // Loại giao dịch: income (thu) hoặc expense (chi)
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: [true, 'Vui lòng xác định loại giao dịch (income/expense).'],
    },
    // Danh mục giao dịch
    category: {
        type: String,
        required: [true, 'Vui lòng xác định danh mục giao dịch.'],
        enum: [
            // Admin categories
            'development_fee', 'testing_fee', 'server_cost', 'marketing',
            'revenue_share', 'support_fee', 'other_expense', 'other_income',
            // User categories (từ góc nhìn Admin)
            'user_payment', 'user_income', 'app_development', 'app_testing'
        ]
    },
    // Số tiền (luôn dương, lưu theo góc nhìn Admin)
    amount: {
        type: Number,
        required: [true, 'Vui lòng nhập số tiền giao dịch.'],
        min: 0,
    },
    // Trạng thái xử lý
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'completed', // Mặc định completed cho User
    },
    // Mô tả giao dịch
    description: {
        type: String,
        trim: true,
        maxlength: 500,
        required: [true, 'Vui lòng nhập mô tả giao dịch.'],
    },
    // Ngày giao dịch
    transactionDate: {
        type: Date,
        default: Date.now,
    },
    // Ghi chú thêm (optional)
    notes: {
        type: String,
        trim: true,
        maxlength: 1000,
    },
    // Thông tin SePay webhook
    sepayData: {
        // ID giao dịch trên SePay
        sepayId: {
            type: Number,
            default: null
        },
        // Brand name của ngân hàng
        gateway: {
            type: String,
            default: null
        },
        // Thời gian xảy ra giao dịch phía ngân hàng
        bankTransactionDate: {
            type: Date,
            default: null
        },
        // Số tài khoản ngân hàng
        accountNumber: {
            type: String,
            default: null
        },
        // Mã code thanh toán
        paymentCode: {
            type: String,
            default: null
        },
        // Nội dung chuyển khoản
        transferContent: {
            type: String,
            default: null
        },
        // Loại giao dịch (in/out)
        transferType: {
            type: String,
            enum: ['in', 'out'],
            default: null
        },
        // Số tiền giao dịch từ SePay
        transferAmount: {
            type: Number,
            default: null
        },
        // Số dư tài khoản (lũy kế)
        accumulated: {
            type: Number,
            default: null
        },
        // Tài khoản ngân hàng phụ
        subAccount: {
            type: String,
            default: null
        },
        // Mã tham chiếu của tin nhắn sms
        referenceCode: {
            type: String,
            default: null
        },
        // Toàn bộ nội dung tin nhắn sms
        smsDescription: {
            type: String,
            default: null
        }
    },
    // Mã xác thực để match với SePay webhook
    verificationCode: {
        type: String,
        unique: true,
        sparse: true, // Cho phép null và unique chỉ áp dụng khi có giá trị
        default: null
    }
}, {
    timestamps: true // Thêm createdAt và updatedAt
});

// Populate thông tin User và Application khi truy vấn
TransactionSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'userId',
        select: 'name username role'
    }).populate({
        path: 'applicationId',
        select: 'name appId'
    });
    next();
});

module.exports = mongoose.model('Transaction', TransactionSchema);
