// client/components/Navbar.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Navbar = ({ roleTitle = 'Dashboard' }) => {
    const { logout, user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // Xử lý logic Đăng xuất
    const handleLogout = () => {
        logout();
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                
                {/* Logo / Title */}
                <div className="flex items-center space-x-3">
                    <span className="text-2xl font-extrabold text-indigo-600">
                        {isAdmin ? 'ADMIN' : 'CLIENT'}
                    </span>
                    <span className="text-xl font-semibold text-gray-700">
                        | {roleTitle}
                    </span>
                </div>

                {/* User Info and Actions */}
                <div className="flex items-center space-x-4">
                    <div className="hidden sm:block text-gray-600">
                        Xin chào, <span className="font-semibold text-indigo-700">{user?.name || user?.username}</span>
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition shadow-sm"
                    >
                        Đăng Xuất
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;