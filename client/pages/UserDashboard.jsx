// client/pages/UserDashboard.jsx (Cập nhật để tích hợp Modal)
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi'; 
import toast from 'react-hot-toast';
import CreateAppModal from './CreateAppModal'; // <<<< IMPORT MODAL MỚI >>>>
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';

// Hàm helper định dạng (tái sử dụng)
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Hàm tính toán số liệu tổng hợp (tái sử dụng)
const calculateSummary = (apps) => {
    const totalApp = apps.length;
    let totalCost = 0; 
    let totalRevenue = 0; 
    
    apps.forEach(app => {
        totalRevenue += (app.costDevelopment || 0) + (app.costTesting || 0);
    });

    // Giả định chi phí cố định (Cost) là 15% tổng thu nhập
    totalCost = totalRevenue * 0.15; 

    const balance = totalRevenue - totalCost;
    
    return { totalApp, totalCost, totalRevenue, balance };
};

const UserDashboard = () => {
    const { logout, user } = useAuth();
    const authFetch = useApi();
    
    const [summary, setSummary] = useState(null);
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // >>> TRẠNG THÁI MODAL MỚI <<<
    const [isCreateAppModalOpen, setIsCreateAppModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Lấy danh sách ứng dụng (User Client chỉ thấy của họ)
            const result = await authFetch('applications', { method: 'GET' });

            if (result && result.success) {
                const apps = result.data || [];
                setApplications(apps);
                setSummary(calculateSummary(apps));
            }
        } catch (error) {
            toast.error(error.message || 'Không thể tải dữ liệu ứng dụng.');
        } finally {
            setIsLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // >>> HÀM XỬ LÝ KHI NHẤN NÚT (Sửa) <<<
    const handleCreateApp = () => {
        setIsCreateAppModalOpen(true);
    };

    const handleCreateTransaction = () => {
        // TODO: Chuyển sang form tạo giao dịch
        toast('Mở Form Tạo Giao Dịch Mới...', { icon: '💰' });
    };

    if (isLoading || !summary) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
                <p className="ml-4 text-gray-700">Đang tải dữ liệu của bạn...</p>
            </div>
        );
    }

    const balanceIsPositive = summary.balance >= 0;

    return (
        <div className="min-h-screen bg-indigo-50 flex flex-col p-6 font-inter">
            {/* Header */}
            <header className="bg-white shadow p-4 flex justify-between items-center sticky top-0 z-10 rounded-lg mb-6">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-indigo-700">Client Dashboard</h1>
                    <span className="text-sm text-gray-700 mt-1">Xin chào, <span className="font-semibold">{user?.name}</span></span>
                </div>
                
                {/* KHU VỰC NÚT ACTIONS */}
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={handleCreateTransaction}
                        className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition shadow-md"
                    >
                        Tạo Giao Dịch
                    </button>
                    <button 
                        onClick={handleCreateApp} // Mở Modal
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-md"
                    >
                        Tạo App Mới
                    </button>
                    <button 
                        onClick={logout}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition shadow-md"
                    >
                        Đăng Xuất
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow pt-8">
                <div className="max-w-7xl mx-auto">
                    
                    {/* Hàng 1: Thẻ tóm tắt tài chính (Giữ nguyên) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <SummaryCard title="Tổng số App đang triển khai" value={summary.totalApp} unit="Apps" color="bg-indigo-600"/>
                        <SummaryCard title="Tổng Chi Phí (Ước tính)" value={formatCurrency(summary.totalCost)} unit="VND" color="bg-red-600"/>
                        <SummaryCard title="Tổng Số Tiền Đã Thanh Toán" value={formatCurrency(summary.totalRevenue)} unit="VND" color="bg-green-600"/>
                        <SummaryCard title="Số Dư Dự Kiến" value={formatCurrency(summary.balance)} unit="VND" color={balanceIsPositive ? "bg-teal-600" : "bg-orange-600"} icon={balanceIsPositive ? "▲" : "▼"}/>
                    </div>
                    
                    {/* Hàng 2: Bảng ứng dụng */}
                    <ApplicationTable applications={applications} isAdmin={false} />

                </div>
            </main>

            {/* >>> MODAL TẠO APP <<< */}
            <CreateAppModal 
                isOpen={isCreateAppModalOpen}
                onClose={() => setIsCreateAppModalOpen(false)}
                onAppCreated={() => {
                    fetchData(); // Tải lại danh sách apps sau khi tạo thành công
                    setIsCreateAppModalOpen(false);
                }}
            />
        </div>
    );
};

