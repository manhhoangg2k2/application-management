/**
 * Test script cho User API
 * Chạy: node test_user_api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test data
const testUser = {
    username: 'testuser',
    password: 'password123'
};

const testTransaction = {
    type: 'income',
    amount: 1000000,
    description: 'Test transaction from user'
};

async function login() {
    try {
        console.log('🔐 Đang đăng nhập...');
        const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
        authToken = response.data.token;
        console.log('✅ Đăng nhập thành công');
        return true;
    } catch (error) {
        console.error('❌ Lỗi đăng nhập:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testUserProfile() {
    try {
        console.log('\n👤 Testing User Profile...');
        
        // Get profile
        const getResponse = await axios.get(`${BASE_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ GET Profile:', getResponse.data.data.name);
        
        // Update profile
        const updateResponse = await axios.put(`${BASE_URL}/users/profile`, {
            name: 'Updated Test User'
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ PUT Profile:', updateResponse.data.data.name);
        
    } catch (error) {
        console.error('❌ Profile Error:', error.response?.data?.message || error.message);
    }
}

async function testUserApplications() {
    try {
        console.log('\n📱 Testing User Applications...');
        
        // Get applications
        const response = await axios.get(`${BASE_URL}/users/applications`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ GET Applications:', response.data.count, 'apps');
        
        if (response.data.data.length > 0) {
            const appId = response.data.data[0]._id;
            
            // Get single application
            const singleResponse = await axios.get(`${BASE_URL}/users/applications/${appId}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            console.log('✅ GET Single Application:', singleResponse.data.data.name);
        }
        
    } catch (error) {
        console.error('❌ Applications Error:', error.response?.data?.message || error.message);
    }
}

async function testUserTransactions() {
    try {
        console.log('\n💰 Testing User Transactions...');
        
        // Get transactions
        const getResponse = await axios.get(`${BASE_URL}/users/transactions`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ GET Transactions:', getResponse.data.count, 'transactions');
        
        // Create transaction
        const createResponse = await axios.post(`${BASE_URL}/users/transactions`, testTransaction, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ POST Transaction:', createResponse.data.data._id);
        
        // Get statistics
        const statsResponse = await axios.get(`${BASE_URL}/users/transactions/statistics`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ GET Statistics:', {
            total: statsResponse.data.data.totalTransactions,
            expense: statsResponse.data.data.totalExpense,
            revenue: statsResponse.data.data.totalAppRevenue,
            balance: statsResponse.data.data.balance
        });
        
    } catch (error) {
        console.error('❌ Transactions Error:', error.response?.data?.message || error.message);
    }
}

async function testAdminEndpoints() {
    try {
        console.log('\n🔒 Testing Admin Endpoints (should fail)...');
        
        // Try to access admin endpoint
        await axios.get(`${BASE_URL}/applications`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('❌ Should not access admin endpoints');
        
    } catch (error) {
        if (error.response?.status === 403) {
            console.log('✅ Correctly blocked from admin endpoints');
        } else {
            console.error('❌ Unexpected error:', error.response?.data?.message || error.message);
        }
    }
}

async function runTests() {
    console.log('🚀 Bắt đầu test User API...\n');
    
    // Login first
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('❌ Không thể đăng nhập, dừng test');
        return;
    }
    
    // Run all tests
    await testUserProfile();
    await testUserApplications();
    await testUserTransactions();
    await testAdminEndpoints();
    
    console.log('\n🎉 Hoàn thành test User API!');
}

// Run tests
runTests().catch(console.error);
