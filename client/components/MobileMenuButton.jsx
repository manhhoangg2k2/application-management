import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MobileMenuButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === 'admin';

    const menuItems = [
        { name: 'Quản lý Ứng dụng', page: 'Applications', path: '/admin/applications', icon: '📱', adminOnly: true },
        { name: 'Quản lý Giao dịch', page: 'Transactions', path: '/admin/transactions', icon: '💰', adminOnly: true },
        { name: 'Tài khoản CHPlay', page: 'ChplayAccounts', path: '/admin/chplay-accounts', icon: '▶️', adminOnly: true },
        { name: 'Quản lý Người dùng', page: 'UserManagement', path: '/admin/user-management', icon: '👥', adminOnly: true },
    ];

    const clientMenuItems = [
        { name: 'Tổng quan Khách hàng', page: 'Dashboard', path: '/user/dashboard', icon: '📊', adminOnly: false },
    ];

    const finalMenuItems = isAdmin ? menuItems : clientMenuItems;

    const handleNavigation = (item) => {
        navigate(item.path);
        setIsOpen(false);
    };

    return (
        <>
            {/* Mobile Menu Button - chỉ hiển thị trên mobile */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden md:hidden fixed top-4 left-4 z-30 bg-indigo-600 text-white p-2 rounded-lg shadow-lg"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="lg:hidden md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}>
                    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-6 border-b border-indigo-100/50">
                            <div className="flex items-center justify-between">
                                <p className="text-2xl font-extrabold text-indigo-700">
                                    {isAdmin ? 'ADMIN PANEL' : 'CLIENT HUB'}
                                </p>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="p-4 border-b border-gray-100">
                            <p className="text-lg font-semibold text-gray-800">{user?.name || user?.username}</p>
                            <p className="text-sm text-indigo-500 font-medium">{isAdmin ? 'Quản Trị Viên' : 'Khách Hàng'}</p>
                        </div>

                        {/* Menu */}
                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                            {finalMenuItems.map((item) => {
                                if (item.adminOnly && !isAdmin) return null;
                                
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => handleNavigation(item)}
                                        className="flex items-center w-full p-3 rounded-lg transition duration-150 text-gray-700 hover:bg-indigo-50 hover:text-indigo-800"
                                    >
                                        <span className="w-5 mr-4 text-xl">{item.icon}</span>
                                        <span className="text-base">{item.name}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Logout */}
                        <div className="p-4 border-t border-gray-100">
                            <button 
                                onClick={() => {
                                    logout();
                                    setIsOpen(false);
                                }}
                                className="w-full py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition shadow-md"
                            >
                                Đăng Xuất
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MobileMenuButton;