// --- Tái sử dụng các Components phụ (SummaryCard, ApplicationTable, v.v.) ---

// (Giả định bạn đã copy các component phụ này vào file UserDashboard.jsx)

const SummaryCard = ({ title, value, unit, color, icon }) => (
    <div className={`p-6 rounded-xl shadow-xl text-white ${color}`}>
        <div className="flex justify-between items-center">
            <p className="text-sm font-medium opacity-80">{title}</p>
            {icon && <span className="text-2xl font-bold">{icon}</span>}
        </div>
        <div className="mt-2">
            <p className="text-3xl font-extrabold">{value}</p>
            <p className="text-sm opacity-90">{unit}</p>
        </div>
    </div>
);

const ApplicationTable = ({ applications, isAdmin }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Component hiển thị IAP IDs với khả năng copy
    const IapIdsDisplay = ({ iapIds }) => {
        const [copiedIndex, setCopiedIndex] = useState(null);
        const [showAll, setShowAll] = useState(false);
        
        const copyToClipboard = async (text, index) => {
            try {
                await navigator.clipboard.writeText(text);
                setCopiedIndex(index);
                toast.success('Đã copy IAP ID!');
                setTimeout(() => setCopiedIndex(null), 2000);
            } catch (err) {
                toast.error('Không thể copy!');
            }
        };

        if (!iapIds || iapIds.length === 0) {
            return <span className="text-gray-400 text-sm">Chưa có IAP ID</span>;
        }

        const displayIds = showAll ? iapIds : iapIds.slice(0, 3);
        const hasMore = iapIds.length > 3;

        return (
            <div className="space-y-1">
                {displayIds.map((iapId, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700 truncate max-w-32">
                            {iapId}
                        </span>
                        <button
                            onClick={() => copyToClipboard(iapId, index)}
                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Copy IAP ID"
                        >
                            {copiedIndex === index ? (
                                <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                            ) : (
                                <FontAwesomeIcon icon={faCopy} className="text-xs" />
                            )}
                        </button>
                    </div>
                ))}
                {hasMore && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                        {showAll ? 'Thu gọn' : `+${iapIds.length - 3} IAP khác`}
                    </button>
                )}
            </div>
        );
    };

    const StatusBadge = ({ status }) => {
        const statusStyles = {
            draft: "bg-gray-100 text-gray-800",
            testing: "bg-yellow-100 text-yellow-800", 
            waiting_for_review: "bg-blue-100 text-blue-800",
            approved: "bg-green-100 text-green-800",
            suspended: "bg-red-100 text-red-800",
            finished: "bg-teal-100 text-teal-800",
            default: "bg-gray-100 text-gray-800"
        };
        return (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status] || statusStyles.default}`}>
                {status?.toUpperCase().replace('_', ' ') || 'N/A'}
            </span>
        );
    };

    const TableHeader = ({ children, className = '' }) => (
        <th 
            scope="col" 
            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
        >
            {children}
        </th>
    );
    
    const TableData = ({ children, className = '' }) => (
        <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>
            {children}
        </td>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Danh Sách Ứng Dụng Của Bạn ({applications.length})</h3>
            
            {applications.length === 0 ? (
                <p className="text-gray-500 italic">Hiện tại bạn chưa có ứng dụng nào. Bắt đầu bằng cách tạo mới!</p>
            ) : (
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <TableHeader>Tên App</TableHeader>
                            <TableHeader>App ID</TableHeader>
                            <TableHeader>Trạng thái</TableHeader>
                            <TableHeader>IAP IDs</TableHeader>
                            <TableHeader className="text-right">Chi phí PT</TableHeader>
                            <TableHeader className="text-right">Chi phí TT</TableHeader>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {applications.map((app) => (
                            <tr key={app._id} className="hover:bg-indigo-50 transition">
                                <TableData className="font-semibold text-indigo-700">{app.name}</TableData>
                                <TableData>{app.appId}</TableData>
                                <TableData><StatusBadge status={app.status} /></TableData>
                                <TableData>
                                    <IapIdsDisplay iapIds={app.iapIds} />
                                </TableData>
                                <TableData className="text-right">{formatCurrency(app.costDevelopment)}</TableData>
                                <TableData className="text-right">{formatCurrency(app.costTesting)}</TableData>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default UserDashboard;