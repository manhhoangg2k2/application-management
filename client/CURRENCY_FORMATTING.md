# Currency Formatting Standardization

## Tổng quan
Đã chuẩn hóa tất cả các hàm format currency trong toàn bộ ứng dụng để đảm bảo tính nhất quán và dễ bảo trì.

## Vấn đề trước đây
- Mỗi file có định nghĩa `formatCurrency` riêng với logic khác nhau
- Một số file có `minimumFractionDigits: 0`, một số không có
- Một số file xử lý `null/undefined` khác nhau
- Code bị duplicate và khó bảo trì

## Giải pháp
Tạo utility function chung tại `client/utils/currency.js` với các hàm:

### 1. `formatCurrency(amount)`
- Format số tiền thành chuỗi VND với ký hiệu ₫
- Xử lý `null`, `undefined`, `NaN` → trả về "0 ₫"
- Sử dụng `minimumFractionDigits: 0` để không hiển thị phần thập phân
- Locale: 'vi-VN'

**Ví dụ:**
```javascript
formatCurrency(1000000) // "1.000.000 ₫"
formatCurrency(0) // "0 ₫"
formatCurrency(null) // "0 ₫"
formatCurrency(undefined) // "0 ₫"
```

### 2. `parseCurrency(formattedValue)`
- Parse chuỗi tiền tệ thành số
- Loại bỏ ký hiệu ₫, dấu phẩy, dấu chấm
- Trả về 0 nếu không parse được

**Ví dụ:**
```javascript
parseCurrency("1.000.000 ₫") // 1000000
parseCurrency("500,000") // 500000
parseCurrency("abc") // 0
```

### 3. `formatNumber(amount)`
- Format số với dấu phẩy ngăn cách hàng nghìn (không có ký hiệu ₫)
- Dùng cho input fields
- Xử lý `null`, `undefined`, `NaN` → trả về "0"

**Ví dụ:**
```javascript
formatNumber(1000000) // "1.000.000"
formatNumber(0) // "0"
formatNumber(null) // "0"
```

## Files đã cập nhật

### 1. Utility File
- ✅ `client/utils/currency.js` - File utility mới

### 2. User Pages
- ✅ `client/pages/UserApplications.jsx`
- ✅ `client/pages/UserTransactions.jsx`
- ✅ `client/pages/UserDashboard.jsx`

### 3. Admin Pages
- ✅ `client/pages/AdminDashboard.jsx`
- ✅ `client/pages/TransactionDashboard.jsx`
- ✅ `client/pages/UserManagement.jsx`
- ✅ `client/pages/ChplayAccountDashboard.jsx`

### 4. Modal Components
- ✅ `client/pages/CreateAppModal.jsx`
- ✅ `client/pages/EditAppModal.jsx`

## Cách sử dụng

### Import
```javascript
import { formatCurrency, parseCurrency, formatNumber } from '../utils/currency';
```

### Hiển thị tiền tệ
```javascript
// Hiển thị trong UI
<span>{formatCurrency(amount)}</span>

// Trong thống kê
<StatCard value={formatCurrency(totalAmount)} />
```

### Input fields
```javascript
// Trong form input
<input 
    value={formatNumber(value)}
    onChange={handleInputChange}
/>

// Parse khi submit
const numericValue = parseCurrency(inputValue);
```

## Lợi ích

### 1. Tính nhất quán
- Tất cả tiền tệ hiển thị theo cùng format
- Xử lý edge cases (null, undefined) giống nhau
- Locale và currency symbol thống nhất

### 2. Dễ bảo trì
- Chỉ cần sửa 1 file khi cần thay đổi format
- Không cần tìm và sửa nhiều nơi
- Code DRY (Don't Repeat Yourself)

### 3. Tái sử dụng
- Có thể dùng cho các component mới
- Có thể mở rộng thêm functions khác
- Type-safe với JSDoc comments

### 4. Performance
- Không tạo function mới mỗi lần render
- Import một lần, dùng nhiều nơi
- Optimized cho các trường hợp edge

## Testing
- ✅ Tất cả files compile không lỗi
- ✅ Linter không báo lỗi
- ✅ Import/export hoạt động đúng
- ✅ Format hiển thị nhất quán

## Tương lai
- Có thể thêm support cho các currency khác
- Có thể thêm validation cho input
- Có thể thêm formatting options (decimal places, etc.)
- Có thể thêm unit tests cho utility functions
