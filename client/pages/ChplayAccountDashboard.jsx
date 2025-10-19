import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import toast from 'react-hot-toast';

// --- THƯ VIỆN BÊN THỨ 3 ---
import DatePicker from 'react-datepicker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faShieldAlt, faEnvelope, faStar,
    faSearch, faFilter, faSyncAlt, faPlus, faChevronLeft, faChevronRight,
    faPencilAlt, faTrashAlt, faBoxOpen, faCopy, faCheck, faPlay
} from '@fortawesome/free-solid-svg-icons';

// --- COMPONENTS & STYLES (Placeholder Imports) ---
import LoadingSpinner from '../components/Loading'; // Tái sử dụng
// import Sidebar from '../components/SideBar'; // Tái sử dụng - đã bỏ vì sử dụng LayoutWrapper
// import CreateChplayAccountModal, EditChplayAccountModal, etc.

// =================================================================
// CÁC COMPONENT & HELPER CHIA SẺ (ĐỊNH NGHĨA LẠI CHO TÍNH TỰ CHỦ)
// =================================================================

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', minimumFractionDigits: 0
}).format(amount || 0);

const calculateAccountSummary = (accounts) => {
    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter(a => a.status === 'active').length;
    const suspendedAccounts = accounts.filter(a => a.status === 'suspended').length;
    
    // Giả định tổng số lượt sử dụng được lưu trữ trong 'usageCount'
    let totalUsage = 0;
    accounts.forEach(a => totalUsage += (a.usageCount || 0));

    return { totalAccounts, activeAccounts, suspendedAccounts, totalUsage };
};

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
                        placeholder="Tìm theo tên hoặc Email..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Hoạt động</option>
                    <option value="pending">Chờ xác minh</option>
                    <option value="suspended">Bị khóa</option>
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
                        placeholderText="Từ ngày tạo"
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
                        placeholderText="Đến ngày tạo"
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
    // Logic phân trang được copy từ AdminDashboard.jsx
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

