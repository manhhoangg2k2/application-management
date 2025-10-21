# Transaction Logic Documentation

## Tổng quan
Đã làm lại toàn bộ phần API tạo giao dịch và quản lý giao dịch với logic rõ ràng và nhất quán.

## Logic Giao dịch

### 1. **Góc nhìn Database (Admin Perspective)**
- **Revenue**: Admin thu tiền
- **Expense**: Admin chi tiền
- **Categories**: 
  - Admin: `development_fee`, `testing_fee`, `server_cost`, `marketing`, `revenue_share`, `support_fee`, `other_expense`, `other_income`
  - User: `user_payment`, `user_income`, `app_development`, `app_testing`

### 2. **Logic Ngược cho User**

#### **User tạo giao dịch "Thu" (revenue)**
```javascript
// User input
{
    type: 'revenue',
    amount: 1000000,
    description: 'Thu tiền từ app'
}

// Lưu trong DB (Admin perspective)
{
    type: 'expense',        // Admin chi tiền cho User
    category: 'user_income',
    amount: 1000000,
    description: 'Thu tiền từ app'
}
```

#### **User tạo giao dịch "Chi" (expense)**
```javascript
// User input
{
    type: 'expense',
    amount: 500000,
    description: 'Chi tiền cho admin'
}

// Lưu trong DB (Admin perspective)
{
    type: 'revenue',        // Admin thu tiền từ User
    category: 'user_payment',
    amount: 500000,
    description: 'Chi tiền cho admin'
}
```

### 3. **Hiển thị cho User**
API trả về dữ liệu đã được đảo ngược:
```javascript
// DB: { type: 'expense', amount: 1000000 }
// User thấy: { type: 'revenue', amount: 1000000 }

// DB: { type: 'revenue', amount: 500000 }
// User thấy: { type: 'expense', amount: 500000 }
```

## API Endpoints

### 1. **Transaction Controller** (`/api/transactions`)

#### **GET /api/transactions**
- **Admin**: Xem tất cả giao dịch
- **User**: Xem giao dịch của mình (đã đảo ngược type)
- **Features**: Pagination, date filtering
- **Response**:
```json
{
    "success": true,
    "count": 10,
    "total": 25,
    "page": 1,
    "totalPages": 3,
    "data": [...]
}
```

#### **POST /api/transactions**
- **Admin**: Tạo giao dịch bình thường
- **User**: Tạo giao dịch với logic ngược
- **Validation**: amount > 0, description required
- **Auto-assign**: userId, category, status

#### **GET /api/transactions/statistics**
- **Admin**: Thống kê tất cả giao dịch
- **User**: Thống kê giao dịch của mình (đã đảo ngược)
- **Response**:
```json
{
    "success": true,
    "data": {
        "totalTransactions": 10,
        "totalRevenue": 5000000,    // Admin thu
        "totalExpense": 3000000,    // Admin chi
        "netBalance": 2000000       // Admin lãi
    }
}
```

### 2. **User Controller** (`/api/users`)

#### **GET /api/users/transactions**
- **User only**: Xem giao dịch của mình
- **Features**: Pagination, date filtering
- **Logic**: Đảo ngược type để hiển thị đúng

#### **POST /api/users/transactions**
- **User only**: Tạo giao dịch mới
- **Logic**: Tự động đảo ngược type và set category
- **Validation**: amount > 0, description required

#### **GET /api/users/transactions/statistics**
- **User only**: Thống kê giao dịch của mình
- **Response**:
```json
{
    "success": true,
    "data": {
        "totalTransactions": 10,
        "totalExpense": 3000000,      // User chi
        "totalAppRevenue": 5000000,   // User thu
        "balance": 2000000            // User lãi
    }
}
```

## Model Schema

### **Transaction Model**
```javascript
{
    userId: ObjectId,           // Required
    applicationId: ObjectId,    // Optional
    type: 'revenue' | 'expense', // Required (Admin perspective)
    category: String,           // Required
    amount: Number,             // Required, min: 0
    status: 'pending' | 'completed' | 'cancelled', // Default: 'completed'
    description: String,        // Required, max: 500
    transactionDate: Date,      // Default: now
    notes: String,              // Optional, max: 1000
    createdAt: Date,            // Auto
    updatedAt: Date             // Auto
}
```

### **Categories**
```javascript
// Admin categories
'development_fee', 'testing_fee', 'server_cost', 'marketing',
'revenue_share', 'support_fee', 'other_expense', 'other_income'

// User categories (from Admin perspective)
'user_payment', 'user_income', 'app_development', 'app_testing'
```

## Validation Rules

### **Create Transaction**
```javascript
// Required fields
- amount: Number > 0
- description: String (not empty)
- type: 'revenue' | 'expense'

// Auto-assigned
- userId: req.user.id
- category: based on type and role
- status: 'completed' (for User)
- transactionDate: now
```

### **Update Transaction**
```javascript
// Admin only
- All fields can be updated
- Validation: same as create
- Cannot change userId
```

## Error Handling

### **Validation Errors**
```json
{
    "success": false,
    "message": "Số tiền phải lớn hơn 0."
}
```

### **Permission Errors**
```json
{
    "success": false,
    "message": "Bạn không có quyền thực hiện thao tác này."
}
```

### **Not Found Errors**
```json
{
    "success": false,
    "message": "Không tìm thấy giao dịch."
}
```

## Testing

### **Test Script**
```bash
node test_transaction_logic.js
```

### **Test Cases**
1. **User tạo giao dịch "Thu"** → DB lưu "Chi"
2. **User tạo giao dịch "Chi"** → DB lưu "Thu"
3. **User xem giao dịch** → Type đã đảo ngược
4. **Admin xem giao dịch** → Type gốc trong DB
5. **Thống kê User** → Tính theo góc nhìn User
6. **Thống kê Admin** → Tính theo góc nhìn Admin

## Security

### **Data Isolation**
- User chỉ xem/sửa giao dịch của mình
- Admin xem tất cả giao dịch
- Middleware kiểm tra quyền truy cập

### **Input Validation**
- Tất cả input được validate
- SQL injection protection
- XSS protection

### **Role-based Access**
- User: Create, Read (own data)
- Admin: Create, Read, Update, Delete (all data)

## Performance

### **Database Optimization**
- Indexes on userId, transactionDate
- Pagination for large datasets
- Populate only necessary fields

### **Query Optimization**
- Efficient filtering
- Proper sorting
- Limited data transfer

## Migration Notes

### **Breaking Changes**
- Category enum updated
- Default status changed to 'completed'
- Description now required

### **Backward Compatibility**
- Existing data remains valid
- New fields are optional
- Old categories still supported

## Future Enhancements

### **Possible Improvements**
- Bulk operations
- Export functionality
- Real-time notifications
- Advanced reporting
- Multi-currency support

### **Performance**
- Caching layer
- Database sharding
- API rate limiting
- Background processing

## Conclusion

Transaction logic đã được làm lại hoàn toàn với:
- ✅ **Logic rõ ràng**: Admin perspective trong DB, User perspective trong API
- ✅ **Validation đầy đủ**: Tất cả input được kiểm tra
- ✅ **Security tốt**: Role-based access, data isolation
- ✅ **Performance tối ưu**: Pagination, efficient queries
- ✅ **Testing đầy đủ**: Test script và test cases
- ✅ **Documentation chi tiết**: Hướng dẫn sử dụng và logic
