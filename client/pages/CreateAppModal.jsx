// client/pages/CreateAppModal.jsx (Đã cập nhật: Hỗ trợ cả Admin và Client)
import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { formatCurrency, parseCurrency, formatNumber } from '../utils/currency';

/**
 * Component Modal để tạo Ứng dụng mới (Hỗ trợ cả Admin và Client).
 * Admin phải chọn Client ID.
 */
const CreateAppModal = ({ isOpen, onClose, onAppCreated }) => {
    const { user, API_URL } = useAuth();
    const authFetch = useApi();
    
    // Kiểm tra vai trò của người dùng hiện tại
    const isAdmin = user?.role === 'admin';

    // Trạng thái Form
    const [formData, setFormData] = useState({
        name: '',
        appId: '',
        description: '',
        notes: '',
        costDevelopment: 0, 
        costTesting: 0,
        status: 'draft',
        iapIds: ['', '', '', '', ''] // Ít nhất 5 IAP ID
    });
    const [chplayAccounts, setChplayAccounts] = useState([]);
    const [clients, setClients] = useState([]); // Dành cho Admin
    
    const [selectedClient, setSelectedClient] = useState(isAdmin ? '' : user?._id || '');
    const [selectedAccount, setSelectedAccount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 1. Tải danh sách Clients và CHPlay Accounts (chỉ Admin mới cần)
    const fetchDataForAdmin = useCallback(async () => {
        try {
            // Tải danh sách Users (Clients) và CHPlay Accounts cùng lúc
            const [chplayRes, clientRes] = await Promise.all([
                authFetch('chplay-accounts', { method: 'GET' }),
                authFetch('users?role=user', { method: 'GET' })
            ]);

            if (chplayRes?.success) {
                setChplayAccounts(chplayRes.data || []);
                if (chplayRes.data?.length > 0) setSelectedAccount(chplayRes.data[0]._id);
            } else {
                toast.error("Lỗi khi tải danh sách tài khoản CHPlay");
            }

            if (clientRes?.success) {
                setClients(clientRes.data || []);
                if (clientRes.data?.length > 0) setSelectedClient(clientRes.data[0]._id);
            } else {
                toast.error("Lỗi khi tải danh sách khách hàng");
            }

        } catch (error) {
            toast.error("Lỗi khi tải dữ liệu phụ trợ (Clients/Accounts).");
            console.error(error);
        }
    }, [authFetch]);

    // 2. Tải dữ liệu khi modal mở
    useEffect(() => {
        if (isOpen) {
            if (isAdmin) {
                fetchDataForAdmin();
            } else {
                // Client chỉ cần tải CHPlay Accounts
                const fetchChplayAccounts = async () => {
                    try {
                        const chplayRes = await authFetch('chplay-accounts', { method: 'GET' });
                        if (chplayRes?.success) {
                            setChplayAccounts(chplayRes.data || []);
                            if (chplayRes.data?.length > 0) setSelectedAccount(chplayRes.data[0]._id);
                        }
                    } catch (error) {
                        toast.error("Lỗi khi tải danh sách tài khoản CHPlay");
                    }
                };
                fetchChplayAccounts();
            }
            // Reset form
            setFormData({ 
                name: '', 
                appId: '', 
                description: '', 
                notes: '', 
                costDevelopment: 0, 
                costTesting: 0,
                status: 'draft',
                iapIds: ['', '', '', '', '']
            });
        }
    }, [isOpen, isAdmin, fetchDataForAdmin, authFetch]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? parseFloat(value) || 0 : value 
        }));
    };

    // Xử lý thay đổi IAP ID
    const handleIapIdChange = (index, value) => {
        setFormData(prev => ({
            ...prev,
            iapIds: prev.iapIds.map((id, i) => i === index ? value : id)
        }));
    };

    // Thêm IAP ID mới
    const addIapId = () => {
        setFormData(prev => ({
            ...prev,
            iapIds: [...prev.iapIds, '']
        }));
    };

    // Xóa IAP ID
    const removeIapId = (index) => {
        if (formData.iapIds.length > 5) { // Giữ tối thiểu 5 IAP ID
            setFormData(prev => ({
                ...prev,
                iapIds: prev.iapIds.filter((_, i) => i !== index)
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading || !selectedAccount || !selectedClient) return;

        // Kiểm tra IAP IDs (ít nhất 5 IAP ID không rỗng)
        const validIapIds = formData.iapIds.filter(id => id.trim() !== '');
        if (validIapIds.length < 5) {
            toast.error("Vui lòng nhập ít nhất 5 IAP ID");
            return;
        }

        setIsLoading(true);
        toast.dismiss();

        const finalData = {
            ...formData,
            iapIds: validIapIds, // Chỉ gửi các IAP ID hợp lệ
            client: selectedClient, // ID Client đã chọn (Admin) hoặc tự động gán (Client)
            chplayAccount: selectedAccount, 
            status: formData.status, // Sử dụng status từ form
        };

        try {
            const result = await authFetch('applications', {
                method: 'POST',
                body: finalData
            });

            if (result && result.success) {
                toast.success(`Ứng dụng "${finalData.name}" đã được tạo thành công!`);
                onAppCreated(); 
                onClose();
            } else {
                throw new Error(result?.message || 'Lỗi không xác định khi tạo App.');
            }

        } catch (error) {
            toast.error(error.message || 'Lỗi kết nối khi gửi yêu cầu.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    // Xác định các trường cần thiết cho Admin
    const showCostFields = isAdmin;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl transform scale-100 transition-transform duration-300 max-h-[90vh] overflow-y-auto">
                
                {/* Header Modal */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-indigo-700">
                        {isAdmin ? 'Tạo Ứng Dụng (Admin)' : 'Đề Xuất Ứng Dụng Mới'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">
                        &times;
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Tên App và Package ID */}
                        <InputField label="Tên Ứng Dụng (Hiển thị)" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} placeholder="Ví dụ: Task Manager Pro"/>
                        <InputField label="Package ID (ID Độc nhất)" name="appId" value={formData.appId} onChange={handleChange} required disabled={isLoading} placeholder="Ví dụ: com.tencongty.tenapp"/>
                        
                        {/* 2. Chọn Client (Chỉ Admin) */}
                        {isAdmin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng (Client)</label>
                                <select
                                    value={selectedClient}
                                    onChange={(e) => setSelectedClient(e.target.value)}
                                    required
                                    disabled={isLoading || clients.length === 0}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-inner focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                >
                                    <option value="" disabled>Chọn Khách hàng</option>
                                    {clients.map(client => (
                                        <option key={client._id} value={client._id}>
                                            {client.name} ({client.username})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* 3. Chọn CHPlay Account */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tài khoản CHPlay Sử dụng</label>
                            <select
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                required
                                disabled={isLoading || chplayAccounts.length === 0}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-inner focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                            >
                                <option value="" disabled>Chọn một tài khoản</option>
                                {chplayAccounts.map(account => (
                                    <option key={account._id} value={account._id}>{account.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* 4. Chọn trạng thái App (chỉ Admin) */}
                        {isAdmin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái App</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-inner focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                >
                                    <option value="draft">Draft (Bản nháp)</option>
                                    <option value="testing">Testing (Đang thử nghiệm)</option>
                                    <option value="waiting_for_review">Waiting for Review (Chờ duyệt)</option>
                                    <option value="approved">Approved (Đã duyệt)</option>
                                    <option value="suspended">Suspended (Tạm dừng)</option>
                                    <option value="finished">Finished (Hoàn thành)</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <TextAreaField label="Mô tả Ứng dụng" name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả ngắn gọn về chức năng của ứng dụng..."/>
                    
                    {/* IAP IDs Section */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-blue-700">IAP IDs (In-App Purchase)</h4>
                            <span className="text-sm text-blue-600">Tối thiểu 5 IAP ID</span>
                        </div>
                        <div className="space-y-2">
                            {formData.iapIds.map((iapId, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={iapId}
                                        onChange={(e) => handleIapIdChange(index, e.target.value)}
                                        placeholder={`IAP ID ${index + 1} (Ví dụ: premium_upgrade_${index + 1})`}
                                        disabled={isLoading}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                                    />
                                    {formData.iapIds.length > 5 && (
                                        <button
                                            type="button"
                                            onClick={() => removeIapId(index)}
                                            disabled={isLoading}
                                            className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addIapId}
                                disabled={isLoading}
                                className="w-full py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition border border-blue-300 border-dashed"
                            >
                                + Thêm IAP ID
                            </button>
                        </div>
                    </div>
                    
                    {/* 4. Trường nhập Chi phí (Chỉ Admin) */}
                    {showCostFields && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                             <h4 className="md:col-span-2 font-bold text-indigo-700">Thông tin Chi phí (Admin nhập)</h4>
                            <CurrencyField label="Chi phí Phát triển" name="costDevelopment" value={formData.costDevelopment} onChange={handleChange} required disabled={isLoading} placeholder="65,000,000"/>
                            <CurrencyField label="Chi phí Thử nghiệm" name="costTesting" value={formData.costTesting} onChange={handleChange} required disabled={isLoading} placeholder="8,000,000"/>
                         </div>
                    )}
                    
                    <TextAreaField label="Ghi chú (Nội bộ)" name="notes" value={formData.notes} onChange={handleChange} placeholder="Ghi chú thêm cho đội phát triển/Admin..."/>
                    
                    {/* Footer / Action */}
                    <div className="pt-4 flex justify-end space-x-3">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={isLoading}
                            className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition"
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit" 
                            disabled={isLoading || !selectedAccount || !selectedClient}
                            className={`px-6 py-2 text-white font-semibold rounded-xl transition ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'}`}
                        >
                            {isLoading ? 'Đang gửi...' : 'Tạo Ứng Dụng'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Component Phụ: Input Field (Chỉnh sửa để hỗ trợ type number) ---
const InputField = ({ label, name, value, onChange, placeholder, required, disabled, type = 'text' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            id={name}
            name={name}
            type={type}
            required={required}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-inner placeholder-gray-400 text-gray-800 focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
    </div>
);

// --- Component Phụ: Currency Field ---
const CurrencyField = ({ label, name, value, onChange, placeholder, required, disabled }) => {

    // Xử lý khi người dùng nhập
    const handleInputChange = (e) => {
        const inputValue = e.target.value;
        const numericValue = parseCurrency(inputValue);
        
        // Gọi onChange với giá trị số
        onChange({
            target: {
                name: name,
                value: numericValue
            }
        });
    };

    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <input
                    id={name}
                    name={name}
                    type="text"
                    required={required}
                    value={formatNumber(value)}
                    onChange={handleInputChange}
                    placeholder={placeholder || "0"}
                    disabled={disabled}
                    className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-xl shadow-inner placeholder-gray-400 text-gray-800 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 text-sm font-medium">đ</span>
                </div>
            </div>
        </div>
    );
};

// --- Component Phụ: Text Area Field ---
const TextAreaField = ({ label, name, value, onChange, placeholder, disabled }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
        </label>
        <textarea
            id={name}
            name={name}
            rows="3"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-inner placeholder-gray-400 text-gray-800 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
        ></textarea>
    </div>
);

export default CreateAppModal;