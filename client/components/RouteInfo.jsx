import React from 'react';
import { useAuth } from '../context/AuthContext';

const RouteInfo = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const adminRoutes = [
        { path: '/admin/applications', name: 'Quản lý Ứng dụng', description: 'Quản lý các ứng dụng trong hệ thống' },
        { path: '/admin/transactions', name: 'Quản lý Giao dịch', description: 'Theo dõi và quản lý các giao dịch' },
        { path: '/admin/chplay-accounts', name: 'Tài khoản CHPlay', description: 'Quản lý tài khoản Google Play' },
        { path: '/admin/user-management', name: 'Quản lý Người dùng', description: 'Quản lý người dùng và phân quyền' }
    ];

    const userRoutes = [
        { path: '/user/dashboard', name: 'Tổng quan', description: 'Dashboard tổng quan cho người dùng' }
    ];

    const routes = isAdmin ? adminRoutes : userRoutes;

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
                🗺️ Các Route có sẵn ({isAdmin ? 'Admin' : 'User'})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routes.map((route, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-semibold text-indigo-600 mb-2">{route.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{route.description}</p>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-800">
                            {route.path}
                        </code>
                    </div>
                ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                    💡 <strong>Lưu ý:</strong> Bạn có thể truy cập trực tiếp các URL trên hoặc sử dụng sidebar để điều hướng.
                </p>
            </div>
        </div>
    );
};

export default RouteInfo;
