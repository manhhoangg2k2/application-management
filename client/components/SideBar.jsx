// client/components/Sidebar.jsx (SIDEBAR ĐÃ LÀM ĐẸP)
import React from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast'; // Cần import để dùng trong nút logout

const Sidebar = () => {
    const { user, logout } = useAuth();
    const isAdmin = user?.role === 'admin';

    const menuItems = [
        { name: 'Tổng quan', href: '#', icon: 'fas fa-chart-line', current: true },
        { name: 'Quản lý Ứng dụng', href: '#', icon: 'fas fa-mobile-alt', current: false, action: () => toast('Chuyển đến trang Quản lý Ứng dụng') },
        { name: 'Quản lý Giao dịch', href: '#', icon: 'fas fa-exchange-alt', current: false, action: () => toast('Chuyển đến trang Quản lý Giao dịch') },
        { name: 'Tài khoản CHPlay', href: '#', icon: 'fab fa-google-play', adminOnly: true, current: false, action: () => toast('Chuyển đến trang Tài khoản CHPlay') },
        { name: 'Quản lý Người dùng', href: '#', icon: 'fas fa-users', adminOnly: true, current: false, action: () => toast('Chuyển đến trang Quản lý Người dùng') },
    ];

    return (
        // Sidebar CỐ ĐỊNH, Shadow mềm, chiều rộng 64 (256px)
        <aside className="w-64 bg-white shadow-2xl shadow-gray-200/50 fixed inset-y-0 left-0 flex flex-col z-20" >
            
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
                {menuItems.map((item) => {
                    if (item.adminOnly && !isAdmin) return null;
                    
                    return (
                        <a
                            key={item.name}
                            href={item.href}
                            onClick={item.action}
                            className={`flex items-center p-3 rounded-lg transition duration-150 transform hover:scale-[1.02] ${
                                item.current 
                                    ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/50' 
                                    : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-800'
                            }`}
                        >
                            <i className={`${item.icon} w-5 mr-4 text-xl`}></i>
                            <span className="text-base">{item.name}</span>
                        </a>
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