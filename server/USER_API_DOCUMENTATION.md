# User API Documentation

## Tổng quan
API endpoints dành riêng cho User (role: 'user') để quản lý ứng dụng và giao dịch của mình.

## Base URL
```
http://localhost:5000/api/users
```

## Authentication
Tất cả endpoints đều yêu cầu authentication token trong header:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. User Profile

#### GET /api/users/profile
Lấy thông tin profile của user hiện tại.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "Tên User",
    "email": "user@example.com",
    "username": "username",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT /api/users/profile
Cập nhật thông tin profile của user.

**Request Body:**
```json
{
  "name": "Tên mới",
  "email": "email@example.com",
  "phone": "0123456789"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "Tên mới",
    "email": "email@example.com",
    "phone": "0123456789",
    "role": "user"
  }
}
```

### 2. User Applications

#### GET /api/users/applications
Lấy danh sách tất cả ứng dụng của user.

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "app_id",
      "name": "Tên App",
      "appId": "com.example.app",
      "status": "approved",
      "description": "Mô tả app",
      "iapIds": ["iap1", "iap2", "iap3", "iap4", "iap5"],
      "costDevelopment": 65000000,
      "costTesting": 8000000,
      "client": "user_id",
      "chplayAccount": {
        "_id": "account_id",
        "email": "account@gmail.com",
        "status": "active"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /api/users/applications/:id
Lấy chi tiết một ứng dụng cụ thể của user.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "app_id",
    "name": "Tên App",
    "appId": "com.example.app",
    "status": "approved",
    "description": "Mô tả app",
    "iapIds": ["iap1", "iap2", "iap3", "iap4", "iap5"],
    "costDevelopment": 65000000,
    "costTesting": 8000000,
    "client": "user_id",
    "chplayAccount": {
      "_id": "account_id",
      "email": "account@gmail.com",
      "status": "active"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. User Transactions

#### GET /api/users/transactions
Lấy danh sách tất cả giao dịch của user.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "transaction_id",
      "type": "revenue", // Đã được đảo ngược cho User
      "category": "user_income",
      "amount": 1000000,
      "description": "Thu nhập từ app",
      "status": "completed",
      "userId": "user_id",
      "applicationId": {
        "_id": "app_id",
        "name": "Tên App",
        "appId": "com.example.app"
      },
      "transactionDate": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/users/transactions
Tạo giao dịch mới.

**Request Body:**
```json
{
  "type": "revenue", // "revenue" hoặc "expense"
  "amount": 1000000,
  "description": "Mô tả giao dịch",
  "applicationId": "app_id" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "transaction_id",
    "type": "expense", // Đã được đảo ngược trong DB
    "category": "user_income",
    "amount": 1000000,
    "description": "Mô tả giao dịch",
    "status": "completed",
    "userId": "user_id",
    "applicationId": {
      "_id": "app_id",
      "name": "Tên App",
      "appId": "com.example.app"
    },
    "transactionDate": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /api/users/transactions/statistics
Lấy thống kê giao dịch của user.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTransactions": 10,
    "totalExpense": 5000000, // Số tiền đã chi
    "totalAppRevenue": 15000000, // Số tiền làm app
    "balance": 10000000 // Số dư (totalAppRevenue - totalExpense)
  }
}
```

## Logic Giao dịch Ngược

### Cách hoạt động:
- **User tạo "revenue"** → Lưu trong DB như "expense" (Admin chi tiền cho User)
- **User tạo "expense"** → Lưu trong DB như "revenue" (User trả tiền cho Admin)

### Hiển thị cho User:
- **API trả về dữ liệu đã được đảo ngược** để User thấy đúng
- **User thu** = Admin chi
- **User chi** = Admin thu

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Không có token xác thực"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Không tìm thấy dữ liệu"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Lỗi máy chủ nội bộ"
}
```

## Middleware

### Authentication
- Tất cả endpoints yêu cầu `protect` middleware
- Token phải hợp lệ và chưa hết hạn

### Authorization
- Tất cả endpoints yêu cầu `authorize('user')` middleware
- Chỉ user với role = 'user' mới có thể truy cập

### Data Validation
- Tất cả input được validate theo schema
- Error messages trả về chi tiết lỗi validation

## Security Features

### 1. Data Isolation
- User chỉ có thể xem/sửa dữ liệu của mình
- Không thể truy cập dữ liệu của user khác

### 2. Input Validation
- Tất cả input được validate
- SQL injection protection
- XSS protection

### 3. Rate Limiting
- Có thể thêm rate limiting cho các endpoints
- Prevent abuse và spam

## Usage Examples

### JavaScript/Fetch
```javascript
// Lấy danh sách ứng dụng
const response = await fetch('/api/users/applications', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// Tạo giao dịch mới
const newTransaction = await fetch('/api/users/transactions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'revenue',
    amount: 1000000,
    description: 'Thu nhập từ app'
  })
});
```

### Axios
```javascript
// Setup axios với token
const api = axios.create({
  baseURL: '/api/users',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Sử dụng
const applications = await api.get('/applications');
const statistics = await api.get('/transactions/statistics');
```
