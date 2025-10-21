/**
 * Test script cho Transaction Logic
 * Chạy: node test_transaction_logic.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
    username: 'testuser',
    password: 'password123'
};

const testAdmin = {
    username: 'admin',
    password: 'admin123'
};

let userToken = '';
let adminToken = '';

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

async function loginAdmin() {
    try {
        console.log('🔐 Đang đăng nhập Admin...');
        const response = await axios.post(`${BASE_URL}/auth/login`, testAdmin);
        adminToken = response.data.token;
        console.log('✅ Admin đăng nhập thành công');
        return true;
    } catch (error) {
        console.error('❌ Lỗi đăng nhập Admin:', error.response?.data?.message || error.message);
        return false;
    }
}

async function testUserCreateTransaction() {
    try {
        console.log('\n💰 Testing User tạo giao dịch...');
        
        // User tạo giao dịch "Thu" (revenue)
        const userRevenueTransaction = {
            type: 'revenue',
            amount: 1000000,
            description: 'User thu tiền từ app'
        };
        
        const response1 = await axios.post(`${BASE_URL}/users/transactions`, userRevenueTransaction, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        
        console.log('✅ User tạo giao dịch "Thu":', {
            userInput: 'revenue',
            savedInDB: response1.data.data.type,
            category: response1.data.data.category
        });
        
        // User tạo giao dịch "Chi" (expense)
        const userExpenseTransaction = {
            type: 'expense',
            amount: 500000,
            description: 'User chi tiền cho admin'
        };
        
        const response2 = await axios.post(`${BASE_URL}/users/transactions`, userExpenseTransaction, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        
        console.log('✅ User tạo giao dịch "Chi":', {
            userInput: 'expense',
            savedInDB: response2.data.data.type,
            category: response2.data.data.category
        });
        
        return [response1.data.data._id, response2.data.data._id];
        
    } catch (error) {
        console.error('❌ User Create Transaction Error:', error.response?.data?.message || error.message);
        return [];
    }
}

async function testUserViewTransactions() {
    try {
        console.log('\n👀 Testing User xem giao dịch...');
        
        const response = await axios.get(`${BASE_URL}/users/transactions`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        
        console.log('✅ User xem giao dịch:');
        response.data.data.forEach((transaction, index) => {
            console.log(`  Giao dịch ${index + 1}:`, {
                type: transaction.type,
                amount: transaction.amount,
                description: transaction.description
            });
        });
        
    } catch (error) {
        console.error('❌ User View Transactions Error:', error.response?.data?.message || error.message);
    }
}

async function testUserStatistics() {
    try {
        console.log('\n📊 Testing User thống kê...');
        
        const response = await axios.get(`${BASE_URL}/users/transactions/statistics`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        
        console.log('✅ User thống kê:', response.data.data);
        
    } catch (error) {
        console.error('❌ User Statistics Error:', error.response?.data?.message || error.message);
    }
}

async function testAdminViewTransactions() {
    try {
        console.log('\n👀 Testing Admin xem giao dịch...');
        
        const response = await axios.get(`${BASE_URL}/transactions`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        console.log('✅ Admin xem giao dịch:');
        response.data.data.forEach((transaction, index) => {
            console.log(`  Giao dịch ${index + 1}:`, {
                type: transaction.type,
                amount: transaction.amount,
                description: transaction.description,
                userId: transaction.userId.name
            });
        });
        
    } catch (error) {
        console.error('❌ Admin View Transactions Error:', error.response?.data?.message || error.message);
    }
}

async function testAdminStatistics() {
    try {
        console.log('\n📊 Testing Admin thống kê...');
        
        const response = await axios.get(`${BASE_URL}/transactions/statistics`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        console.log('✅ Admin thống kê:', response.data.data);
        
    } catch (error) {
        console.error('❌ Admin Statistics Error:', error.response?.data?.message || error.message);
    }
}

async function testLogicConsistency() {
    try {
        console.log('\n🔍 Testing Logic Consistency...');
        
        // User xem giao dịch của mình
        const userResponse = await axios.get(`${BASE_URL}/users/transactions`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        
        // Admin xem tất cả giao dịch
        const adminResponse = await axios.get(`${BASE_URL}/transactions`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        console.log('✅ Logic Consistency Check:');
        console.log('  User thấy:', userResponse.data.data.length, 'giao dịch');
        console.log('  Admin thấy:', adminResponse.data.data.length, 'giao dịch');
        
        // Kiểm tra logic ngược
        const userTransactions = userResponse.data.data;
        const adminTransactions = adminResponse.data.data.filter(t => t.userId._id === userResponse.data.data[0]?.userId?._id);
        
        if (userTransactions.length > 0 && adminTransactions.length > 0) {
            console.log('  Logic ngược hoạt động đúng:');
            console.log('    User thu -> Admin chi:', 
                userTransactions.some(t => t.type === 'revenue') && 
                adminTransactions.some(t => t.type === 'expense'));
            console.log('    User chi -> Admin thu:', 
                userTransactions.some(t => t.type === 'expense') && 
                adminTransactions.some(t => t.type === 'revenue'));
        }
        
    } catch (error) {
        console.error('❌ Logic Consistency Error:', error.response?.data?.message || error.message);
    }
}

async function runTests() {
    console.log('🚀 Bắt đầu test Transaction Logic...\n');
    
    // Login
    const userLoginSuccess = await loginUser();
    const adminLoginSuccess = await loginAdmin();
    
    if (!userLoginSuccess || !adminLoginSuccess) {
        console.log('❌ Không thể đăng nhập, dừng test');
        return;
    }
    
    // Test User tạo giao dịch
    await testUserCreateTransaction();
    
    // Test User xem giao dịch
    await testUserViewTransactions();
    
    // Test User thống kê
    await testUserStatistics();
    
    // Test Admin xem giao dịch
    await testAdminViewTransactions();
    
    // Test Admin thống kê
    await testAdminStatistics();
    
    // Test Logic Consistency
    await testLogicConsistency();
    
    console.log('\n🎉 Hoàn thành test Transaction Logic!');
    console.log('\n📋 Tóm tắt Logic:');
    console.log('  - User tạo "Thu" -> Lưu DB như "Chi" (Admin chi tiền cho User)');
    console.log('  - User tạo "Chi" -> Lưu DB như "Thu" (Admin thu tiền từ User)');
    console.log('  - User xem: Đảo ngược type để hiển thị đúng');
    console.log('  - Admin xem: Type gốc trong DB');
    console.log('  - Thống kê: Tính theo góc nhìn của từng role');
}

// Run tests
runTests().catch(console.error);
