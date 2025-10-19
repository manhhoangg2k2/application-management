import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Breadcrumb = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter(x => x);

    const getBreadcrumbName = (path) => {
        const breadcrumbMap = {
            'admin': 'Quản trị',
            'user': 'Người dùng',
            'applications': 'Quản lý Ứng dụng',
            'transactions': 'Quản lý Giao dịch',
            'chplay-accounts': 'Tài khoản CHPlay',
            'user-management': 'Quản lý Người dùng',
            'dashboard': 'Tổng quan'
        };
        return breadcrumbMap[path] || path;
    };

    return (
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
            <Link to="/" className="hover:text-indigo-600">
                Trang chủ
            </Link>
            {pathnames.map((name, index) => {
                const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                
                return (
                    <React.Fragment key={name}>
                        <span className="text-gray-400">/</span>
                        {isLast ? (
                            <span className="text-gray-900 font-medium">
                                {getBreadcrumbName(name)}
                            </span>
                        ) : (
                            <Link to={routeTo} className="hover:text-indigo-600">
                                {getBreadcrumbName(name)}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumb;
