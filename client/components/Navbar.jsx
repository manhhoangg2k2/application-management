import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isAdmin = user?.role === 'admin';

    const menuItems = [
        { name: 'Quản lý Ứng dụng', page: 'Applications', path: '/admin/applications', adminOnly: true },
        { name: 'Quản lý Giao dịch', page: 'Transactions', path: '/admin/transactions', adminOnly: true },
        { name: 'Tài khoản CHPlay', page: 'ChplayAccounts', path: '/admin/chplay-accounts', adminOnly: true },
        { name: 'Quản lý Người dùng', page: 'UserManagement', path: '/admin/user-management', adminOnly: true },
    ];

    const clientMenuItems = [
        { name: 'Tổng quan Khách hàng', page: 'Dashboard', path: '/user/dashboard', adminOnly: false },
    ];

    const finalMenuItems = isAdmin ? menuItems : clientMenuItems;

    // Lấy currentPage từ URL path
    const getCurrentPageFromPath = () => {
        const path = location.pathname;
        if (path.includes('/applications')) return 'Applications';
        if (path.includes('/transactions')) return 'Transactions';
        if (path.includes('/chplay-accounts')) return 'ChplayAccounts';
        if (path.includes('/user-management')) return 'UserManagement';
        if (path.includes('/dashboard')) return 'Dashboard';
        return 'Applications'; // default
    };

    const currentPage = getCurrentPageFromPath();

    const handleNavigation = (item) => {
        navigate(item.path);
        setIsMobileMenuOpen(false);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg border-b border-gray-200 w-full">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <h1 className="text-xl font-bold text-indigo-700">
                                {isAdmin ? 'ADMIN PANEL' : 'CLIENT HUB'}
                            </h1>
                        </div>
                    </div>

                    {/* Desktop Menu - Horizontal */}
                    <div className="hidden md:flex items-center space-x-1">
                        {finalMenuItems.map((item) => {
                            if (item.adminOnly && !isAdmin) return null;
                            
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => handleNavigation(item)}
                                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                                        currentPage === item.page
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                                    }`}
                                >
                                    {item.name}
                                    {/* Active indicator */}
                                    {currentPage === item.page && (
                                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* User Info & Actions */}
                    <div className="flex items-center space-x-4">
                        {/* User Info */}
                        <div className="hidden sm:block">
                            <div className="text-sm">
                                <p className="font-medium text-gray-800">{user?.name || user?.username}</p>
                                <p className="text-gray-500">{isAdmin ? 'Quản Trị Viên' : 'Khách Hàng'}</p>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={logout}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 hover:shadow-md transition-all duration-200 transform hover:scale-105 active:scale-95"
                        >
                            Đăng Xuất
                        </button>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {finalMenuItems.map((item) => {
                            if (item.adminOnly && !isAdmin) return null;
                            
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => handleNavigation(item)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 ${
                                        currentPage === item.page
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                                    }`}
                                >
                                    {item.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;