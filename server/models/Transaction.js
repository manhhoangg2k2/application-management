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
    // Danh mục (để dễ dàng phân tích thống kê)
    category: {
        type: String,
        required: [true, 'Vui lòng xác định danh mục giao dịch.'],
        enum: [
            'development_fee', 'testing_fee', 'server_cost', 'marketing',
            'revenue_share', 'support_fee', 'other_expense', 'other_income'
        ]
    },
    // Số tiền (lưu ý: số tiền nên được lưu dưới dạng số nguyên nhỏ nhất để tránh lỗi dấu phẩy động)
    amount: {
        type: Number,
        required: [true, 'Vui lòng nhập số tiền giao dịch.'],
        min: 0,
    },
    // Trạng thái xử lý
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending',
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    transactionDate: {
        type: Date,
        default: Date.now,
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
