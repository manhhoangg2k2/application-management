import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
// Sửa đường dẫn Components: từ client/pages/ => client/components/ cần 2 cấp
import LayoutWithNavbar from '../components/LayoutWithNavbar';
import LoadingSpinner from '../components/Loading';

// Sửa đường dẫn Context: từ client/pages/ => client/context/ cần 2 cấp
import { useAuth } from '../context/AuthContext';

// Các Dashboards nằm cùng cấp trong thư mục 'pages' (đường dẫn hiện tại là đúng)
import AdminDashboard from './AdminDashboard'; // Quản lý Ứng dụng
import TransactionDashboard from './TransactionDashboard';
import ChplayAccountDashboard from './ChplayAccountDashboard';
import UserManagement from './UserManagement';


// AdminRouter sử dụng React Router để quản lý routing
const AdminRouter = () => {
    const { user } = useAuth();
    const location = useLocation();
    
    // Nếu user không phải admin, không nên render router này (chỉ là lớp bảo vệ)
    if (user?.role !== 'admin') {
        return <LoadingSpinner message="Đang xác thực quyền truy cập..." />;
    }

    // Lấy currentPage từ URL path
    const getCurrentPageFromPath = () => {
        const path = location.pathname;
        if (path.includes('/applications')) return 'Applications';
        if (path.includes('/transactions')) return 'Transactions';
        if (path.includes('/chplay-accounts')) return 'ChplayAccounts';
        if (path.includes('/user-management')) return 'UserManagement';
        return 'Applications'; // default
    };

    const currentPage = getCurrentPageFromPath();

    return (
        <LayoutWithNavbar>
            <Routes>
                <Route path="/" element={<Navigate to="/admin/applications" replace />} />
                <Route path="/applications" element={<AdminDashboard />} />
                <Route path="/transactions" element={<TransactionDashboard />} />
                <Route path="/chplay-accounts" element={<ChplayAccountDashboard />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="*" element={
                    <div className="text-center p-12 bg-white rounded-xl shadow-lg">
                        <h1 className="text-2xl font-bold text-red-600 mb-2">404 - Không tìm thấy trang</h1>
                        <p className="text-gray-700">Trang quản lý không tồn tại.</p>
                    </div>
                } />
            </Routes>
        </LayoutWithNavbar>
    );
};

export default AdminRouter;
