/**
 * Test script cho Transaction API
 * Chạy: node test_transaction_api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
    username: 'testuser',
    password: 'password123'
};

let userToken = '';

async function loginUser() {
    try {
        console.log('🔐 Đang đăng nhập User...');
        const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
        userToken = response.data.token;
        console.log('✅ User đăng nhập thành công');
        return true;
    } catch (error) {
        console.error('❌ Lỗi đăng nhập User:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testCreateTransaction() {
    try {
        console.log('\n💰 Testing tạo giao dịch...');
        
        const transactionData = {
            type: 'revenue',
            amount: 1000000,
            description: 'Test transaction from API'
        };
        
        console.log('📤 Gửi dữ liệu:', transactionData);
        
        const response = await axios.post(`${BASE_URL}/users/transactions`, transactionData, {
            headers: { 
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Tạo giao dịch thành công:', {
            id: response.data.data._id,
            type: response.data.data.type,
            amount: response.data.data.amount,
            description: response.data.data.description
        });
        
        return response.data.data._id;
        
    } catch (error) {
        console.error('❌ Lỗi tạo giao dịch:', error.response?.data?.message || error.message);
        if (error.response?.data) {
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

async function testGetTransactions() {
    try {
        console.log('\n👀 Testing lấy danh sách giao dịch...');
        
        const response = await axios.get(`${BASE_URL}/users/transactions`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        
        console.log('✅ Lấy danh sách giao dịch thành công:', {
            count: response.data.count,
            total: response.data.total,
            page: response.data.page,
            totalPages: response.data.totalPages
        });
        
        if (response.data.data.length > 0) {
            console.log('📋 Giao dịch đầu tiên:', {
                type: response.data.data[0].type,
                amount: response.data.data[0].amount,
                description: response.data.data[0].description
            });
        }
        
    } catch (error) {
        console.error('❌ Lỗi lấy danh sách giao dịch:', error.response?.data?.message || error.message);
    }
}

async function testGetStatistics() {
    try {
        console.log('\n📊 Testing thống kê giao dịch...');
        
        const response = await axios.get(`${BASE_URL}/users/transactions/statistics`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        
        console.log('✅ Lấy thống kê thành công:', response.data.data);
        
    } catch (error) {
        console.error('❌ Lỗi lấy thống kê:', error.response?.data?.message || error.message);
    }
}

async function testValidation() {
    try {
        console.log('\n🔍 Testing validation...');
        
        // Test với amount = 0
        try {
            await axios.post(`${BASE_URL}/users/transactions`, {
                type: 'revenue',
                amount: 0,
                description: 'Test with amount 0'
            }, {
                headers: { 
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('❌ Validation failed: Should reject amount = 0');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Validation passed: Rejected amount = 0');
            } else {
                console.log('❌ Unexpected error:', error.response?.data?.message);
            }
        }
        
        // Test với description rỗng
        try {
            await axios.post(`${BASE_URL}/users/transactions`, {
                type: 'revenue',
                amount: 1000000,
                description: ''
            }, {
                headers: { 
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('❌ Validation failed: Should reject empty description');
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('✅ Validation passed: Rejected empty description');
            } else {
                console.log('❌ Unexpected error:', error.response?.data?.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Validation test error:', error.message);
    }
}

async function runTests() {
    console.log('🚀 Bắt đầu test Transaction API...\n');
    
    // Login
    const loginSuccess = await loginUser();
    if (!loginSuccess) {
        console.log('❌ Không thể đăng nhập, dừng test');
        return;
    }
    
    // Test tạo giao dịch
    await testCreateTransaction();
    
    // Test lấy danh sách giao dịch
    await testGetTransactions();
    
    // Test thống kê
    await testGetStatistics();
    
    // Test validation
    await testValidation();
    
    console.log('\n🎉 Hoàn thành test Transaction API!');
}

// Run tests
runTests().catch(console.error);
