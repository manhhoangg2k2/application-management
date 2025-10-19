import React from 'react';
import { useNavigate } from 'react-router-dom';
// Đã sửa đường dẫn import AuthContext, giả định cấu trúc thư mục là components/ => ../../context
import { useAuth } from '../context/AuthContext'; 

// ICON MAP consistent with previous fixes
const ICON_MAP = {
    dashboard: '📊',
    app: '📱',
    tx: '💰',
    chplay: '▶️',
    users: '👥',
};

// Sidebar sử dụng React Router navigation
const Sidebar = ({ currentPage }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin';

    const menuItems = [
        // Quản lý Ứng dụng (Applications) - Trang chủ Admin (Đổi tên thành Ứng dụng)
        { name: 'Quản lý Ứng dụng', page: 'Applications', path: '/admin/applications', icon: ICON_MAP.app, adminOnly: true },
        // Quản lý Giao dịch
        { name: 'Quản lý Giao dịch', page: 'Transactions', path: '/admin/transactions', icon: ICON_MAP.tx, adminOnly: true },
        // Tài khoản CHPlay
        { name: 'Tài khoản CHPlay', page: 'ChplayAccounts', path: '/admin/chplay-accounts', icon: ICON_MAP.chplay, adminOnly: true },
        // Quản lý Người dùng
        { name: 'Quản lý Người dùng', page: 'UserManagement', path: '/admin/user-management', icon: ICON_MAP.users, adminOnly: true },
    ];
    
    // Menu cho Client
    const clientMenuItems = [
        { name: 'Tổng quan Khách hàng', page: 'Dashboard', path: '/user/dashboard', icon: ICON_MAP.dashboard, adminOnly: false },
    ];

    const finalMenuItems = isAdmin ? menuItems : clientMenuItems;

    // Hàm xử lý navigation
    const handleNavigation = (item) => {
        navigate(item.path);
    };

    return (
        // Sidebar CỐ ĐỊNH, Shadow mềm, chiều rộng 64 (256px), responsive
        <aside className="w-64 bg-white shadow-2xl shadow-gray-200/50 fixed inset-y-0 left-0 flex flex-col z-20 hidden lg:flex md:flex" >
            
            {/* Header/Branding */}
            <div className="p-6 border-b border-indigo-100/50">
                <p className="text-2xl font-extrabold text-indigo-700">
                    {isAdmin ? 'ADMIN PANEL' : 'CLIENT HUB'}
                </p>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-gray-100">
                <p className="text-lg font-semibold text-gray-800">{user?.name || user?.username}</p>
                <p className="text-sm text-indigo-500 font-medium">{isAdmin ? 'Quản Trị Viên' : 'Khách Hàng'}</p>
            </div>


            {/* Menu chính */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {finalMenuItems.map((item) => {
                    // This check ensures only allowed items are rendered
                    if (item.adminOnly && !isAdmin) return null; 
                    
                    return (
                        <button
                            key={item.name}
                            onClick={() => handleNavigation(item)}
                            // Sử dụng button thay vì a để tránh refresh trang
                            className={`flex items-center w-full p-3 rounded-lg transition duration-150 transform hover:scale-[1.02] ${
                                currentPage === item.page
                                    ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/50' 
                                    : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-800'
                            }`}
                        >
                            <span className="w-5 mr-4 text-xl">{item.icon}</span>
                            <span className="text-base">{item.name}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Footer Sidebar (Đăng xuất) */}
            <div className="p-4 border-t border-gray-100">
                 <button 
                    onClick={logout}
                    className="w-full py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition shadow-md"
                >
                    Đăng Xuất
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
