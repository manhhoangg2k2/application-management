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

    console.log('AppDetailModal rendered with props:', { app, isOpen, onClose });

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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Chi tiết ứng dụng</h2>
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

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên ứng dụng</label>
                                <p className="text-lg font-semibold text-gray-900">{app.name}</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Package ID</label>
                                <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg">{app.appId}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                                <p className="text-sm text-gray-900">
                                    {app.client?.name || 'N/A'} 
                                    {app.client?.username && (
                                        <span className="text-gray-500 ml-2">({app.client.username})</span>
                                    )}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tài khoản CHPlay</label>
                                <p className="text-sm text-gray-900">
                                    {app.chplayAccount?.name || 'N/A'}
                                    {app.chplayAccount?.type && (
                                        <span className="text-gray-500 ml-2">({app.chplayAccount.type})</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                <StatusBadge status={app.status} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo</label>
                                <p className="text-sm text-gray-900">
                                    {new Date(app.createdAt).toLocaleDateString('vi-VN', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>

                            {app.dateUploaded && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày upload</label>
                                    <p className="text-sm text-gray-900">
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Link ứng dụng</label>
                                    <a 
                                        href={app.linkApp} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                                    >
                                        {app.linkApp}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {app.description && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                                {app.description}
                            </p>
                        </div>
                    )}

                    {/* IAP IDs */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">IAP IDs (In-App Purchase)</label>
                        <IapIdsDisplay iapIds={app.iapIds} />
                    </div>

                    {/* Cost Information (Admin only) */}
                    {(app.costDevelopment > 0 || app.costTesting > 0 || app.costOther > 0) && (
                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                            <h4 className="font-bold text-indigo-700 mb-3">Thông tin Chi phí</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {app.costDevelopment > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Chi phí Phát triển</label>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {formatCurrency(app.costDevelopment)}
                                        </p>
                                    </div>
                                )}
                                {app.costTesting > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Chi phí Thử nghiệm</label>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {formatCurrency(app.costTesting)}
                                        </p>
                                    </div>
                                )}
                                {app.costOther > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Chi phí Khác</label>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {formatCurrency(app.costOther)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {app.notes && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                            <p className="text-sm text-gray-900 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                {app.notes}
                            </p>
                        </div>
                    )}

                    {/* Asset Links */}
                    {app.assetLinks && Object.keys(app.assetLinks).length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Asset Links</label>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                                    {JSON.stringify(app.assetLinks, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
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
