import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import toast from 'react-hot-toast';

// --- THƯ VIỆN BÊN THỨ 3 (Sử dụng icon và input native để tránh lỗi build) ---
// Đã loại bỏ import cho FontAwesome và DatePicker.
// Các ký hiệu icon sẽ được thay thế bằng Unicode/Text.

// --- COMPONENTS & STYLES (Placeholder Imports) ---
import LoadingSpinner from '../components/Loading'; // Tái sử dụng
// import Sidebar from '../components/SideBar'; // Tái sử dụng - đã bỏ vì sử dụng LayoutWrapper
// import '../src/styles/datepicker.css'; // Giả định đã import CSS
// import CreateUserModal, EditUserModal, etc.

// =================================================================
// CÁC COMPONENT & HELPER CHIA SẺ (ĐỊNH NGHĨA LẠI CHO TÍNH TỰ CHỦ)
// =================================================================

// MAPPING ICON SANG UNICODE HOẶC KÝ HIỆU TEXT
const ICON_MAP = {
    users: '👥', // faUsers
    admin: '👔', // faUserTie
    client: '🤝', // faUserFriends
    active: '✅', // faCheck
    search: '🔍', // faSearch
    filter: '⚙️', // faFilter
    refresh: '🔄', // faSyncAlt
    plus: '➕', // faPlus
    left: '←', // faChevronLeft
    right: '→', // faChevronRight
    edit: '✏️', // faPencilAlt
    delete: '🗑️', // faTrashAlt
    empty: '📦' // faBoxOpen
};

const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', minimumFractionDigits: 0
}).format(amount || 0);

const calculateUserSummary = (users) => {
    const totalUsers = users.length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const clientCount = users.filter(u => u.role === 'user').length;
    const activeCount = users.filter(u => u.isActive).length;

    return { totalUsers, adminCount, clientCount, activeCount };
};

