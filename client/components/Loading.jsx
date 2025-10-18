// client/components/Loading.jsx
import React from 'react';

const LoadingSpinner = ({ message = "Đang tải dữ liệu..." }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center">
                {/* Animation Spinner */}
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
                
                {/* Text Message */}
                <p className="mt-4 text-lg font-medium text-gray-700">{message}</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;