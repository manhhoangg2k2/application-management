import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck, faEye, faSyncAlt, faFilter, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency } from '../utils/currency';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AppDetailModal from '../components/AppDetailModal';

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
    const [chplayCache, setChplayCache] = useState({});
    const chplayCacheRef = useRef(chplayCache);

    // fetchApplications accepts an options object so callers can control when filters are applied.
    const fetchApplications = useCallback(async (opts = {}) => {
        const p = opts.page ?? page;
        const l = opts.limit ?? limit;
        const search = opts.search ?? '';
        const status = opts.status ?? 'all';
        const from = opts.fromDate ?? fromDate;
        const to = opts.toDate ?? toDate;

        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(p));
            params.set('limit', String(l));
            if (search) params.set('search', search);
            if (status && status !== 'all') params.set('status', status);
            if (from) params.set('fromDate', from);
            if (to) params.set('toDate', to);

            const result = await authFetch(`users/applications?${params.toString()}`, { method: 'GET' });
            if (result && result.success) {
                setApplications(result.data || []);
                setTotal(result.count || 0);
                setTotalPages(Math.ceil((result.count || 0) / l));
                // Preload chplayAccount details for entries that only include an id
                const idsToFetch = new Set();
                (result.data || []).forEach(app => {
                    const acc = app.chplayAccount;
                    const id = acc && (typeof acc === 'string' ? acc : acc._id);
                    const hasName = acc && (typeof acc !== 'string') && acc.name;
                    if (id && !hasName && !chplayCacheRef.current[id]) {
                        idsToFetch.add(id);
                    }
                });
                if (idsToFetch.size > 0) {
                    // fetch in parallel
                    Promise.all(Array.from(idsToFetch).map(id =>
                        authFetch(`chplay-accounts/${id}`, { method: 'GET' })
                            .then(r => r && r.success ? { id, data: r.data } : null)
                            .catch(() => null)
                    )).then(results => {
                        const update = {};
                        results.forEach(item => {
                            if (item && item.data) update[item.id] = item.data;
                        });
                        if (Object.keys(update).length > 0) {
                            setChplayCache(prev => {
                                const next = { ...prev, ...update };
                                chplayCacheRef.current = next;
                                return next;
                            });
                        }
                    });
                }
            }
        } catch (error) {
            toast.error(error.message || 'Không thể tải danh sách ứng dụng.');
        } finally {
            setIsLoading(false);
        }
    }, [authFetch, page, limit, fromDate, toDate]);

    useEffect(() => {
        // Initial load with current page/limit (no search/status applied until user applies filter)
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
        // Reset to first page and fetch with current filters
        fetchApplications({ 
            page: 1, 
            limit,
            search: searchQuery,
            status: statusFilter,
            fromDate,
            toDate
        });
    };


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
                                onClick={() => fetchApplications({ page, limit, search: searchQuery, status: statusFilter, fromDate, toDate })}
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
                            Danh sách ứng dụng (Tổng: {total})
                        </h2>
                    </div>

                    {applications.length === 0 ? (
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
                        <div className="w-full overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="min-w-[200px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tên App
                                        </th>
                                        <th className="min-w-[120px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ngày up
                                        </th>
                                        <th className="min-w-[120px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Trạng thái
                                        </th>
                                        <th className="min-w-[150px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            IAP IDs
                                        </th>
                                        <th className="min-w-[100px] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Dev
                                        </th>
                                        <th className="min-w-[120px] px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {applications.map((app) => {
                                        const acc = app.chplayAccount;
                                        const chplayId = acc && (typeof acc === 'string' ? acc : acc._id);
                                        const chplayData = chplayId ? chplayCache[chplayId] : (typeof acc === 'object' ? acc : null);
                                        return (
                                            <tr key={app._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{app.name}</div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{app.dateUploaded ? new Date(app.dateUploaded).toLocaleDateString('vi-VN') : (app.createdAt ? new Date(app.createdAt).toLocaleDateString('vi-VN') : 'N/A')}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <StatusBadge status={app.status} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <IapIdsDisplay iapIds={app.iapIds} />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <AccountTooltip account={chplayData || (chplayId ? { _id: chplayId } : null)}>
                                                        <span className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                                            {chplayData?.name || chplayData?._id || chplayId || 'N/A'}
                                                        </span>
                                                    </AccountTooltip>
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
                                        );
                                    })}
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
                <AppDetailModal app={selectedApp} isOpen={showDetailModal} onClose={closeDetailModal} />
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
    const label = status ? status.replace(/_/g, ' ').toUpperCase() : 'N/A';
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status] || statusStyles.default}`}>
            {label}
        </span>
    );
};

// Tooltip component for CHPlay Account (used in table)
const AccountTooltip = ({ account, children }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
    };

    if (!account) {
        return <span className="text-gray-400">N/A</span>;
    }

    return (
        <div className="relative inline-block">
            <div
                onMouseEnter={(e) => {
                    setMousePosition({ x: e.clientX, y: e.clientY });
                    setShowTooltip(true);
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setShowTooltip(false)}
                className="cursor-pointer"
            >
                {children}
            </div>
            {showTooltip && (
                <div
                    className="fixed z-50 w-64 p-3 bg-blue-900 text-white text-sm rounded-lg shadow-xl pointer-events-none"
                    style={{
                        left: `${mousePosition.x + 10}px`,
                        top: `${mousePosition.y - 10}px`,
                        transform: 'translateY(-100%)'
                    }}
                >
                    <div className="space-y-2">
                        <div>
                            <span className="font-semibold text-blue-300">Tên:</span>
                            <span className="ml-2">{account.name || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="font-semibold text-blue-300">Username:</span>
                            <span className="ml-2 font-mono">{account.username || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="font-semibold text-blue-300">Trạng thái:</span>
                            <span className="ml-2 capitalize">{account.status || 'N/A'}</span>
                        </div>
                        {account.email && (
                            <div>
                                <span className="font-semibold text-blue-300">Email:</span>
                                <span className="ml-2">{account.email}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
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
                        placeholder="Tên app..."
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
                    <DatePicker
                        selected={fromDate ? new Date(fromDate) : null}
                        onChange={(date) => setFromDate(date ? date.toISOString() : null)}
                        dateFormat="dd/MM/yyyy"
                        className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        placeholderText="Chọn ngày bắt đầu"
                        isClearable
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                    <DatePicker
                        selected={toDate ? new Date(toDate) : null}
                        onChange={(date) => setToDate(date ? date.toISOString() : null)}
                        dateFormat="dd/MM/yyyy"
                        className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        placeholderText="Chọn ngày kết thúc"
                        isClearable
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
