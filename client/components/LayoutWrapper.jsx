import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './SideBar';
import MobileMenuButton from './MobileMenuButton';

const LayoutWrapper = ({ children }) => {
    const location = useLocation();
    
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

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            {/* Mobile Menu Button */}
            <MobileMenuButton />
            
            {/* Sidebar với currentPage từ URL */}
            <Sidebar currentPage={currentPage} />
            
            {/* Vùng nội dung chính - thêm margin-left để tránh bị sidebar che, responsive */}
            <div className="flex-1 lg:ml-64 md:ml-64 sm:ml-0">
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default LayoutWrapper;
