import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LayoutWithNavbar from '../components/LayoutWithNavbar';
import LoadingSpinner from '../components/Loading';
import { useAuth } from '../context/AuthContext';

// Import các trang cho user
import UserDashboard from './UserDashboard';

// UserRouter sử dụng React Router để quản lý routing cho user
const UserRouter = () => {
    const { user } = useAuth();
    const location = useLocation();
    
    // Nếu user không phải user, không nên render router này (chỉ là lớp bảo vệ)
    if (user?.role !== 'user') {
        return <LoadingSpinner message="Đang xác thực quyền truy cập..." />;
    }

    // Lấy currentPage từ URL path
    const getCurrentPageFromPath = () => {
        const path = location.pathname;
        if (path.includes('/dashboard')) return 'Dashboard';
        return 'Dashboard'; // default
    };

    const currentPage = getCurrentPageFromPath();

    return (
        <LayoutWithNavbar>
            <Routes>
                <Route path="/" element={<Navigate to="/user/dashboard" replace />} />
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="*" element={
                    <div className="text-center p-12 bg-white rounded-xl shadow-lg">
                        <h1 className="text-2xl font-bold text-red-600 mb-2">404 - Không tìm thấy trang</h1>
                        <p className="text-gray-700">Trang không tồn tại.</p>
                    </div>
                } />
            </Routes>
        </LayoutWithNavbar>
    );
};

export default UserRouter;
