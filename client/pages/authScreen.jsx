// client/pages/AuthScreen.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext'; 

const AuthContainer = () => {
    const { login, isLoading: isAuthLoading, API_URL } = useAuth();
    
    const [isLoginView, setIsLoginView] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null); 

    const toggleView = useCallback(() => {
        setIsLoginView(prev => !prev);
        setMessage(null); 
    }, []);

    const commonFormProps = useMemo(() => ({
        toggleView,
        setIsLoading,
        setMessage,
        isLoading: isLoading || isAuthLoading, 
        API_URL, 
        login 
    }), [toggleView, setIsLoading, setMessage, isLoading, isAuthLoading, API_URL, login]);
    
    const isError = message && !message.startsWith('Đăng ký thành công');

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white shadow-2xl shadow-indigo-500/30 rounded-3xl p-8 sm:p-10 transition-all duration-300">
                
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2 text-center">
                    {isLoginView ? 'Chào Mừng Trở Lại' : 'Tạo Tài Khoản Admin'}
                </h1>
                <p className="text-center text-sm sm:text-base text-gray-500 mb-8">
                    {isLoginView 
                        ? 'Đăng nhập để quản lý hệ thống.' 
                        : 'Đăng ký Admin (Chỉ thực hiện lần đầu tiên).'}
                </p>

                {message && (
                    <div 
                        className={`border-l-4 p-4 mb-8 rounded-lg ${isError ? 'bg-red-100 border-red-500 text-red-700' : 'bg-green-100 border-green-500 text-green-700'}`} 
                        role="alert"
                    >
                        <p className="font-bold">{isError ? 'Lỗi:' : 'Thành công:'}</p>
                        <p className="text-sm mt-1">{message}</p>
                    </div>
                )}

                {isLoginView ? (
                    <LoginForm {...commonFormProps} />
                ) : (
                    <RegisterForm {...commonFormProps} />
                )}

                <div className="mt-8 text-center">
                    <button
                        onClick={toggleView}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition duration-150 focus:outline-none"
                        disabled={commonFormProps.isLoading}
                    >
                        {isLoginView 
                            ? 'Chưa có tài khoản Admin? Đăng ký ngay!' 
                            : 'Đã có tài khoản? Quay lại Đăng nhập.'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Component Form Đăng Nhập ---
const LoginForm = ({ setIsLoading, setMessage, isLoading, API_URL, login }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return;

        setMessage(null);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            
            const data = await response.json();

            if (data.success) {
                login(data.accessToken, data.refreshToken, data.user);
            } else {
                setMessage(data.message || 'Đăng nhập thất bại.');
            }
        } catch (err) {
            console.error('Lỗi kết nối:', err);
            setMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra API_URL và cổng 8400.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <InputField id="login-username" label="Tên Đăng Nhập Test 1" type="text" value={username} onChange={setUsername} placeholder="Nhập tên đăng nhập" disabled={isLoading}/>
            <InputField id="login-password" label="Mật Khẩu" type="password" value={password} onChange={setPassword} placeholder="Nhập mật khẩu" disabled={isLoading}/>
            <SubmitButton isLoading={isLoading}>{isLoading ? 'Đang Đăng Nhập...' : 'Đăng Nhập'}</SubmitButton>
        </form>
    );
};

// --- Component Form Đăng Ký ---
const RegisterForm = ({ toggleView, setIsLoading, setMessage, isLoading, API_URL }) => {
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) return;

        if (password !== confirmPassword) {
            setMessage('Mật khẩu và xác nhận mật khẩu không khớp.');
            return;
        }

        setMessage(null);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/register-admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, name, password }),
            });

            const data = await response.json();
            
            if (data.success) {
                setMessage('Đăng ký thành công! Vui lòng đăng nhập.');
                setTimeout(toggleView, 1500); 
            } else {
                setMessage(data.message || 'Đăng ký thất bại.');
            }
        } catch (err) {
            console.error('Lỗi kết nối:', err);
            setMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra API_URL và cổng 8400.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <InputField id="register-name" label="Họ Tên" type="text" value={name} onChange={setName} placeholder="Nhập họ tên đầy đủ" disabled={isLoading}/>
            <InputField id="register-username" label="Tên Đăng Nhập" type="text" value={username} onChange={setUsername} placeholder="Tên đăng nhập bạn muốn" disabled={isLoading}/>
            <InputField id="register-password" label="Mật Khẩu" type="password" value={password} onChange={setPassword} placeholder="Tạo mật khẩu mạnh" disabled={isLoading}/>
            <InputField id="confirm-password" label="Xác Nhận Mật Khẩu" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Nhập lại mật khẩu" disabled={isLoading}/>
            <SubmitButton isLoading={isLoading}>{isLoading ? 'Đang Xử Lý...' : 'Đăng Ký Hoàn Tất'}</SubmitButton>
        </form>
    );
};

// --- Component phụ: Trường nhập liệu tùy chỉnh ---
const InputField = ({ id, label, type, value, onChange, placeholder, disabled }) => (
    <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      id={id}
      type={type}
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`
        appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-inner 
        placeholder-gray-400 text-gray-800 transition duration-150 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
        sm:text-base
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-indigo-400'}
      `}
    />
  </div>
);

// --- Component phụ: Nút gửi (Submit) ---
const SubmitButton = ({ children, isLoading }) => (
    <button
    type="submit"
    disabled={isLoading}
    className={`
      w-full flex justify-center py-3 px-6 border border-transparent rounded-xl shadow-lg 
      text-base font-bold text-white transition duration-300 ease-in-out transform 
      ${isLoading 
        ? 'bg-gray-400 cursor-not-allowed' 
        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50 hover:scale-[1.01] active:scale-[0.99]'}
    `}
  >
    {children}
  </button>
);


export default AuthContainer;