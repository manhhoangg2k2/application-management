# 🗺️ Hướng dẫn Routing System

## Tổng quan
Hệ thống routing đã được cập nhật để sử dụng React Router DOM với URL routing thay vì state-based navigation.

## 📋 Cấu trúc Routes

### 🔐 Public Routes
- `/login` - Trang đăng nhập

### 👨‍💼 Admin Routes
- `/admin` - Trang chủ admin (hiển thị danh sách routes)
- `/admin/applications` - Quản lý Ứng dụng
- `/admin/transactions` - Quản lý Giao dịch  
- `/admin/chplay-accounts` - Tài khoản CHPlay
- `/admin/user-management` - Quản lý Người dùng

### 👤 User Routes
- `/user` - Trang chủ user (hiển thị danh sách routes)
- `/user/dashboard` - Dashboard người dùng

### 🔄 Default Redirects
- `/` → Redirect dựa trên role (admin → `/admin`, user → `/user`, chưa đăng nhập → `/login`)

## 🛡️ Bảo mật

### Protected Routes
- Tất cả routes admin và user đều được bảo vệ bởi `ProtectedRoute` component
- Kiểm tra authentication và authorization
- Redirect về `/login` nếu chưa đăng nhập
- Hiển thị lỗi nếu không có quyền truy cập

### Role-based Access
- Admin: Có thể truy cập tất cả routes admin
- User: Chỉ có thể truy cập routes user
- Tự động redirect dựa trên role sau khi đăng nhập

## 🧭 Navigation

### Sidebar Navigation
- Sidebar hiển thị menu dựa trên role
- Click vào menu item sẽ navigate đến route tương ứng
- Highlight menu item hiện tại dựa trên URL

### Breadcrumb Navigation
- Hiển thị đường dẫn hiện tại
- Click vào breadcrumb để quay lại trang trước
- Tự động cập nhật khi chuyển trang

## 🔧 Cách sử dụng

### 1. Truy cập trực tiếp URL
```
http://localhost:3000/admin/applications
http://localhost:3000/user/dashboard
```

### 2. Sử dụng Sidebar
- Click vào các menu item trong sidebar
- Menu sẽ tự động highlight trang hiện tại

### 3. Sử dụng Breadcrumb
- Click vào các phần trong breadcrumb để điều hướng
- Ví dụ: Trang chủ / Quản trị / Quản lý Ứng dụng

## 📁 Cấu trúc Files

```
client/
├── src/
│   └── App.jsx                 # Main routing configuration
├── pages/
│   ├── AdminRouter.jsx         # Admin routes
│   ├── UserRouter.jsx          # User routes
│   └── authScreen.jsx          # Login page
└── components/
    ├── SideBar.jsx             # Navigation sidebar
    ├── Breadcrumb.jsx          # Breadcrumb navigation
    └── RouteInfo.jsx           # Route information display
```

## 🚀 Tính năng mới

### 1. URL-based Navigation
- URL thay đổi khi chuyển trang
- Có thể bookmark và share URL
- Browser back/forward buttons hoạt động

### 2. Route Information
- Trang chủ hiển thị danh sách routes có sẵn
- Mô tả chi tiết cho từng route
- Hướng dẫn sử dụng

### 3. Error Handling
- 404 page cho routes không tồn tại
- Error boundary để bắt lỗi JavaScript
- Loading states cho authentication

## 🔄 Migration từ State-based

### Trước (State-based)
```jsx
const [currentPage, setCurrentPage] = useState('Applications');
// Navigation bằng setCurrentPage
```

### Sau (URL-based)
```jsx
const navigate = useNavigate();
// Navigation bằng navigate('/admin/applications')
```

## 🎯 Lợi ích

1. **SEO Friendly**: URL có ý nghĩa
2. **User Experience**: Browser navigation hoạt động
3. **Bookmarkable**: Có thể bookmark các trang
4. **Shareable**: Có thể share URL
5. **Debugging**: Dễ debug với URL rõ ràng
6. **Analytics**: Có thể track page views

## 🐛 Troubleshooting

### Lỗi thường gặp
1. **Màn hình trắng**: Kiểm tra console errors
2. **404 errors**: Đảm bảo route được định nghĩa đúng
3. **Permission denied**: Kiểm tra role và authentication
4. **Navigation không hoạt động**: Kiểm tra useNavigate hook

### Debug Tips
1. Mở Developer Tools → Console
2. Kiểm tra Network tab cho API calls
3. Sử dụng React DevTools để debug state
4. Kiểm tra URL trong address bar
