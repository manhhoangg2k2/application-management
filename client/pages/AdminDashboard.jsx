// client/pages/AdminDashboard.jsx (UI HOÀN CHỈNH VỚI DATEPICKER & ICONS)
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import toast from 'react-hot-toast';

// --- THƯ VIỆN BÊN THỨ 3 ---
import DatePicker from 'react-datepicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faMobileAlt, faCode, faDollarSign, faArrowTrendUp, faArrowTrendDown,
    faSearch, faFilter, faSyncAlt, faPlus, faChevronLeft, faChevronRight,
    faPencilAlt, faTrashAlt, faBoxOpen, faCopy, faCheck
} from '@fortawesome/free-solid-svg-icons';

// --- COMPONENTS & STYLES ---
import CreateAppModal from './CreateAppModal';
import EditAppModal from './EditAppModal';
import LoadingSpinner from '../components/Loading';
import Sidebar from '../components/SideBar';
import '../src/styles/datepicker.css'; // Import CSS cho Datepicker

// --- HELPER FUNCTIONS (Không đổi) ---
const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', minimumFractionDigits: 0
}).format(amount || 0);

const calculateSummary = (apps) => {
    const totalApp = apps.length;
    let totalCostDevelopment = 0;
    let totalCostTesting = 0;
    let totalCostOther = 0;
    
    apps.forEach(app => {
        totalCostDevelopment += (app.costDevelopment || 0);
        totalCostTesting += (app.costTesting || 0);
        totalCostOther += (app.costOther || 0);
    });
    
    const totalCost = totalCostDevelopment + totalCostTesting + totalCostOther;
    
    // Giả sử thu nhập = tổng chi phí * 1.2 (20% lợi nhuận)
    const totalRevenue = totalCost * 1.2;
    const balance = totalRevenue - totalCost;
    
    return { 
        totalApp, 
        totalCostDevelopment, 
        totalCostTesting, 
        totalCostOther,
        totalCost,
        totalRevenue, 
        balance 
    };
};


// --- COMPONENT UI PHỤ ---

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 flex items-center gap-5">
        <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full ${color.bg}`}>
            <FontAwesomeIcon icon={icon} className={`text-xl ${color.text}`} />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
        </div>
    </div>
);

const DashboardToolbar = ({ searchQuery, setSearchQuery, statusFilter, setStatusFilter, fromDate, setFromDate, toDate, setToDate, limit, setLimit, onApplyFilter }) => {
    const startDate = fromDate ? new Date(fromDate) : null;
    const endDate = toDate ? new Date(toDate) : null;

    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm theo tên hoặc App ID..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="draft">Nháp</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="testing">Đang test</option>
                    <option value="live">Đang chạy</option>
                </select>
                <div className="flex items-center gap-2">
                    <DatePicker
                        selected={startDate}
                        onChange={(date) => setFromDate(date ? date.toISOString().split('T')[0] : '')}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        dateFormat="dd/MM/yyyy"
                        isClearable
                        placeholderText="Từ ngày"
                        className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                    <span className="text-gray-400">-</span>
                    <DatePicker
                        selected={endDate}
                        onChange={(date) => setToDate(date ? date.toISOString().split('T')[0] : '')}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        dateFormat="dd/MM/yyyy"
                        isClearable
                        placeholderText="Đến ngày"
                        className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={limit}
                        onChange={(e) => { setLimit(parseInt(e.target.value, 10)); }}
                        className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    >
                        <option value={5}>5 / trang</option>
                        <option value={10}>10 / trang</option>
                        <option value={20}>20 / trang</option>
                        <option value={50}>50 / trang</option>
                    </select>
                    <button onClick={onApplyFilter} className="flex-shrink-0 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm">
                        <FontAwesomeIcon icon={faFilter} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const Pagination = ({ page, totalPages, setPage }) => {
    // ... logic phân trang giữ nguyên ...
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
            >
                <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            {pageNumbers.map((num, index) => (
                num === '...' ? (
                    <span key={index} className="px-4 py-2 text-sm text-gray-500">...</span>
                ) : (
                    <button key={index} onClick={() => setPage(num)} className={`px-4 py-2 rounded-lg border text-sm ${page === num ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white hover:bg-gray-50'}`}>
                        {num}
                    </button>
                )
            ))}
            <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="px-3 py-2 rounded-lg border bg-white text-sm disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-50"
            >
                <FontAwesomeIcon icon={faChevronRight} />
            </button>
        </div>
    );
};

