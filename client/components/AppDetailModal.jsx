// client/components/AppDetailModal.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck, faTimes, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';

/**
 * Component Modal để xem chi tiết ứng dụng
 * Hỗ trợ cả Admin và User
 */
const AppDetailModal = ({ app, isOpen, onClose }) => {
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [showAllIapIds, setShowAllIapIds] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');

    console.log('AppDetailModal rendered with props:', { app, isOpen, onClose });

    // Handle ESC key to close modal
    React.useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !app) {
        console.log('AppDetailModal not rendering because:', { isOpen, app: !!app });
        return null;
    }

    // Copy IAP ID to clipboard
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

    // Status badge component
    const StatusBadge = ({ status }) => {
        const statusStyles = {
            requested: "bg-gray-100 text-gray-800",
            in_progress: "bg-blue-100 text-blue-800", 
            testing: "bg-yellow-100 text-yellow-800",
            pending_review: "bg-indigo-100 text-indigo-800",
            approved: "bg-green-100 text-green-800",
            transferred: "bg-teal-100 text-teal-800",
            default: "bg-gray-100 text-gray-800"
        };

        const statusLabels = {
            requested: "Yêu cầu",
            in_progress: "Đang thực hiện",
            testing: "Đang thử nghiệm", 
            pending_review: "Chờ duyệt",
            approved: "Đã duyệt",
            transferred: "Đã chuyển"
        };

        return (
            <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${statusStyles[status] || statusStyles.default}`}>
                {statusLabels[status] || status?.toUpperCase().replace('_', ' ')}
            </span>
        );
    };

    // IAP IDs display component
    const IapIdsDisplay = ({ iapIds }) => {
        if (!iapIds || iapIds.length === 0) {
            return <span className="text-gray-400 text-sm">Chưa có IAP ID</span>;
        }

        const displayIds = showAllIapIds ? iapIds : iapIds.slice(0, 5);
        const hasMore = iapIds.length > 5;

        return (
            <div className="space-y-2">
                {displayIds.map((iapId, index) => (
                    <div key={index} className="flex items-center space-x-2">
                        <span className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-sm font-mono">
                            {iapId}
                        </span>
                        <button
                            onClick={() => copyToClipboard(iapId, index)}
                            className="px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            title="Copy IAP ID"
                        >
                            <FontAwesomeIcon 
                                icon={copiedIndex === index ? faCheck : faCopy} 
                                className={copiedIndex === index ? 'text-green-600' : ''}
                            />
                        </button>
                    </div>
                ))}
                {hasMore && (
                    <button
                        onClick={() => setShowAllIapIds(!showAllIapIds)}
                        className="w-full py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition border border-blue-300 border-dashed"
                    >
                        <FontAwesomeIcon icon={showAllIapIds ? faEyeSlash : faEye} className="mr-2" />
                        {showAllIapIds ? 'Ẩn bớt' : `Xem thêm ${iapIds.length - 5} IAP ID`}
                    </button>
                )}
            </div>
        );
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center p-2 sm:p-4" 
            style={{ 
                position: 'fixed', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0,
                zIndex: 99999
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col relative transform">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-10 shadow-sm">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Chi tiết ứng dụng</h2>
                        <p className="text-sm text-gray-500 mt-1">ID: {app.appServerId}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <StatusBadge status={app.status} />
                        <button 
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="border-b border-gray-200 bg-gray-50">
                    <nav className="flex space-x-1 px-4">
                        {[
                            { id: 'basic', name: 'Thông tin cơ bản' },
                            { id: 'details', name: 'Chi tiết' },
                            { id: 'costs', name: 'Chi phí' },
                            { id: 'notes', name: 'Ghi chú' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors rounded-t-lg ${
                                    activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-600 bg-white'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                                }`}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="h-[400px] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {/* Tab 1: Basic Information */}
                    {activeTab === 'basic' && (
                        <div className="space-y-6">
                            {/* App Information Section */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                    Thông tin Ứng dụng
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Tên ứng dụng</label>
                                            <p className="text-base font-semibold text-gray-900 bg-gray-50 p-3 rounded-lg">{app.name}</p>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Package ID</label>
                                            <p className="text-sm font-mono bg-gray-100 px-3 py-2 rounded-lg border">{app.appId}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                                            <div className="flex items-center">
                                                <StatusBadge status={app.status} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày tạo</label>
                                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">
                                                {new Date(app.createdAt).toLocaleDateString('vi-VN', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Client & Account Information Section */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    Thông tin Khách hàng & Tài khoản
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Khách hàng</label>
                                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                            {app.client?.name || 'N/A'} 
                                            {app.client?.username && (
                                                <span className="text-gray-500 ml-2">({app.client.username})</span>
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tài khoản CHPlay</label>
                                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                                            {app.chplayAccount?.name || 'N/A'}
                                            {app.chplayAccount?.type && (
                                                <span className="text-gray-500 ml-2">({app.chplayAccount.type})</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Information Section */}
                            {(app.dateUploaded || app.linkApp) && (
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                                        Thông tin Bổ sung
                                    </h3>
                                    <div className="space-y-4">
                                        {app.dateUploaded && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày upload</label>
                                                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-lg">
                                                    {new Date(app.dateUploaded).toLocaleDateString('vi-VN', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        )}

                                        {app.linkApp && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Link ứng dụng</label>
                                                <a 
                                                    href={app.linkApp} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 text-sm underline bg-blue-50 p-2 rounded-lg block"
                                                >
                                                    {app.linkApp}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Details */}
                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            {/* Description Section */}
                            {app.description && (
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                                        Mô tả Ứng dụng
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <p className="text-sm text-gray-900 leading-relaxed">
                                            {app.description}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* IAP IDs Section */}
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                                    IAP IDs (In-App Purchase)
                                </h3>
                                <IapIdsDisplay iapIds={app.iapIds} />
                            </div>

                            {/* Asset Links Section */}
                            {app.assetLinks && Object.keys(app.assetLinks).length > 0 && (
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <div className="w-2 h-2 bg-teal-500 rounded-full mr-2"></div>
                                        Asset Links
                                    </h3>
                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono">
                                            {JSON.stringify(app.assetLinks, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}

                            {/* Empty state for details */}
                            {!app.description && (!app.iapIds || app.iapIds.length === 0) && (!app.assetLinks || Object.keys(app.assetLinks).length === 0) && (
                                <div className="text-center py-12 text-gray-500">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-medium">Chưa có thông tin chi tiết</p>
                                    <p className="text-sm">Thông tin chi tiết sẽ được hiển thị ở đây khi có dữ liệu</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 3: Costs */}
                    {activeTab === 'costs' && (
                        <div className="space-y-6">
                            {(app.costDevelopment > 0 || app.costTesting > 0 || app.costOther > 0) ? (
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                                        Thông tin Chi phí
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {app.costDevelopment > 0 && (
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                <div className="flex items-center mb-2">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                                    <label className="text-sm font-medium text-gray-700">Chi phí Phát triển</label>
                                                </div>
                                                <p className="text-xl font-bold text-blue-700">
                                                    {formatCurrency(app.costDevelopment)}
                                                </p>
                                            </div>
                                        )}
                                        {app.costTesting > 0 && (
                                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                                <div className="flex items-center mb-2">
                                                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                                                    <label className="text-sm font-medium text-gray-700">Chi phí Thử nghiệm</label>
                                                </div>
                                                <p className="text-xl font-bold text-yellow-700">
                                                    {formatCurrency(app.costTesting)}
                                                </p>
                                            </div>
                                        )}
                                        {app.costOther > 0 && (
                                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                                <div className="flex items-center mb-2">
                                                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                                                    <label className="text-sm font-medium text-gray-700">Chi phí Khác</label>
                                                </div>
                                                <p className="text-xl font-bold text-purple-700">
                                                    {formatCurrency(app.costOther)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Total Cost */}
                                    <div className="mt-6 pt-4 border-t border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-semibold text-gray-900">Tổng chi phí:</span>
                                            <span className="text-2xl font-bold text-gray-900">
                                                {formatCurrency((app.costDevelopment || 0) + (app.costTesting || 0) + (app.costOther || 0))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-medium">Chưa có thông tin chi phí</p>
                                    <p className="text-sm">Thông tin chi phí sẽ được hiển thị ở đây khi có dữ liệu</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 4: Notes */}
                    {activeTab === 'notes' && (
                        <div className="space-y-6">
                            {app.notes ? (
                                <div className="bg-white border border-gray-200 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                                        Ghi chú
                                    </h3>
                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                        <p className="text-sm text-gray-900 leading-relaxed">
                                            {app.notes}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-medium">Chưa có ghi chú</p>
                                    <p className="text-sm">Ghi chú sẽ được hiển thị ở đây khi có dữ liệu</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0 shadow-sm">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppDetailModal;
