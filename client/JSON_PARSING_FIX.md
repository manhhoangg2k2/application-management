# JSON Parsing Error Fix

## Vấn đề
Lỗi `SyntaxError: Unexpected token '"', ""{\"type\""... is not valid JSON` xảy ra khi tạo giao dịch.

## Nguyên nhân
Trong `useApi` hook, có **double JSON.stringify**:

1. **Client code**: `JSON.stringify({...formData, amount: parseFloat(formData.amount)})`
2. **useApi hook**: `JSON.stringify(options.body)` (dòng 35)

Kết quả: JSON bị stringify 2 lần → JSON không hợp lệ

## Cách sửa

### 1. **Sửa useApi hook** (`client/hooks/useApi.js`)

#### **Trước (Lỗi)**
```javascript
const config = {
    ...options,
    headers,
    // Đảm bảo không gửi body nếu là GET
    body: options.body ? JSON.stringify(options.body) : undefined,
};
```

#### **Sau (Đã sửa)**
```javascript
const config = {
    ...options,
    headers,
    // Không stringify body ở đây vì có thể đã được stringify rồi
    body: options.body,
};
```

### 2. **Cập nhật retry logic**
```javascript
const retryConfig = {
    ...config,
    headers: {
        ...config.headers,
        'Authorization': `Bearer ${accessToken}`,
    },
    body: config.body // Giữ nguyên body đã stringify
};
```

## Cách hoạt động

### **Client Code**
```javascript
// UserTransactions.jsx
const result = await authFetch('users/transactions', {
    method: 'POST',
    body: JSON.stringify({  // ← Stringify lần 1
        ...formData,
        amount: parseFloat(formData.amount)
    })
});
```

### **useApi Hook**
```javascript
// useApi.js
const config = {
    ...options,
    headers,
    body: options.body,  // ← Không stringify nữa
};
```

### **Kết quả**
- JSON được stringify 1 lần duy nhất
- Server nhận được JSON hợp lệ
- API hoạt động bình thường

## Test

### **Test Script**
```bash
node test_transaction_api.js
```

### **Test Cases**
1. ✅ Tạo giao dịch với dữ liệu hợp lệ
2. ✅ Lấy danh sách giao dịch
3. ✅ Lấy thống kê giao dịch
4. ✅ Validation với amount = 0
5. ✅ Validation với description rỗng

## Các file bị ảnh hưởng

### **Đã sửa**
- ✅ `client/hooks/useApi.js` - Loại bỏ double stringify

### **Không cần sửa**
- ✅ `client/pages/UserTransactions.jsx` - Đã sử dụng JSON.stringify đúng
- ✅ `client/context/AuthContext.jsx` - Đã sử dụng JSON.stringify đúng
- ✅ `client/pages/authScreen.jsx` - Đã sử dụng JSON.stringify đúng

## Lưu ý

### **Best Practice**
- **Client**: Luôn stringify body trước khi gửi
- **Hook**: Không stringify body, chỉ pass through
- **Server**: Nhận JSON và parse bình thường

### **Error Handling**
- Server trả về lỗi 400 với message rõ ràng
- Client hiển thị toast error
- Console log chi tiết để debug

## Kết quả

Sau khi sửa:
- ✅ Tạo giao dịch hoạt động bình thường
- ✅ Không còn JSON parsing error
- ✅ Validation hoạt động đúng
- ✅ API response đúng format
- ✅ Error handling tốt hơn

## Prevention

### **Code Review Checklist**
- [ ] Kiểm tra double JSON.stringify
- [ ] Test API với dữ liệu thực
- [ ] Verify error handling
- [ ] Check Content-Type headers

### **Testing**
- [ ] Unit tests cho useApi hook
- [ ] Integration tests cho API endpoints
- [ ] E2E tests cho user flows
- [ ] Error scenario testing
