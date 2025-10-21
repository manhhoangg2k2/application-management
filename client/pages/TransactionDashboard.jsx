import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import toast from 'react-hot-toast';

// --- THƯ VIỆN BÊN THỨ 3 ---
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// --- COMPONENTS & STYLES (Placeholder Imports) ---
import LoadingSpinner from '../components/Loading'; // Tái sử dụng
// import Sidebar from '../components/SideBar'; // Tái sử dụng - đã bỏ vì sử dụng LayoutWrapper
// import CreateTransactionModal, EditTransactionModal, etc.

// =================================================================
// CÁC COMPONENT & HELPER CHIA SẺ (ĐỊNH NGHĨA LẠI CHO TÍNH TỰ CHỦ)
// =================================================================

// MAPPING ICON SANG UNICODE HOẶC KÝ HIỆU TEXT
const ICON_MAP = {
    invoice: '🧾', // faFileInvoiceDollar
    inflow: '➕💰', // faPiggyBank or faArrowTrendUp
    outflow: '➖💳', // faCreditCard or faArrowTrendDown
    balance: '📊', // faMoneyBillWave
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

import { formatCurrency } from '../utils/currency';

const calculateTransactionSummary = (transactions, totalCount = 0) => {
    const totalTx = totalCount; // Sử dụng tổng số từ API thay vì length của array
    let totalInflow = 0;
    let totalOutflow = 0;
    
    transactions.forEach(tx => {
        if (tx.type === 'income') {
            totalInflow += (tx.amount || 0);
        } else if (tx.type === 'expense') {
            totalOutflow += (tx.amount || 0);
        }
    });
    
    const netBalance = totalInflow - totalOutflow;

    return { totalTx, totalInflow, totalOutflow, netBalance };
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

const DashboardToolbar = ({ searchQuery, setSearchQuery, typeFilter, setTypeFilter, fromDate, setFromDate, toDate, setToDate, limit, setLimit, onApplyFilter }) => {
    // Convert string dates to Date objects for DatePicker
    const startDate = fromDate ? new Date(fromDate) : null;
    const endDate = toDate ? new Date(toDate) : null;
    
    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">{ICON_MAP.search}</span>
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm theo mô tả hoặc Client ID..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                    <option value="all">Tất cả loại giao dịch</option>
                    <option value="income">Thu vào</option>
                    <option value="expense">Chi ra</option>
                </select>
                <div className="flex items-center gap-2">
                    <DatePicker
                        selected={startDate}
                        onChange={(date) => setFromDate(date ? date.toISOString().split('T')[0] : '')}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        maxDate={new Date()}
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
                        maxDate={new Date()}
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
const TransactionTable = ({ transactions, onDelete, onEdit }) => {
    
    const TypeBadge = ({ type }) => {
        let classes = type === 'income' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
        return (
            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${classes}`}>
                {type === 'income' ? 'Thu vào' : 'Chi ra'}
            </span>
        );
    };
    
    const TableHeader = ({ children, className = '' }) => (<th scope="col" className={`px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${className}`}>{children}</th>);
    const TableData = ({ children, className = '' }) => (<td className={`px-5 py-4 whitespace-nowrap text-sm text-gray-800 ${className}`}>{children}</td>);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-5 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">Danh sách Giao dịch</h3>
            </div>
            
            {transactions.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                    <span className="text-4xl mb-3 block text-gray-300">{ICON_MAP.empty}</span>
                    <p className="font-medium">Không tìm thấy giao dịch nào phù hợp.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <TableHeader>Loại</TableHeader>
                                <TableHeader className="text-right">Số tiền</TableHeader>
                                <TableHeader>Mô tả</TableHeader>
                                <TableHeader>Client</TableHeader>
                                <TableHeader>Ngày giao dịch</TableHeader>
                                <TableHeader className="text-center">Hành động</TableHeader>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transactions.map((tx) => (
                                <tr key={tx._id} className="hover:bg-gray-50 transition">
                                    <TableData><TypeBadge type={tx.type} /></TableData>
                                    <TableData className={`text-right font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(tx.amount)}</TableData>
                                    <TableData className="text-gray-600 max-w-xs truncate" title={tx.description}>{tx.description}</TableData>
                                    <TableData className="text-indigo-600">{tx.userId?.name || tx.userId?.username || 'N/A'}</TableData>
                                    <TableData className="text-gray-500">{new Date(tx.transactionDate).toLocaleDateString('vi-VN')}</TableData>
                                    <TableData className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => onEdit(tx._id)} className="text-indigo-600 hover:text-indigo-800 transition text-base w-8 h-8 flex items-center justify-center rounded-md hover:bg-indigo-100" title="Sửa giao dịch">
                                                {ICON_MAP.edit}
                                            </button>
                                            <button onClick={() => onDelete(tx._id)} className="text-red-500 hover:text-red-700 transition text-base w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-100" title="Xóa giao dịch">
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
const CreateTransactionModal = ({ isOpen, onClose, onTxCreated }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                <h2 className="text-xl font-bold text-indigo-700 border-b pb-3 mb-4">Tạo Giao Dịch Mới</h2>
                <p className="text-gray-600 mb-4">Đây là form mẫu. Vui lòng thêm logic xử lý form ở đây.</p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Hủy</button>
                    <button onClick={() => { onClose(); onTxCreated(); toast.success("Giao dịch tạo thành công (Demo)!"); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Tạo</button>
                </div>
            </div>
        </div>
    );
};

const EditTransactionModal = ({ isOpen, onClose, onTxUpdated, txId }) => {
    const { user } = useAuth();
    const authFetch = useApi();
    
    const [isLoading, setIsLoading] = useState(false);
    const [transaction, setTransaction] = useState(null);
    const [formData, setFormData] = useState({
        type: 'revenue',
        category: '',
        amount: '',
        description: '',
        transactionDate: '',
        status: 'completed',
        notes: ''
    });

    // Fetch transaction details when modal opens
    useEffect(() => {
        if (isOpen && txId) {
            fetchTransactionDetails();
        }
    }, [isOpen, txId]);

    const fetchTransactionDetails = async () => {
        try {
            setIsLoading(true);
            const result = await authFetch(`transactions/${txId}`, { method: 'GET' });
            if (result && result.success) {
                const tx = result.data;
                setTransaction(tx);
                setFormData({
                    type: tx.type,
                    category: tx.category,
                    amount: tx.amount.toString(),
                    description: tx.description,
                    transactionDate: tx.transactionDate ? new Date(tx.transactionDate).toISOString().split('T')[0] : '',
                    status: tx.status,
                    notes: tx.notes || ''
                });
            } else {
                throw new Error(result?.message || 'Không thể tải thông tin giao dịch.');
            }
        } catch (error) {
            toast.error('Lỗi khi tải thông tin giao dịch: ' + error.message);
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.amount || !formData.description) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
            return;
        }

        try {
            setIsLoading(true);
            const updateData = {
                ...formData,
                amount: parseFloat(formData.amount),
                transactionDate: formData.transactionDate ? new Date(formData.transactionDate) : new Date()
            };

            const result = await authFetch(`transactions/${txId}`, {
                method: 'PUT',
                body: updateData
            });

            if (result && result.success) {
                toast.success('Cập nhật giao dịch thành công!');
                onTxUpdated();
                onClose();
            } else {
                throw new Error(result?.message || 'Lỗi khi cập nhật giao dịch.');
            }
        } catch (error) {
            toast.error('Lỗi khi cập nhật giao dịch: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !txId) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-indigo-700 border-b pb-4 mb-6">Sửa Giao Dịch</h2>
                    
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <span className="ml-3 text-gray-600">Đang tải...</span>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Loại giao dịch */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại giao dịch *</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                        required
                                    >
                                        <option value="revenue">Thu vào</option>
                                        <option value="expense">Chi ra</option>
                                    </select>
                                </div>

                                {/* Danh mục */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục *</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                        required
                                    >
                                        <option value="">Chọn danh mục</option>
                                        <optgroup label="Thu nhập">
                                            <option value="development_fee">Phí phát triển</option>
                                            <option value="testing_fee">Phí thử nghiệm</option>
                                            <option value="revenue_share">Chia sẻ doanh thu</option>
                                            <option value="support_fee">Phí hỗ trợ</option>
                                            <option value="user_payment">Thanh toán từ user</option>
                                            <option value="other_income">Thu nhập khác</option>
                                        </optgroup>
                                        <optgroup label="Chi phí">
                                            <option value="server_cost">Chi phí server</option>
                                            <option value="marketing">Marketing</option>
                                            <option value="app_development">Phát triển app</option>
                                            <option value="app_testing">Thử nghiệm app</option>
                                            <option value="other_expense">Chi phí khác</option>
                                        </optgroup>
                                    </select>
                                </div>

                                {/* Số tiền */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền (VND) *</label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        placeholder="Nhập số tiền"
                                        min="0"
                                        step="1000"
                                        className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                        required
                                    />
                                </div>

                                {/* Ngày giao dịch */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ngày giao dịch *</label>
                                    <input
                                        type="date"
                                        name="transactionDate"
                                        value={formData.transactionDate}
                                        onChange={handleInputChange}
                                        className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                        required
                                    />
                                </div>

                                {/* Trạng thái */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                    >
                                        <option value="pending">Chờ xử lý</option>
                                        <option value="completed">Hoàn thành</option>
                                        <option value="cancelled">Đã hủy</option>
                                    </select>
                                </div>
                            </div>

                            {/* Mô tả */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả *</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Mô tả chi tiết về giao dịch"
                                    rows="3"
                                    maxLength="500"
                                    className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 ký tự</p>
                            </div>

                            {/* Ghi chú */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    placeholder="Ghi chú thêm (không bắt buộc)"
                                    rows="3"
                                    maxLength="1000"
                                    className="w-full py-2.5 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">{formData.notes.length}/1000 ký tự</p>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                                    disabled={isLoading}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- COMPONENT CHÍNH ---
const TransactionDashboard = () => {
    const { user } = useAuth();
    const authFetch = useApi();
    
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTxId, setEditingTxId] = useState(null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
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
            if (typeFilter !== 'all') params.set('type', typeFilter);

            const result = await authFetch(`transactions?${params.toString()}`, { method: 'GET' });
            if (result && result.success) {
                const fetchedTxs = result.data || [];
                setTransactions(fetchedTxs);
                setSummary(calculateTransactionSummary(fetchedTxs, result.total || fetchedTxs.length));
                setTotal(result.total || fetchedTxs.length);
                setTotalPages(result.totalPages || Math.ceil(fetchedTxs.length / limit) || 1);
            } else {
                throw new Error(result?.message || 'Lỗi khi tải dữ liệu giao dịch.');
            }
        } catch (error) {
            toast.error(error.message || 'Không thể tải dữ liệu giao dịch.');
        } finally {
            setIsLoading(false);
        }
    }, [authFetch, page, limit, fromDate, toDate, typeFilter]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApplyFilter = () => {
        setPage(1);
        fetchData();
    };

    const handleDelete = async (txId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa giao dịch này không?")) return;
        try {
            await authFetch(`transactions/${txId}`, { method: 'DELETE' });
            toast.success('Xóa giao dịch thành công.');
            fetchData();
        } catch (error) {
            toast.error('Lỗi khi xóa: ' + error.message);
        }
    };

    const handleEdit = (txId) => {
        setEditingTxId(txId);
        setIsEditModalOpen(true);
    };

    const handleTxUpdated = () => {
        fetchData(); // Refresh data after update
    };
    
    const filteredTransactions = transactions.filter((tx) => 
        (tx.description || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (tx.userId?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.userId?.username || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (isLoading || !summary) {
        return <LoadingSpinner message="Đang tải dữ liệu giao dịch..." />;
    }

    const netBalanceIsPositive = summary.netBalance >= 0;

    return (
        <>
            <main className="p-4 sm:p-6 lg:p-8 max-w-full">
                <header className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Quản Lý Giao Dịch</h1>
                                <p className="text-base text-gray-500 mt-1">
                                    Theo dõi tất cả các luồng tiền thu vào và chi ra trong hệ thống.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={fetchData} className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border hover:bg-gray-50 transition shadow-sm">
                                    <span className="mr-2">{ICON_MAP.refresh}</span>Làm mới
                                </button>
                                <button onClick={() => setIsCreateModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition shadow-md">
                                    <span className="mr-2">{ICON_MAP.plus}</span>Tạo Giao Dịch
                                </button>
                            </div>
                        </div>
                    </header>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Tổng số Giao dịch" value={total} iconKey="invoice" color={{bg: 'bg-blue-100', text: 'text-blue-600'}} />
                        <StatCard title="Tổng Thu vào" value={formatCurrency(summary.totalInflow)} iconKey="inflow" color={{bg: 'bg-green-100', text: 'text-green-600'}} />
                        <StatCard title="Tổng Chi ra" value={formatCurrency(summary.totalOutflow)} iconKey="outflow" color={{bg: 'bg-red-100', text: 'text-red-600'}} />
                        <StatCard title="Số dư ròng" value={formatCurrency(summary.netBalance)} iconKey="balance" color={netBalanceIsPositive ? {bg: 'bg-teal-100', text: 'text-teal-600'} : {bg: 'bg-orange-100', text: 'text-orange-600'}} />
                    </div>
                    
                    <DashboardToolbar 
                        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                        typeFilter={typeFilter} setTypeFilter={setTypeFilter}
                        fromDate={fromDate} setFromDate={setFromDate}
                        toDate={toDate} setToDate={setToDate}
                        limit={limit} setLimit={(val) => { setPage(1); setLimit(val); }}
                        onApplyFilter={handleApplyFilter}
                    />

                    <TransactionTable transactions={filteredTransactions} onDelete={handleDelete} onEdit={handleEdit} />
                    
                    {totalPages > 1 && <Pagination page={page} totalPages={totalPages} setPage={setPage} />}
                </main>

            <CreateTransactionModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onTxCreated={fetchData} />
            
            <EditTransactionModal 
                isOpen={isEditModalOpen} 
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingTxId(null);
                }} 
                onTxUpdated={handleTxUpdated}
                txId={editingTxId}
            />
        </>
    );
};

export default TransactionDashboard;
