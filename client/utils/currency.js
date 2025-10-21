/**
 * Utility functions for currency formatting
 */

/**
 * Format currency to Vietnamese Dong (VND)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(0);
    }
    
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(amount);
};

/**
 * Parse currency string to number
 * @param {string} formattedValue - Formatted currency string
 * @returns {number} Numeric value
 */
export const parseCurrency = (formattedValue) => {
    if (!formattedValue) return 0;
    
    // Remove currency symbols and spaces
    const cleanValue = formattedValue
        .replace(/[₫\s]/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '');
    
    const numericValue = parseFloat(cleanValue);
    return isNaN(numericValue) ? 0 : numericValue;
};

/**
 * Format number with thousand separators (for input fields)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '0';
    }
    
    return new Intl.NumberFormat('vi-VN').format(amount);
};