// --- COMPONENT CHÍNH ---
const AdminDashboard = () => {
    const { user } = useAuth();
    const authFetch = useApi();
    
    const [summary, setSummary] = useState(null);
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateAppModalOpen, setIsCreateAppModalOpen] = useState(false);
    const [isEditAppModalOpen, setIsEditAppModalOpen] = useState(false);
    const [editingAppId, setEditingAppId] = useState(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    
    const fetchData = useCallback(async () => {
        // ... logic fetch data giữ nguyên ...
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(limit));
            if (fromDate) params.set('fromDate', fromDate);
            if (toDate) params.set('toDate', toDate);

            const result = await authFetch(`applications?${params.toString()}`, { method: 'GET' });
            if (result && result.success) {
                const apps = result.data || [];
                setApplications(apps);
                setSummary(calculateSummary(apps));
                setTotal(result.total || 0);
                setTotalPages(result.totalPages || 1);
            } else {
                throw new Error(result?.message || 'Lỗi khi tải dữ liệu.');
            }
        } catch (error) {
            toast.error(error.message || 'Không thể tải dữ liệu.');
        } finally {
            setIsLoading(false);
        }
    }, [authFetch, page, limit, fromDate, toDate]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApplyFilter = () => {
        setPage(1);
        fetchData();
    };

    const handleDelete = async (appId) => {
        // ... logic delete giữ nguyên ...
        if (!window.confirm("Bạn có chắc chắn muốn xóa ứng dụng này không?")) return;
        try {
            await authFetch(`applications/${appId}`, { method: 'DELETE' });
            toast.success('Xóa ứng dụng thành công.');
            fetchData();
        } catch (error) {
            toast.error('Lỗi khi xóa: ' + error.message);
        }
    };

    const handleEdit = (appId) => {
        setEditingAppId(appId);
        setIsEditAppModalOpen(true);
    };

    const handleAppUpdated = () => {
        fetchData(); // Refresh data after update
    };
    
    const filteredApplications = applications.filter((app) => 
        `${app.name || ''} ${app.appId || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (statusFilter === 'all' ? true : app.status === statusFilter)
    );
    
    if (isLoading || !summary) {
        return <LoadingSpinner message="Đang tải dữ liệu quản lý..." />;
    }

    const balanceIsPositive = summary.balance >= 0;

    return (
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar />
            <div className="flex-1 lg:ml-64">
                <main className="p-4 sm:p-6 lg:p-8 max-w-full">
                    <header className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Tổng Quan</h1>
                                <p className="text-base text-gray-500 mt-1">
                                    Chào <span className="font-semibold text-gray-800">{user?.name || user?.username}</span>, chúc bạn một ngày làm việc hiệu quả!
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={fetchData} className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border hover:bg-gray-50 transition shadow-sm">
                                    <FontAwesomeIcon icon={faSyncAlt} className="mr-2" />Làm mới
                                </button>
                                <button onClick={() => setIsCreateAppModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-md">
                                    <FontAwesomeIcon icon={faPlus} className="mr-2" />Tạo App Mới
                                </button>
                            </div>
                        </div>
                    </header>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Tổng Ứng dụng" value={total} icon={faMobileAlt} color={{bg: 'bg-blue-100', text: 'text-blue-600'}} />
                        <StatCard title="Tổng Chi phí" value={formatCurrency(summary.totalCost)} icon={faCode} color={{bg: 'bg-red-100', text: 'text-red-600'}} />
                        <StatCard title="Tổng Thu Nhập" value={formatCurrency(summary.totalRevenue)} icon={faDollarSign} color={{bg: 'bg-green-100', text: 'text-green-600'}} />
                        <StatCard title="Lợi Nhuận Ròng" value={formatCurrency(summary.balance)} icon={balanceIsPositive ? faArrowTrendUp : faArrowTrendDown} color={balanceIsPositive ? {bg: 'bg-teal-100', text: 'text-teal-600'} : {bg: 'bg-orange-100', text: 'text-orange-600'}} />
                    </div>
                    
                    <DashboardToolbar 
                        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                        fromDate={fromDate} setFromDate={setFromDate}
                        toDate={toDate} setToDate={setToDate}
                        limit={limit} setLimit={(val) => { setPage(1); setLimit(val); }}
                        onApplyFilter={handleApplyFilter}
                    />

                    <ApplicationTable applications={filteredApplications} isAdmin={true} onDelete={handleDelete} onEdit={handleEdit} />
                    
                    {totalPages > 1 && <Pagination page={page} totalPages={totalPages} setPage={setPage} />}
                </main>
            </div>

            <CreateAppModal isOpen={isCreateAppModalOpen} onClose={() => setIsCreateAppModalOpen(false)} onAppCreated={fetchData} />
            
            <EditAppModal 
                isOpen={isEditAppModalOpen} 
                onClose={() => {
                    setIsEditAppModalOpen(false);
                    setEditingAppId(null);
                }} 
                onAppUpdated={handleAppUpdated}
                appId={editingAppId}
            />
        </div>
    );
};


// --- COMPONENT BẢNG ---
const ApplicationTable = ({ applications, isAdmin, onDelete, onEdit }) => {
    // ... logic bảng giữ nguyên, chỉ thay đổi icon ...
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
            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status] || statusStyles.default}`}>
                {status?.toUpperCase().replace('_', ' ') || 'N/A'}
            </span>
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

    // Component tooltip cho thông tin client
    const ClientTooltip = ({ client, children }) => {
        const [showTooltip, setShowTooltip] = useState(false);
        const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        if (!client) {
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
                        className="fixed z-50 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl pointer-events-none"
                        style={{
                            left: `${mousePosition.x + 10}px`,
                            top: `${mousePosition.y - 10}px`,
                            transform: 'translateY(-100%)'
                        }}
                    >
                        <div className="space-y-2">
                            <div>
                                <span className="font-semibold text-gray-300">Tên:</span>
                                <span className="ml-2">{client.name || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-300">Username:</span>
                                <span className="ml-2 font-mono">{client.username || 'N/A'}</span>
                            </div>
                            {client.contactInfo && (
                                <div>
                                    <span className="font-semibold text-gray-300">Liên hệ:</span>
                                    <span className="ml-2">{client.contactInfo}</span>
                                </div>
                            )}
                            <div>
                                <span className="font-semibold text-gray-300">Vai trò:</span>
                                <span className="ml-2 capitalize">{client.role || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Component tooltip cho thông tin CHPlay Account
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
                        className="fixed z-50 w-72 p-3 bg-blue-900 text-white text-sm rounded-lg shadow-xl pointer-events-none"
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
                                <span className="font-semibold text-blue-300">Loại:</span>
                                <span className="ml-2 capitalize">{account.type || 'N/A'}</span>
                            </div>
                            {account.address && (
                                <div>
                                    <span className="font-semibold text-blue-300">Địa chỉ:</span>
                                    <span className="ml-2">{account.address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const TableHeader = ({ children, className = '' }) => (<th scope="col" className={`px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${className}`}>{children}</th>);
    const TableData = ({ children, className = '' }) => (<td className={`px-5 py-4 whitespace-nowrap text-sm text-gray-800 ${className}`}>{children}</td>);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-5 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">Danh sách Ứng dụng</h3>
            </div>
            
            {applications.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                    <FontAwesomeIcon icon={faBoxOpen} className="text-4xl mb-3 text-gray-300" />
                    <p className="font-medium">Không tìm thấy dữ liệu phù hợp.</p>
                    <p className="text-sm">Hãy thử thay đổi bộ lọc hoặc tạo ứng dụng mới.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <TableHeader>Tên App</TableHeader>
                                <TableHeader>App ID</TableHeader>
                                <TableHeader>Trạng thái</TableHeader>
                                <TableHeader>IAP IDs</TableHeader>
                                <TableHeader className="text-right">Chi phí PT</TableHeader>
                                <TableHeader className="text-right">Chi phí TT</TableHeader>
                                <TableHeader>Client</TableHeader>
                                <TableHeader>CHPlay Account</TableHeader>
                                {isAdmin && <TableHeader className="text-center">Hành động</TableHeader>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {applications.map((app) => (
                                <tr key={app._id} className="hover:bg-gray-50 transition">
                                    <TableData className="font-semibold text-indigo-600">{app.name}</TableData>
                                    <TableData className="font-mono text-gray-600">{app.appId}</TableData>
                                    <TableData><StatusBadge status={app.status} /></TableData>
                                    <TableData>
                                        <IapIdsDisplay iapIds={app.iapIds} />
                                    </TableData>
                                    <TableData className="text-right font-medium">{formatCurrency(app.costDevelopment)}</TableData>
                                    <TableData className="text-right font-medium">{formatCurrency(app.costTesting)}</TableData>
                                    <TableData>
                                        <ClientTooltip client={app.client}>
                                            <span className="text-indigo-600 hover:text-indigo-800 font-medium">
                                                {app.client?.name || app.client?._id || 'N/A'}
                                            </span>
                                        </ClientTooltip>
                                    </TableData>
                                    <TableData>
                                        <AccountTooltip account={app.chplayAccount}>
                                            <span className="text-blue-600 hover:text-blue-800 font-medium">
                                                {app.chplayAccount?.name || app.chplayAccount?._id || 'N/A'}
                                            </span>
                                        </AccountTooltip>
                                    </TableData>
                                    {isAdmin && (
                                        <TableData className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => onEdit(app._id)} className="text-indigo-600 hover:text-indigo-800 transition text-base w-8 h-8 flex items-center justify-center rounded-md hover:bg-indigo-100" title="Sửa ứng dụng">
                                                    <FontAwesomeIcon icon={faPencilAlt} />
                                                </button>
                                                <button onClick={() => onDelete(app._id)} className="text-red-500 hover:text-red-700 transition text-base w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-100" title="Xóa ứng dụng">
                                                    <FontAwesomeIcon icon={faTrashAlt} />
                                                </button>
                                            </div>
                                        </TableData>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;