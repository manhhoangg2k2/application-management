// client/src/App.jsx (Cập nhật sử dụng LoadingSpinner)
import React from 'react';
import AuthProvider, { useAuth } from '../context/AuthContext'; 
import AuthScreen from '../pages/authScreen'; 
import AdminDashboard from '../pages/AdminDashboard';
import UserDashboard from '../pages/UserDashboard';
import LoadingSpinner from '../components/Loading'; // <<<< IMPORT MỚI >>>>
import './index.css'; 
import { Toaster } from 'react-hot-toast'; 


// --- Component Routing Chính (Sử dụng Context) ---
const AppRouter = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Hiển thị màn hình Loading trong khi kiểm tra Local Storage
  if (isLoading) {
    return <LoadingSpinner message="Đang tải phiên làm việc..." />;
  }

  // Nếu đã đăng nhập, hiển thị Dashboard dựa trên vai trò
  if (isAuthenticated) {
    if (user?.role === 'admin') {
      return <AdminDashboard />;
    }
    if (user?.role === 'user') {
      return <UserDashboard />;
    }
    
    // Trường hợp vai trò không xác định
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100">
        <div className="text-red-800 text-xl font-medium">Lỗi: Vai trò người dùng không hợp lệ.</div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, hiển thị màn hình Auth
  return (
    <AuthScreen /> 
  );
};


// --- Component Gốc (Bọc ứng dụng bằng Provider) ---
function App() {
  return (
    <AuthProvider>
      <AppRouter />
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          success: { duration: 3000 }, 
          error: { duration: 5000 },
        }}
      />
    </AuthProvider>
  );
}

export default App;