// client/hooks/useApi.js
import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * Custom hook để tạo ra một wrapper cho hàm fetch, tự động thêm Access Token.
 * Tự động refresh token khi access token hết hạn (401).
 */
export const useApi = () => {
    // Lấy token và các hàm từ Auth Context
    const { tokens, logout, refreshAccessToken } = useAuth();
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    // Hàm thực hiện việc fetch API
    const authFetch = useCallback(async (endpoint, options = {}) => {
        
        // 1. Kiểm tra Access Token
        if (!tokens.accessToken) {
            console.error('API Error: No Access Token found.');
            logout(); // Đăng xuất nếu không có token
            return null;
        }

        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
        };

        const config = {
            ...options,
            headers,
            // Stringify body nếu nó là object
            body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
        };

        // 2. Thực hiện Fetch (Không thêm /auth/ vào endpoint vì đây là API chung)
        try {
            const url = `${API_URL}/${endpoint}`; // Ví dụ: http://localhost:8400/api/applications
            const response = await fetch(url, config);
            
            // 3. Xử lý trạng thái 401 (Unauthorized/Token hết hạn)
            if (response.status === 401) {
                console.warn("Access Token expired. Attempting to refresh...");
                
                // Thử refresh token
                const refreshSuccess = await refreshAccessToken();
                
                if (refreshSuccess) {
                    // Nếu refresh thành công, thử lại request với token mới
                    console.log("Token refreshed successfully. Retrying request...");
                    
                    // Lấy token mới từ localStorage (vì state có thể chưa cập nhật)
                    const storedTokens = localStorage.getItem('authTokens');
                    if (storedTokens) {
                        const { accessToken } = JSON.parse(storedTokens);
                        
                        // Thực hiện lại request với token mới
                        const retryConfig = {
                            ...config,
                            headers: {
                                ...config.headers,
                                'Authorization': `Bearer ${accessToken}`,
                            },
                            body: config.body // Body đã được stringify ở trên
                        };
                        
                        const retryResponse = await fetch(url, retryConfig);
                        
                        if (retryResponse.ok) {
                            const retryData = await retryResponse.json();
                            return retryData;
                        }
                    }
                }
                
                // Nếu refresh thất bại hoặc retry thất bại, đăng xuất
                console.error("Token refresh failed or retry failed. Logging out...");
                toast.error("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
                logout();
                return null;
            }
            
            // Xử lý trạng thái 403 (Forbidden)
            if (response.status === 403) {
                console.warn("Access forbidden. User may not have permission.");
                toast.error("Bạn không có quyền truy cập tài nguyên này.");
                return null;
            }

            // 4. Trả về kết quả JSON
            const data = await response.json();
            
            // Xử lý lỗi từ backend (e.g., success: false)
            if (!response.ok) {
                // Trả về đối tượng Error để component gọi xử lý
                throw new Error(data.message || 'Lỗi không xác định từ máy chủ.');
            }

            return data;

        } catch (error) {
            console.error('Fetch Error:', error);
            // Ném lỗi để component gọi có thể bắt (catch) và hiển thị
            throw error; 
        }
    }, [tokens.accessToken, logout, refreshAccessToken, API_URL]); 

    return authFetch;
};