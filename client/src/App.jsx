import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Sửa đường dẫn cho đúng cấu trúc thư mục
import AuthProvider, { useAuth } from '../context/AuthContext'; 
import AuthScreen from '../pages/authScreen'; 
import AdminRouter from '../pages/AdminRouter'; 
import UserRouter from '../pages/UserRouter';
import LoadingSpinner from '../components/Loading'; 
import './index.css'; 
import { Toaster } from 'react-hot-toast';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Đã xảy ra lỗi!</h1>
            <p className="text-gray-700 mb-4">Ứng dụng gặp sự cố không mong muốn.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 


// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Đang tải phiên làm việc..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100">
        <div className="text-red-800 text-xl font-medium">Bạn không có quyền truy cập trang này.</div>
      </div>
    );
  }

  return children;
};

// --- Component Routing Chính (Sử dụng React Router) ---
const AppRouter = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Debug logs
  console.log('AppRouter render - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user);

  // Hiển thị màn hình Loading trong khi kiểm tra Local Storage
  if (isLoading) {
    console.log('Showing loading spinner');
    return <LoadingSpinner message="Đang tải phiên làm việc..." />;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <AuthScreen /> : <Navigate to={user?.role === 'admin' ? '/admin' : '/user'} replace />} 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminRouter />
            </ProtectedRoute>
          } 
        />
        
        {/* User Routes */}
        <Route 
          path="/user/*" 
          element={
            <ProtectedRoute requiredRole="user">
              <UserRouter />
            </ProtectedRoute>
          } 
        />
        
        {/* Default redirect */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to={user?.role === 'admin' ? '/admin' : '/user'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* Catch all route */}
        <Route 
          path="*" 
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">404 - Trang không tìm thấy</h1>
                <p className="text-gray-600 mb-4">Trang bạn đang tìm kiếm không tồn tại.</p>
                <button 
                  onClick={() => window.history.back()} 
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Quay lại
                </button>
              </div>
            </div>
          } 
        />
      </Routes>
    </Router>
  );
};


// --- Component Gốc (Bọc ứng dụng bằng Provider) ---
function App() {
  console.log('App component is rendering...');
  
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
