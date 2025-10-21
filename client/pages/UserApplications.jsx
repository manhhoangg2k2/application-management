import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck, faEye, faSyncAlt, faFilter, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency } from '../utils/currency';

const UserApplications = () => {
    const { user } = useAuth();
    const authFetch = useApi();
    
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchApplications = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(limit));
            if (fromDate) params.set('fromDate', fromDate);
            if (toDate) params.set('toDate', toDate);

            const result = await authFetch(`users/applications?${params.toString()}`, { method: 'GET' });
            if (result && result.success) {
                setApplications(result.data || []);
                setTotal(result.count || 0);
                setTotalPages(Math.ceil((result.count || 0) / limit));
            }
        } catch (error) {
            toast.error(error.message || 'Không thể tải danh sách ứng dụng.');
        } finally {
            setIsLoading(false);
        }
    }, [authFetch, page, limit, fromDate, toDate]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const handleViewDetail = (app) => {
        setSelectedApp(app);
        setShowDetailModal(true);
    };

    const closeDetailModal = () => {
        setSelectedApp(null);
        setShowDetailModal(false);
    };

    const handleApplyFilter = () => {
        setPage(1);
        fetchApplications();
    };

    const filteredApplications = applications.filter((app) => 
        `${app.name || ''} ${app.appId || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (statusFilter === 'all' ? true : app.status === statusFilter)
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
                <p className="ml-4 text-gray-700">Đang tải danh sách ứng dụng...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý Ứng dụng</h1>
                            <p className="text-gray-600">Xem và quản lý các ứng dụng của bạn</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={fetchApplications}
                                className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border hover:bg-gray-50 transition shadow-sm"
                            >
                                <FontAwesomeIcon icon={faSyncAlt} className="mr-2" />
                                Làm mới
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <FilterSection
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    fromDate={fromDate}
                    setFromDate={setFromDate}
                    toDate={toDate}
                    setToDate={setToDate}
                    limit={limit}
                    setLimit={setLimit}
                    onApplyFilter={handleApplyFilter}
                />

                {/* Applications List */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Danh sách ứng dụng ({applications.length})
                        </h2>
                    </div>

                    {filteredApplications.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-gray-400 text-6xl mb-4">📱</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {applications.length === 0 ? 'Chưa có ứng dụng nào' : 'Không tìm thấy ứng dụng phù hợp'}
                            </h3>
                            <p className="text-gray-500">
                                {applications.length === 0 ? 'Bạn chưa có ứng dụng nào được tạo.' : 'Hãy thử thay đổi bộ lọc để tìm kiếm.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tên App
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            App ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            IAP IDs
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Chi phí PT
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Chi phí TT
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredApplications.map((app) => (
                                        <tr key={app._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{app.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{app.appId}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={app.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <IapIdsDisplay iapIds={app.iapIds} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                                {formatCurrency(app.costDevelopment)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                                {formatCurrency(app.costTesting)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => handleViewDetail(app)}
                                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                                >
                                                    <FontAwesomeIcon icon={faEye} className="mr-1" />
                                                    Xem chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Pagination 
                        page={page} 
                        totalPages={totalPages} 
                        setPage={setPage} 
                    />
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedApp && (
                <AppDetailModal app={selectedApp} onClose={closeDetailModal} />
            )}
        </div>
    );
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

// Component hiển thị trạng thái
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

// Modal chi tiết ứng dụng
const AppDetailModal = ({ app, onClose }) => {
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Chi tiết ứng dụng</h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tên ứng dụng</label>
                                <p className="mt-1 text-sm text-gray-900">{app.name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">App ID</label>
                                <p className="mt-1 text-sm text-gray-900">{app.appId}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                                <div className="mt-1">
                                    <StatusBadge status={app.status} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ngày tạo</label>
                                <p className="mt-1 text-sm text-gray-900">
                                    {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                            <p className="mt-1 text-sm text-gray-900">{app.description || 'Không có mô tả'}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Chi phí phát triển</label>
                                <p className="mt-1 text-sm text-gray-900">{formatCurrency(app.costDevelopment)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Chi phí testing</label>
                                <p className="mt-1 text-sm text-gray-900">{formatCurrency(app.costTesting)}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">IAP IDs</label>
                            <div className="mt-1">
                                {app.iapIds && app.iapIds.length > 0 ? (
                                    <div className="space-y-2">
                                        {app.iapIds.map((iapId, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                                                    {iapId}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(iapId);
                                                        toast.success('Đã copy IAP ID!');
                                                    }}
                                                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                                                >
                                                    <FontAwesomeIcon icon={faCopy} className="text-xs" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Chưa có IAP ID</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Filter Section Component
const FilterSection = ({ 
    searchQuery, setSearchQuery, 
    statusFilter, setStatusFilter, 
    fromDate, setFromDate, 
    toDate, setToDate, 
    limit, setLimit, 
    onApplyFilter 
}) => {
    return (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tên app, App ID..."
                        className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    >
                        <option value="all">Tất cả</option>
                        <option value="draft">Draft</option>
                        <option value="testing">Testing</option>
                        <option value="waiting_for_review">Chờ duyệt</option>
                        <option value="approved">Đã duyệt</option>
                        <option value="suspended">Tạm dừng</option>
                        <option value="finished">Hoàn thành</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>
                <div className="flex items-end gap-2">
                    <select
                        value={limit}
                        onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                        className="flex-1 py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    >
                        <option value={5}>5 / trang</option>
                        <option value={10}>10 / trang</option>
                        <option value={20}>20 / trang</option>
                        <option value={50}>50 / trang</option>
                    </select>
                    <button 
                        onClick={onApplyFilter} 
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
                        title="Áp dụng bộ lọc"
                    >
                        <FontAwesomeIcon icon={faFilter} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Pagination Component
const Pagination = ({ page, totalPages, setPage }) => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow + 2) {
        for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
        pageNumbers.push(1);
        let start = Math.max(2, page - 2);
        let end = Math.min(totalPages - 1, page + 2);
        if (page > 3) pageNumbers.push('...');
        for (let i = start; i <= end; i++) pageNumbers.push(i);
        if (page < totalPages - 2) pageNumbers.push('...');
        pageNumbers.push(totalPages);
    }
    
    return (
        <div className="flex items-center justify-center gap-1 mt-6">
            <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="px-3 py-2 rounded-lg border bg-white text-sm disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-50"
                title="Trang trước"
            >
                <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            {pageNumbers.map((num, index) => (
                num === '...' ? (
                    <span key={index} className="px-4 py-2 text-sm text-gray-500">...</span>
                ) : (
                    <button 
                        key={index} 
                        onClick={() => setPage(num)} 
                        className={`px-4 py-2 rounded-lg border text-sm ${
                            page === num 
                                ? 'bg-indigo-600 text-white border-indigo-600 font-bold' 
                                : 'bg-white hover:bg-gray-50'
                        }`}
                    >
                        {num}
                    </button>
                )
            ))}
            <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="px-3 py-2 rounded-lg border bg-white text-sm disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-50"
                title="Trang sau"
            >
                <FontAwesomeIcon icon={faChevronRight} />
            </button>
        </div>
    );
};

export default UserApplications;
