import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faQrcode, faSpinner, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const CreateTransactionModal = ({ isOpen, onClose, onTransactionCreated }) => {
    const { user } = useAuth();
    const authFetch = useApi();
    
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [transaction, setTransaction] = useState(null);
    const [step, setStep] = useState(1); // 1: Nhập số tiền, 2: Hiển thị QR, 3: Hoàn thành
    const [errors, setErrors] = useState({});

    // Validation cho số tiền
    const validateAmount = (value) => {
        const errors = {};
        
        if (!value || value.trim() === '') {
            errors.amount = 'Vui lòng nhập số tiền';
            return errors;
        }

        const numValue = parseFloat(value.replace(/[^\d]/g, ''));
        
        if (isNaN(numValue) || numValue <= 0) {
            errors.amount = 'Số tiền phải lớn hơn 0';
            return errors;
        }

        if (numValue < 10000) {
            errors.amount = 'Số tiền tối thiểu là 10,000 VND';
            return errors;
        }

        if (numValue > 100000000) {
            errors.amount = 'Số tiền tối đa là 100,000,000 VND';
            return errors;
        }

        return {};
    };

    // Format số tiền khi nhập
    const formatAmountInput = (value) => {
        // Chỉ giữ lại số
        const numbers = value.replace(/[^\d]/g, '');
        
        if (numbers === '') return '';
        
        // Format với dấu phẩy
        const formatted = parseInt(numbers).toLocaleString('vi-VN');
        return formatted;
    };

    // Parse số tiền từ format
    const parseAmount = (formattedValue) => {
        return parseInt(formattedValue.replace(/[^\d]/g, ''));
    };

    const handleAmountChange = (e) => {
        const value = e.target.value;
        const formatted = formatAmountInput(value);
        setAmount(formatted);
        
        // Clear error khi user đang nhập
        if (errors.amount) {
            setErrors({ ...errors, amount: '' });
        }
    };

    const handleCreateQR = async () => {
        const amountErrors = validateAmount(amount);
        
        if (Object.keys(amountErrors).length > 0) {
            setErrors(amountErrors);
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const parsedAmount = parseAmount(amount);
            const description = `Thanh toán dịch vụ - ${user.name || user.username}`;

            const result = await authFetch('transactions/create-payment-qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: parsedAmount,
                    description: description
                })
            });

            if (result && result.success) {
                setTransaction(result.data.transaction);
                setQrData(result.data.qrData);
                setStep(2);
                toast.success('Tạo QR code thành công!');
            } else {
                throw new Error(result?.message || 'Không thể tạo QR code');
            }
        } catch (error) {
            console.error('Lỗi tạo QR code:', error);
            toast.error(error.message || 'Có lỗi xảy ra khi tạo QR code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setAmount('');
        setQrData(null);
        setTransaction(null);
        setStep(1);
        setErrors({});
        onClose();
    };

    const handlePaymentComplete = () => {
        setStep(3);
        toast.success('Giao dịch đã được tạo thành công! Đang chờ xác nhận thanh toán...');
        if (onTransactionCreated) {
            onTransactionCreated();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {step === 1 && 'Tạo giao dịch thanh toán'}
                        {step === 2 && 'Quét mã QR để thanh toán'}
                        {step === 3 && 'Đang chờ xác nhận'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Step 1: Nhập số tiền */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Số tiền thanh toán (VND)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={amount}
                                        onChange={handleAmountChange}
                                        placeholder="Nhập số tiền..."
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg ${
                                            errors.amount ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        disabled={isLoading}
                                    />
                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                                        VND
                                    </span>
                                </div>
                                {errors.amount && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center">
                                        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
                                        {errors.amount}
                                    </p>
                                )}
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <FontAwesomeIcon icon={faQrcode} className="text-blue-500 mt-1 mr-3" />
                                    <div>
                                        <h4 className="font-medium text-blue-800">Thông tin thanh toán</h4>
                                        <p className="text-sm text-blue-600 mt-1">
                                            Sau khi nhập số tiền, hệ thống sẽ tạo mã QR để bạn quét và thanh toán.
                                            Nội dung chuyển khoản sẽ chứa mã xác thực để hệ thống tự động cập nhật trạng thái.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                    disabled={isLoading}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleCreateQR}
                                    disabled={isLoading || !amount}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        'Tạo QR Code'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Hiển thị QR Code */}
                    {step === 2 && qrData && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-gray-800 mb-2">
                                    Quét mã QR để thanh toán
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Số tiền: <span className="font-semibold text-green-600">
                                        {parseInt(qrData.amount).toLocaleString('vi-VN')} VND
                                    </span>
                                </p>
                            </div>

                            {/* QR Code */}
                            <div className="flex justify-center">
                                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                                    <img
                                        src={`https://qr.sepay.vn/img?acc=0372782087&bank=MB&amount=${qrData.amount}&des=${encodeURIComponent(qrData.content)}`}
                                        alt="QR Code thanh toán"
                                        className="w-64 h-64"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    <div className="w-64 h-64 bg-gray-100 flex items-center justify-center text-gray-500 hidden">
                                        <div className="text-center">
                                            <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="mb-2" />
                                            <p>Không thể tải QR Code</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin giao dịch */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Mã giao dịch:</span>
                                    <span className="text-sm font-mono text-gray-800">
                                        {transaction._id.slice(-8).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Mã xác thực:</span>
                                    <span className="text-sm font-mono text-blue-600 font-semibold">
                                        {qrData.verificationCode}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Nội dung chuyển khoản:</span>
                                    <span className="text-sm text-gray-800 text-right max-w-48">
                                        {qrData.content}
                                    </span>
                                </div>
                            </div>

                            {/* Hướng dẫn */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h4 className="font-medium text-yellow-800 mb-2">Hướng dẫn thanh toán:</h4>
                                <ol className="text-sm text-yellow-700 space-y-1">
                                    <li>1. Mở ứng dụng ngân hàng trên điện thoại</li>
                                    <li>2. Quét mã QR ở trên</li>
                                    <li>3. Kiểm tra số tiền và nội dung chuyển khoản</li>
                                    <li>4. Xác nhận thanh toán</li>
                                    <li>5. Hệ thống sẽ tự động cập nhật trạng thái giao dịch</li>
                                </ol>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Quay lại
                                </button>
                                <button
                                    onClick={handlePaymentComplete}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                                >
                                    <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                                    Đã chuyển khoản
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Đợi xác nhận */}
                    {step === 3 && (
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                <FontAwesomeIcon icon={faSpinner} className="text-blue-500 text-6x animate-spin" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-800 mb-2">
                                    Đang chờ xác nhận thanh toán
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Giao dịch của bạn đã được tạo với trạng thái <span className="font-semibold text-orange-600">PENDING</span>.
                                    Hệ thống đang chờ SePay xác nhận thanh toán.
                                </p>
                                
                                {/* Thông tin giao dịch */}
                                {transaction && (
                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
                                        <h4 className="font-medium text-orange-800 mb-2">Thông tin giao dịch:</h4>
                                        <div className="space-y-1 text-sm text-orange-700">
                                            <div className="flex justify-between">
                                                <span>Mã giao dịch:</span>
                                                <span className="font-mono">{transaction._id.slice(-8).toUpperCase()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Số tiền:</span>
                                                <span className="font-semibold">{parseInt(transaction.amount).toLocaleString('vi-VN')} VND</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Trạng thái:</span>
                                                <span className="font-semibold text-orange-600">PENDING</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                                    <h4 className="font-medium text-blue-800 mb-2">Quá trình xác nhận:</h4>
                                    <ol className="text-sm text-blue-700 space-y-1 text-left">
                                        <li>1. ✅ Bạn đã chuyển khoản thành công</li>
                                        <li>2. ⏳ SePay đang xử lý và gửi webhook</li>
                                        <li>3. ⏳ Hệ thống sẽ tự động cập nhật trạng thái thành COMPLETED</li>
                                        <li>4. ⏳ Bạn sẽ thấy giao dịch trong danh sách với trạng thái mới</li>
                                    </ol>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Đóng và kiểm tra danh sách giao dịch
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateTransactionModal;
