import React from 'react';
import Navbar from './Navbar';

const LayoutWithNavbar = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar ở trên - Fixed */}
            <Navbar />
            
            {/* Main content - Thêm padding-top để tránh bị navbar che */}
            <main 
                className="max-w-7xl mx-auto pb-6 px-4 sm:px-6 lg:px-8"
                style={{ paddingTop: '80px' }}
            >
                {children}
            </main>
        </div>
    );
};

export default LayoutWithNavbar;