const StatCard = ({ title, value, iconKey, color }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-100 flex items-center gap-5">
        <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full ${color.bg}`}>
            <span className={`text-xl ${color.text}`} aria-hidden="true">{ICON_MAP[iconKey]}</span>
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
        </div>
    </div>
);

const DashboardToolbar = ({ searchQuery, setSearchQuery, roleFilter, setRoleFilter, fromDate, setFromDate, toDate, setToDate, limit, setLimit, onApplyFilter }) => {
    
    // Sử dụng input type="date" thay vì DatePicker
    
    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">{ICON_MAP.search}</span>
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm theo tên, email, hoặc username..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                    <option value="all">Tất cả vai trò</option>
                    <option value="admin">Admin</option>
                    <option value="user">Client (User)</option>
                </select>
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        placeholder="Từ ngày tạo"
                        className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        placeholder="Đến ngày tạo"
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
                    <button onClick={onApplyFilter} className="flex-shrink-0 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm" title="Áp dụng bộ lọc">
                        {ICON_MAP.filter}
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
                title="Trang trước"
            >
                {ICON_MAP.left}
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
                title="Trang sau"
            >
                {ICON_MAP.right}
            </button>
        </div>
    );
};

// --- COMPONENT BẢNG ---
const UserTable = ({ users, onDelete, onEdit }) => {
    
    const StatusBadge = ({ isActive }) => {
        let classes = isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
        return (
            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${classes}`}>
                {isActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
        );
    };

    const RoleBadge = ({ role }) => {
        let classes = role === 'admin' ? "bg-indigo-100 text-indigo-800" : "bg-blue-100 text-blue-800";
        return (
            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${classes}`}>
                {role}
            </span>
        );
    };
    
    const TableHeader = ({ children, className = '' }) => (<th scope="col" className={`px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${className}`}>{children}</th>);
    const TableData = ({ children, className = '' }) => (<td className={`px-5 py-4 whitespace-nowrap text-sm text-gray-800 ${className}`}>{children}</td>);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-5 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">Danh sách Người dùng</h3>
            </div>
            
            {users.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                    <span className="text-4xl mb-3 block text-gray-300">{ICON_MAP.empty}</span>
                    <p className="font-medium">Không tìm thấy người dùng nào phù hợp.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <TableHeader>Tên & Username</TableHeader>
                                <TableHeader>Email</TableHeader>
                                <TableHeader>Vai trò</TableHeader>
                                <TableHeader>Trạng thái</TableHeader>
                                <TableHeader>Ngày tạo</TableHeader>
                                <TableHeader className="text-center">Hành động</TableHeader>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-50 transition">
                                    <TableData>
                                        <div className="font-semibold text-indigo-600">{user.name || 'N/A'}</div>
                                        <div className="text-xs font-mono text-gray-500">@{user.username}</div>
                                    </TableData>
                                    <TableData className="text-gray-600">{user.email}</TableData>
                                    <TableData><RoleBadge role={user.role} /></TableData>
                                    <TableData><StatusBadge isActive={user.isActive} /></TableData>
                                    <TableData className="text-gray-500">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</TableData>
                                    <TableData className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => onEdit(user._id)} className="text-indigo-600 hover:text-indigo-800 transition text-base w-8 h-8 flex items-center justify-center rounded-md hover:bg-indigo-100" title="Sửa người dùng">
                                                {ICON_MAP.edit}
                                            </button>
                                            <button onClick={() => onDelete(user._id)} className="text-red-500 hover:text-red-700 transition text-base w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-100" title="Xóa người dùng">
                                                {ICON_MAP.delete}
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
const CreateUserModal = ({ isOpen, onClose, onUserCreated }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                <h2 className="text-xl font-bold text-indigo-700 border-b pb-3 mb-4">Tạo Người Dùng Mới</h2>
                <p className="text-gray-600 mb-4">Đây là form mẫu. Vui lòng thêm logic xử lý form ở đây.</p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Hủy</button>
                    <button onClick={() => { onClose(); onUserCreated(); toast.success("Người dùng tạo thành công (Demo)!"); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Tạo</button>
                </div>
            </div>
        </div>
    );
};

const EditUserModal = ({ isOpen, onClose, onUserUpdated, userId }) => {
    if (!isOpen || !userId) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                <h2 className="text-xl font-bold text-indigo-700 border-b pb-3 mb-4">Sửa Người Dùng ID: {userId}</h2>
                 <p className="text-gray-600 mb-4">Đây là form mẫu. Vui lòng thêm logic xử lý form ở đây.</p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Hủy</button>
                    <button onClick={() => { onClose(); onUserUpdated(); toast.success("Người dùng cập nhật thành công (Demo)!"); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Lưu</button>
                </div>
            </div>
        </div>
    );
};


// --- COMPONENT CHÍNH ---
const UserManagement = () => {
    const { user } = useAuth();
    const authFetch = useApi();
    
    const [summary, setSummary] = useState(null);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
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
            if (roleFilter !== 'all') params.set('role', roleFilter);

            const result = await authFetch(`users?${params.toString()}`, { method: 'GET' });
            if (result && result.success) {
                const fetchedUsers = result.data || [];
                setUsers(fetchedUsers);
                setSummary(calculateUserSummary(fetchedUsers));
                setTotal(result.total || fetchedUsers.length);
                setTotalPages(result.totalPages || Math.ceil(fetchedUsers.length / limit) || 1);
            } else {
                throw new Error(result?.message || 'Lỗi khi tải dữ liệu người dùng.');
            }
        } catch (error) {
            toast.error(error.message || 'Không thể tải dữ liệu người dùng.');
        } finally {
            setIsLoading(false);
        }
    }, [authFetch, page, limit, fromDate, toDate, roleFilter]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApplyFilter = () => {
        setPage(1);
        fetchData();
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này không?")) return;
        try {
            await authFetch(`users/${userId}`, { method: 'DELETE' });
            toast.success('Xóa người dùng thành công.');
            fetchData();
        } catch (error) {
            toast.error('Lỗi khi xóa: ' + error.message);
        }
    };

    const handleEdit = (userId) => {
        setEditingUserId(userId);
        setIsEditModalOpen(true);
    };

    const handleUserUpdated = () => {
        fetchData(); // Refresh data after update
    };
    
    const filteredUsers = users.filter((user) => 
        `${user.name || ''} ${user.username || ''} ${user.email || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (isLoading || !summary) {
        return <LoadingSpinner message="Đang tải dữ liệu người dùng..." />;
    }

    return (
        <>
            <main className="p-4 sm:p-6 lg:p-8 max-w-full">
                <header className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Quản Lý Người Dùng</h1>
                                <p className="text-base text-gray-500 mt-1">
                                    Quản lý thông tin, vai trò và trạng thái của tất cả người dùng hệ thống.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={fetchData} className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border hover:bg-gray-50 transition shadow-sm">
                                    <span className="mr-2">{ICON_MAP.refresh}</span>Làm mới
                                </button>
                                <button onClick={() => setIsCreateModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-md">
                                    <span className="mr-2">{ICON_MAP.plus}</span>Tạo Người Dùng
                                </button>
                            </div>
                        </div>
                    </header>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Tổng số Người dùng" value={total} iconKey="users" color={{bg: 'bg-blue-100', text: 'text-blue-600'}} />
                        <StatCard title="Số Admin" value={summary.adminCount} iconKey="admin" color={{bg: 'bg-indigo-100', text: 'text-indigo-600'}} />
                        <StatCard title="Số Client" value={summary.clientCount} iconKey="client" color={{bg: 'bg-green-100', text: 'text-green-600'}} />
                        <StatCard title="Đang Hoạt động" value={summary.activeCount} iconKey="active" color={{bg: 'bg-teal-100', text: 'text-teal-600'}} />
                    </div>
                    
                    <DashboardToolbar 
                        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                        roleFilter={roleFilter} setRoleFilter={setRoleFilter}
                        fromDate={fromDate} setFromDate={setFromDate}
                        toDate={toDate} setToDate={setToDate}
                        limit={limit} setLimit={(val) => { setPage(1); setLimit(val); }}
                        onApplyFilter={handleApplyFilter}
                    />

                    <UserTable users={filteredUsers} onDelete={handleDelete} onEdit={handleEdit} />
                    
                    {totalPages > 1 && <Pagination page={page} totalPages={totalPages} setPage={setPage} />}
                </main>

            <CreateUserModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onUserCreated={fetchData} />
            
            <EditUserModal 
                isOpen={isEditModalOpen} 
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingUserId(null);
                }} 
                onUserUpdated={handleUserUpdated}
                userId={editingUserId}
            />
        </>
    );
};

export default UserManagement;
