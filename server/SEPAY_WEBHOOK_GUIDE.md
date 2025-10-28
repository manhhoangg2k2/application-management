# Hướng dẫn sử dụng SePay Webhook Integration

## Tổng quan

Hệ thống đã được tích hợp với SePay để xử lý thanh toán tự động thông qua webhook. Khi người dùng thực hiện chuyển khoản, SePay sẽ gửi thông tin giao dịch về server để cập nhật trạng thái thanh toán.

## Luồng hoạt động

1. **Frontend tạo yêu cầu thanh toán**: Gọi API `/api/transactions/create-payment-qr`
2. **Backend tạo transaction pending**: Tạo giao dịch với trạng thái `pending` và mã xác thực
3. **Tạo QR code**: Trả về thông tin để tạo QR code với nội dung chuyển khoản
4. **Người dùng chuyển khoản**: Quét QR và thực hiện chuyển khoản với nội dung chứa mã xác thực
5. **SePay gửi webhook**: SePay gửi thông tin giao dịch về `/api/transactions/sepay-webhook`
6. **Backend xử lý**: Tìm giao dịch dựa trên mã xác thực và cập nhật trạng thái thành `completed`

## API Endpoints

### 1. Tạo QR thanh toán

**POST** `/api/transactions/create-payment-qr`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
    "amount": 100000,
    "description": "Thanh toán dịch vụ",
    "applicationId": "optional_application_id"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "transaction": {
            "_id": "transaction_id",
            "amount": 100000,
            "status": "pending",
            "verificationCode": "A1B2C3D4"
        },
        "qrData": {
            "amount": 100000,
            "content": "Thanh toán dịch vụ - Mã: A1B2C3D4",
            "verificationCode": "A1B2C3D4",
            "transactionId": "transaction_id"
        },
        "transferContent": "Thanh toán dịch vụ - Mã: A1B2C3D4",
        "verificationCode": "A1B2C3D4"
    }
}
```

### 2. SePay Webhook (Internal)

**POST** `/api/transactions/sepay-webhook`

**Headers:**
```
Authorization: Apikey <sepay_api_key>
Content-Type: application/json
```

**Body (từ SePay):**
```json
{
    "id": 92704,
    "gateway": "Vietcombank",
    "transactionDate": "2023-03-25 14:02:37",
    "accountNumber": "0123499999",
    "code": null,
    "content": "Thanh toán dịch vụ - Mã: A1B2C3D4",
    "transferType": "in",
    "transferAmount": 100000,
    "accumulated": 19077000,
    "subAccount": null,
    "referenceCode": "MBVCB.3278907687",
    "description": ""
}
```

**Response:**
```json
{
    "success": true,
    "message": "Xử lý webhook thành công",
    "transactionId": "transaction_id"
}
```

## Cấu hình Environment Variables

Thêm vào file `.env`:

```env
SEPAY_API_KEY=your_sepay_api_key_here
```

## Cấu trúc Database

### Transaction Model đã được cập nhật với:

- `verificationCode`: Mã xác thực duy nhất để match với SePay webhook
- `sepayData`: Object chứa tất cả thông tin từ SePay webhook
  - `sepayId`: ID giao dịch trên SePay
  - `gateway`: Brand name ngân hàng
  - `bankTransactionDate`: Thời gian giao dịch từ ngân hàng
  - `accountNumber`: Số tài khoản
  - `transferContent`: Nội dung chuyển khoản
  - `transferAmount`: Số tiền từ SePay
  - Và các trường khác...

## Bảo mật

1. **API Key Authentication**: SePay webhook được bảo vệ bằng API key
2. **Verification Code**: Mỗi giao dịch có mã xác thực duy nhất
3. **Amount Validation**: Kiểm tra số tiền có khớp với giao dịch
4. **Status Check**: Chỉ cập nhật giao dịch đang `pending`

## Xử lý lỗi

- **400**: Dữ liệu không hợp lệ hoặc không tìm thấy mã xác thực
- **401**: API key không hợp lệ
- **404**: Không tìm thấy giao dịch tương ứng
- **500**: Lỗi server

## Testing

### Test tạo QR thanh toán:
```bash
curl -X POST http://localhost:5000/api/transactions/create-payment-qr \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100000,
    "description": "Test payment"
  }'
```

### Test SePay webhook:
```bash
curl -X POST http://localhost:5000/api/transactions/sepay-webhook \
  -H "Authorization: Apikey <sepay_api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 12345,
    "gateway": "Vietcombank",
    "transactionDate": "2023-03-25 14:02:37",
    "accountNumber": "0123499999",
    "code": null,
    "content": "Test payment - Mã: A1B2C3D4",
    "transferType": "in",
    "transferAmount": 100000,
    "accumulated": 19077000,
    "subAccount": null,
    "referenceCode": "MBVCB.3278907687",
    "description": ""
  }'
```

## Lưu ý quan trọng

1. **Mã xác thực**: Phải được bao gồm trong nội dung chuyển khoản với format "Mã: XXXXX"
2. **Số tiền**: Cho phép sai lệch tối đa 1000 VND do làm tròn
3. **Trạng thái**: Chỉ cập nhật giao dịch đang `pending`
4. **Logging**: Tất cả webhook calls đều được log để debug
5. **Unique verification code**: Mỗi mã xác thực chỉ được sử dụng một lần
