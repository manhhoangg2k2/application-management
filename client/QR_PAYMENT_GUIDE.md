# Hướng dẫn sử dụng tính năng Tạo Giao dịch với QR Code

## Tổng quan

Tính năng mới cho phép người dùng tạo giao dịch thanh toán bằng cách quét QR code từ SePay. Người dùng chỉ cần nhập số tiền, hệ thống sẽ tự động tạo QR code và xử lý thanh toán.

## Luồng hoạt động

1. **Người dùng nhập số tiền**: Chỉ cần nhập số tiền muốn thanh toán
2. **Hệ thống tạo QR code**: Gọi API để tạo transaction pending và QR code
3. **Hiển thị QR code**: Người dùng quét QR để chuyển khoản
4. **Xác nhận chuyển khoản**: Người dùng bấm "Đã chuyển khoản" → Trạng thái PENDING
5. **Tự động xác nhận**: SePay webhook sẽ tự động cập nhật trạng thái thành COMPLETED

## Cách sử dụng

### 1. Truy cập trang Giao dịch
- Đăng nhập vào hệ thống với tài khoản User
- Vào trang "Giao dịch" từ menu sidebar
- Nhấn nút "Tạo giao dịch" (nút có icon +)

### 2. Nhập số tiền
- Nhập số tiền muốn thanh toán (tối thiểu 10,000 VND)
- Hệ thống sẽ tự động format số tiền với dấu phẩy
- Validation tự động kiểm tra:
  - Số tiền phải lớn hơn 0
  - Tối thiểu 10,000 VND
  - Tối đa 100,000,000 VND

### 3. Tạo QR Code
- Nhấn nút "Tạo QR Code"
- Hệ thống sẽ gọi API và tạo:
  - Transaction với status "pending"
  - Mã xác thực duy nhất
  - QR code từ SePay

### 4. Thanh toán
- Quét QR code bằng ứng dụng ngân hàng
- Kiểm tra thông tin:
  - Số tiền: Hiển thị chính xác số tiền đã nhập
  - Nội dung: "Thanh toán dịch vụ - [Tên user] - Mã: [Mã xác thực]"
- Xác nhận chuyển khoản

### 5. Xác nhận chuyển khoản
- Sau khi chuyển khoản thành công, nhấn "Đã chuyển khoản"
- Giao dịch sẽ ở trạng thái "PENDING" và hiển thị "Đang chờ xác nhận"
- SePay webhook sẽ tự động cập nhật trạng thái thành "COMPLETED" khi xác thực thành công

## Thông tin QR Code

QR code được tạo từ SePay với các thông tin:
- **Số tài khoản**: 0372782087
- **Ngân hàng**: MB (Military Bank)
- **Số tiền**: Số tiền người dùng nhập
- **Nội dung**: "Thanh toán dịch vụ - [Tên user] - Mã: [Mã xác thực]"

## Tính năng bảo mật

1. **Mã xác thực duy nhất**: Mỗi giao dịch có mã xác thực 8 ký tự
2. **Validation số tiền**: Kiểm tra giới hạn min/max
3. **Format tự động**: Tự động format số tiền với dấu phẩy
4. **Error handling**: Xử lý lỗi và hiển thị thông báo rõ ràng

## UI/UX Features

### Multi-step Modal
- **Step 1**: Nhập số tiền với validation
- **Step 2**: Hiển thị QR code và hướng dẫn
- **Step 3**: Đang chờ xác nhận (PENDING status)

### Responsive Design
- Modal responsive trên mọi thiết bị
- QR code hiển thị rõ ràng trên mobile và desktop
- Layout tối ưu cho việc quét QR

### Loading States
- Loading spinner khi tạo QR code
- Disable buttons khi đang xử lý
- Error states với icon và màu sắc phù hợp

## Error Handling

### Validation Errors
- **Số tiền trống**: "Vui lòng nhập số tiền"
- **Số tiền không hợp lệ**: "Số tiền phải lớn hơn 0"
- **Số tiền quá nhỏ**: "Số tiền tối thiểu là 10,000 VND"
- **Số tiền quá lớn**: "Số tiền tối đa là 100,000,000 VND"

### API Errors
- **Network error**: "Có lỗi xảy ra khi tạo QR code"
- **Server error**: Hiển thị message từ server
- **QR load error**: Fallback UI khi không load được QR

## Testing

### Test Cases
1. **Nhập số tiền hợp lệ**: 50,000 VND
2. **Nhập số tiền không hợp lệ**: 5,000 VND (dưới minimum)
3. **Nhập số tiền quá lớn**: 200,000,000 VND
4. **Nhập text**: "abc" (không phải số)
5. **Để trống**: Không nhập gì
6. **Network error**: Disconnect internet khi tạo QR

### Expected Results
- Validation hoạt động chính xác
- QR code hiển thị đúng thông tin
- Error messages rõ ràng và hữu ích
- UI responsive trên mọi thiết bị

## Troubleshooting

### QR Code không hiển thị
- Kiểm tra kết nối internet
- Refresh trang và thử lại
- Kiểm tra console log để xem lỗi

### Không tạo được giao dịch
- Kiểm tra đăng nhập
- Kiểm tra quyền user
- Liên hệ admin để kiểm tra API

### Thanh toán không được xác nhận
- Kiểm tra nội dung chuyển khoản có đúng mã xác thực
- Kiểm tra số tiền có khớp
- Đợi vài phút để SePay webhook xử lý và cập nhật từ PENDING → COMPLETED
- Kiểm tra danh sách giao dịch để xem trạng thái mới nhất
- Liên hệ admin nếu vẫn không được cập nhật sau 10-15 phút

## Technical Details

### API Endpoints Used
- `POST /api/transactions/create-payment-qr`: Tạo QR code
- `POST /api/transactions/sepay-webhook`: Webhook từ SePay (internal)

### Components
- `CreateTransactionModal`: Modal chính cho tạo giao dịch
- `UserTransactions`: Trang hiển thị danh sách giao dịch

### Dependencies
- React hooks: useState, useEffect
- FontAwesome icons
- React Hot Toast cho notifications
- Tailwind CSS cho styling
