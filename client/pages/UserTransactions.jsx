import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEye, faSyncAlt, faFilter, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency } from '../utils/currency';
import CreateTransactionModal from '../components/CreateTransactionModal';

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const UserTransactions = () => {
    const { user } = useAuth();
    const authFetch = useApi();
    
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [statistics, setStatistics] = useState({
        totalTransactions: 0,
        totalExpense: 0,
        totalAppRevenue: 0,
        balance: 0
    });
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchTransactions = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', String(limit));
            if (fromDate) params.set('fromDate', fromDate);
            if (toDate) params.set('toDate', toDate);

            const result = await authFetch(`users/transactions?${params.toString()}`, { method: 'GET' });
            if (result && result.success) {
                const userTransactions = result.data || [];
                setTransactions(userTransactions);
                setTotal(result.count || 0);
                setTotalPages(Math.ceil((result.count || 0) / limit));
                calculateStatistics(userTransactions);
            }
        } catch (error) {
            toast.error(error.message || 'Không thể tải danh sách giao dịch.');
        } finally {
            setIsLoading(false);
        }
    }, [authFetch, page, limit, fromDate, toDate]);

    const calculateStatistics = (transactions) => {
        const totalTransactions = transactions.length;
        let totalExpense = 0;
        let totalAppRevenue = 0;

        transactions.forEach(transaction => {
            if (transaction.type === 'expense') {
                totalExpense += transaction.amount;
            } else if (transaction.type === 'income') {
                totalAppRevenue += transaction.amount;
            }
        });

        const balance = totalAppRevenue - totalExpense;

        setStatistics({
            totalTransactions,
            totalExpense,
            totalAppRevenue,
            balance
        });
    };

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleCreateTransaction = () => {
        setShowCreateModal(true);
    };

    const handleTransactionCreated = () => {
        fetchTransactions();
        setShowCreateModal(false);
    };

    const handleApplyFilter = () => {
        setPage(1);
        fetchTransactions();
    };

    const filteredTransactions = transactions.filter((transaction) => 
        transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (typeFilter === 'all' ? true : transaction.type === typeFilter)
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
                <p className="ml-4 text-gray-700">Đang tải danh sách giao dịch...</p>
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
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý Giao dịch</h1>
                            <p className="text-gray-600">Xem và quản lý các giao dịch của bạn</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={fetchTransactions}
                                className="px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border hover:bg-gray-50 transition shadow-sm"
                            >
                                <FontAwesomeIcon icon={faSyncAlt} className="mr-2" />
                                Làm mới
                            </button>
                            <button
                                onClick={handleCreateTransaction}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                                Nạp tiền cho Admin
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <FilterSection
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                    fromDate={fromDate}
                    setFromDate={setFromDate}
                    toDate={toDate}
                    setToDate={setToDate}
                    limit={limit}
                    setLimit={setLimit}
                    onApplyFilter={handleApplyFilter}
                />

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <StatCard
                        title="Số lượng giao dịch"
                        value={statistics.totalTransactions}
                        unit="giao dịch"
                        color="bg-blue-600"
                        icon="📊"
                    />
                    <StatCard
                        title="Số tiền đã chi"
                        value={formatCurrency(statistics.totalExpense)}
                        unit="VND"
                        color="bg-red-600"
                        icon="💸"
                    />
                    <StatCard
                        title="Số tiền làm app"
                        value={formatCurrency(statistics.totalAppRevenue)}
                        unit="VND"
                        color="bg-green-600"
                        icon="💰"
                    />
                    <StatCard
                        title="Số dư"
                        value={formatCurrency(statistics.balance)}
                        unit="VND"
                        color={statistics.balance >= 0 ? "bg-teal-600" : "bg-orange-600"}
                        icon={statistics.balance >= 0 ? "📈" : "📉"}
                    />
                </div>

                {/* Transactions List */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Danh sách giao dịch ({transactions.length})
                        </h2>
                    </div>

                    {filteredTransactions.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="text-gray-400 text-6xl mb-4">💳</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {transactions.length === 0 ? 'Chưa có giao dịch nào' : 'Không tìm thấy giao dịch phù hợp'}
                            </h3>
                            <p className="text-gray-500">
                                {transactions.length === 0 ? 'Bắt đầu bằng cách nạp tiền cho admin.' : 'Hãy thử thay đổi bộ lọc để tìm kiếm.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ngày
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Loại
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Mô tả
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Số tiền
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredTransactions.map((transaction) => (
                                        <tr key={transaction._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(transaction.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <TypeBadge type={transaction.type} />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {transaction.description}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <span className={transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'}>
                                                    {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button
                                                    className="text-indigo-600 hover:text-indigo-900 transition-colors"
                                                    title="Xem chi tiết giao dịch"
                                                >
                                                    <FontAwesomeIcon icon={faEye} />
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

            {/* Create Transaction Modal */}
            <CreateTransactionModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onTransactionCreated={handleTransactionCreated}
            />
        </div>
    );
};

// Component hiển thị thống kê
const StatCard = ({ title, value, unit, color, icon }) => (
    <div className={`p-6 rounded-xl shadow-lg text-white ${color}`}>
        <div className="flex justify-between items-center">
            <p className="text-sm font-medium opacity-90">{title}</p>
            <span className="text-2xl">{icon}</span>
        </div>
        <div className="mt-2">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm opacity-90">{unit}</p>
        </div>
    </div>
);

// Component hiển thị loại giao dịch
const TypeBadge = ({ type }) => {
    const typeStyles = {
        expense: "bg-red-100 text-red-800",
        income: "bg-green-100 text-green-800"
    };
    
    const typeLabels = {
        expense: "Chi",
        income: "Thu"
    };

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeStyles[type] || typeStyles.expense}`}>
            {typeLabels[type] || 'Chi'}
        </span>
    );
};

// Filter Section Component
const FilterSection = ({ 
    searchQuery, setSearchQuery, 
    typeFilter, setTypeFilter, 
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
                        placeholder="Mô tả giao dịch..."
                        className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại giao dịch</label>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full py-2 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    >
                        <option value="all">Tất cả</option>
                        <option value="income">Thu</option>
                        <option value="expense">Chi</option>
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

export default UserTransactions;