// --- COMPONENT BẢNG ---
const ChplayAccountTable = ({ accounts, onDelete, onEdit }) => {
    
    const StatusBadge = ({ status }) => {
        let classes = "";
        switch (status) {
            case 'active': classes = "bg-green-100 text-green-800"; break;
            case 'pending': classes = "bg-yellow-100 text-yellow-800"; break;
            case 'suspended': classes = "bg-red-100 text-red-800"; break;
            default: classes = "bg-gray-100 text-gray-800";
        }
        return (
            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${classes}`}>
                {status || 'N/A'}
            </span>
        );
    };
    
    const TableHeader = ({ children, className = '' }) => (<th scope="col" className={`px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${className}`}>{children}</th>);
    const TableData = ({ children, className = '' }) => (<td className={`px-5 py-4 whitespace-nowrap text-sm text-gray-800 ${className}`}>{children}</td>);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-5 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">Danh sách Tài khoản CHPlay</h3>
            </div>
            
            {accounts.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                    <FontAwesomeIcon icon={faBoxOpen} className="text-4xl mb-3 text-gray-300" />
                    <p className="font-medium">Không tìm thấy tài khoản nào phù hợp.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <TableHeader>Tên & Email</TableHeader>
                                <TableHeader>Trạng thái</TableHeader>
                                <TableHeader>App đã dùng</TableHeader>
                                <TableHeader>Ngày tạo</TableHeader>
                                <TableHeader className="text-center">Hành động</TableHeader>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {accounts.map((account) => (
                                <tr key={account._id} className="hover:bg-gray-50 transition">
                                    <TableData>
                                        <div className="font-semibold text-blue-600">{account.name || 'N/A'}</div>
                                        <div className="text-xs font-mono text-gray-500">{account.email}</div>
                                    </TableData>
                                    <TableData><StatusBadge status={account.status} /></TableData>
                                    <TableData className="font-medium">{account.usageCount || 0}</TableData>
                                    <TableData className="text-gray-500">{new Date(account.createdAt).toLocaleDateString('vi-VN')}</TableData>
                                    <TableData className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => onEdit(account._id)} className="text-indigo-600 hover:text-indigo-800 transition text-base w-8 h-8 flex items-center justify-center rounded-md hover:bg-indigo-100" title="Sửa tài khoản">
                                                <FontAwesomeIcon icon={faPencilAlt} />
                                            </button>
                                            <button onClick={() => onDelete(account._id)} className="text-red-500 hover:text-red-700 transition text-base w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-100" title="Xóa tài khoản">
                                                <FontAwesomeIcon icon={faTrashAlt} />
                                            </button>
                                        </div>
                                    </TableData>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// --- MODAL SKELETONS ---
const CreateChplayAccountModal = ({ isOpen, onClose, onAccountCreated }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                <h2 className="text-xl font-bold text-indigo-700 border-b pb-3 mb-4">Thêm Tài Khoản CHPlay Mới</h2>
                <p className="text-gray-600 mb-4">Đây là form mẫu. Vui lòng thêm logic xử lý form ở đây.</p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Hủy</button>
                    <button onClick={() => { onClose(); onAccountCreated(); toast.success("Tài khoản tạo thành công (Demo)!"); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Thêm</button>
                </div>
            </div>
        </div>
    );
};

const EditChplayAccountModal = ({ isOpen, onClose, onAccountUpdated, accountId }) => {
    if (!isOpen || !accountId) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                <h2 className="text-xl font-bold text-indigo-700 border-b pb-3 mb-4">Sửa Tài Khoản CHPlay ID: {accountId}</h2>
                 <p className="text-gray-600 mb-4">Đây là form mẫu. Vui lòng thêm logic xử lý form ở đây.</p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Hủy</button>
                    <button onClick={() => { onClose(); onAccountUpdated(); toast.success("Tài khoản cập nhật thành công (Demo)!"); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Lưu</button>
                </div>
            </div>
        </div>
    );
};


// --- COMPONENT CHÍNH ---
const ChplayAccountDashboard = () => {
    const { user } = useAuth();
    const authFetch = useApi();
    
    const [summary, setSummary] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAccountId, setEditingAccountId] = useState(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(limit));
            if (fromDate) params.set('fromDate', fromDate);
            if (toDate) params.set('toDate', toDate);
            if (statusFilter !== 'all') params.set('status', statusFilter);

            const result = await authFetch(`chplay-accounts?${params.toString()}`, { method: 'GET' });
            if (result && result.success) {
                const fetchedAccounts = result.data || [];
                setAccounts(fetchedAccounts);
                setSummary(calculateAccountSummary(fetchedAccounts));
                setTotal(result.total || fetchedAccounts.length);
                setTotalPages(result.totalPages || Math.ceil(fetchedAccounts.length / limit) || 1);
            } else {
                throw new Error(result?.message || 'Lỗi khi tải dữ liệu tài khoản CHPlay.');
            }
        } catch (error) {
            toast.error(error.message || 'Không thể tải dữ liệu tài khoản CHPlay.');
        } finally {
            setIsLoading(false);
        }
    }, [authFetch, page, limit, fromDate, toDate, statusFilter]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApplyFilter = () => {
        setPage(1);
        fetchData();
    };

    const handleDelete = async (accountId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản này không?")) return;
        try {
            await authFetch(`chplay-accounts/${accountId}`, { method: 'DELETE' });
            toast.success('Xóa tài khoản thành công.');
            fetchData();
        } catch (error) {
            toast.error('Lỗi khi xóa: ' + error.message);
        }
    };

    const handleEdit = (accountId) => {
        setEditingAccountId(accountId);
        setIsEditModalOpen(true);
    };

    const handleAccountUpdated = () => {
        fetchData(); // Refresh data after update
    };
    
    const filteredAccounts = accounts.filter((account) => 
        `${account.name || ''} ${account.email || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (isLoading || !summary) {
        return <LoadingSpinner message="Đang tải dữ liệu tài khoản CHPlay..." />;
    }

    return (
        <>
            <main className="p-4 sm:p-6 lg:p-8 max-w-full">
                <header className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Quản Lý Tài Khoản CHPlay</h1>
                                <p className="text-base text-gray-500 mt-1">
                                    Quản lý các tài khoản Developer đã đăng ký với Google Play Console.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={fetchData} className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border hover:bg-gray-50 transition shadow-sm">
                                    <FontAwesomeIcon icon={faSyncAlt} className="mr-2" />Làm mới
                                </button>
                                <button onClick={() => setIsCreateModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-md">
                                    <FontAwesomeIcon icon={faPlus} className="mr-2" />Thêm Tài Khoản
                                </button>
                            </div>
                        </div>
                    </header>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Tổng số Tài khoản" value={total} icon={faPlay} color={{bg: 'bg-blue-100', text: 'text-blue-600'}} />
                        <StatCard title="Đang Hoạt động" value={summary.activeAccounts} icon={faShieldAlt} color={{bg: 'bg-green-100', text: 'text-green-600'}} />
                        <StatCard title="Đã Bị khóa" value={summary.suspendedAccounts} icon={faEnvelope} color={{bg: 'bg-red-100', text: 'text-red-600'}} />
                        <StatCard title="Tổng App đã dùng" value={summary.totalUsage} icon={faStar} color={{bg: 'bg-indigo-100', text: 'text-indigo-600'}} />
                    </div>
                    
                    <DashboardToolbar 
                        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                        fromDate={fromDate} setFromDate={setFromDate}
                        toDate={toDate} setToDate={setToDate}
                        limit={limit} setLimit={(val) => { setPage(1); setLimit(val); }}
                        onApplyFilter={handleApplyFilter}
                    />

                    <ChplayAccountTable accounts={filteredAccounts} onDelete={handleDelete} onEdit={handleEdit} />
                    
                    {totalPages > 1 && <Pagination page={page} totalPages={totalPages} setPage={setPage} />}
                </main>

            <CreateChplayAccountModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onAccountCreated={fetchData} />
            
            <EditChplayAccountModal 
                isOpen={isEditModalOpen} 
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingAccountId(null);
                }} 
                onAccountUpdated={handleAccountUpdated}
                accountId={editingAccountId}
            />
        </>
    );
};

export default ChplayAccountDashboard;
