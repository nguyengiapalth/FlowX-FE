import React, { useState } from 'react';
import { useNavigationActions } from '../utils/navigation.utils';
import authService from '../services/auth.service';
import { useAuthStore } from '../stores/auth-store';
import { useProfileStore } from '../stores/profile-store';
import { useDepartmentStore } from '../stores/department-store';
import { useProjectStore } from '../stores/project-store';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton.tsx';
import { ForgotPasswordModal } from '../components/auth/ForgotPasswordModal.tsx';
import type { AuthenticationRequest } from '../types/auth';
import { 
  AlertCircle, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2 
} from 'lucide-react';

interface FormErrors {
    email?: string;
    password?: string;
    general?: string;
}

export const LoginPage: React.FC = () => {
    const [formData, setFormData] = useState<AuthenticationRequest>({
        email: '',
        password: ''
    });
    
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    
    const { navigate } = useNavigationActions();
    const { setAccessToken, fetchUserRoles, isGlobalManager } = useAuthStore();
    const { fetchProfile } = useProfileStore();
    const { fetchDepartments } = useDepartmentStore();
    const { fetchMyProjects } = useProjectStore();

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        
        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email là bắt buộc';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }
        
        // Password validation
        if (!formData.password) {
            newErrors.password = 'Mật khẩu là bắt buộc';
        } else if (formData.password.length < 1) {
            newErrors.password = 'Mật khẩu phải có ít nhất 1 ký tự';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear specific field error when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const response = await authService.login(formData);
            
            if (response.data && response.data.authenticated) {
                setAccessToken(response.data.token);
                
                console.log('Đăng nhập thành công!');
                
                // Fetch data after successful auth
                await fetchProfile();
                await fetchUserRoles();
                
                // Fetch role-based data
                await fetchDepartments();
                await fetchMyProjects();

                // Redirect to dashboard
                navigate('/dashboard', { replace: true });
            } else {
                setErrors({ general: 'Đăng nhập thất bại. Vui lòng thử lại.' });
            }
        } catch (error: any) {
            console.error('Login error:', error);
            
            const errorMessage = error?.response?.data?.message || 
                               error?.message || 
                               'Đã có lỗi xảy ra. Vui lòng thử lại.';
            
            setErrors({ general: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const handleGoogleSignIn = async (data: { idToken: string; user: any }) => {
        setIsLoading(true);
        setErrors({});

        try {
            const response = await authService.authenticateWithGoogle(data.idToken);
            
            if (response.data && response.data.authenticated) {
                setAccessToken(response.data.token);
                
                console.log('Đăng nhập Google thành công!');
                
                // Fetch data after successful auth
                await fetchProfile();
                await fetchUserRoles();
                
                // Fetch role-based data
                if (isGlobalManager()) {
                    await fetchDepartments();
                } else {
                    await fetchMyProjects();
                }
                
                // Redirect to dashboard
                navigate('/dashboard', { replace: true });
            } else {
                setErrors({ general: 'Đăng nhập Google thất bại. Vui lòng thử lại.' });
            }
        } catch (error: any) {
            console.error('Google auth error:', error);
            
            const errorMessage = error?.response?.data?.message || 
                               error?.message || 
                               'Đăng nhập Google thất bại. Vui lòng thử lại.';
            
            setErrors({ general: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignInError = (error: Error) => {
        console.error('Google sign-in error:', error);
        setErrors({ general: 'Đăng nhập Google thất bại. Vui lòng thử lại.' });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-4 sm:px-6 lg:px-8">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow animation-delay-2000"></div>
                <div className="absolute top-40 left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow animation-delay-4000"></div>
            </div>

            <div className="relative w-full max-w-md">
                <div className="bg-white/80 backdrop-blur-lg shadow-2xl rounded-2xl border border-white/20 p-8 animate-slide-up">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white text-xl font-bold">F</span>
                            </div>
                            <h1 className="ml-3 text-2xl font-bold text-gray-900">FlowX</h1>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Chào mừng trở lại!</h2>
                        <p className="text-gray-600 text-sm">Đăng nhập để tiếp tục sử dụng FlowX</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Banner */}
                        {errors.general && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 animate-fade-in">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <span className="text-red-700 text-sm">{errors.general}</span>
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 bg-gray-50 ${
                                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="Nhập email của bạn"
                                    autoComplete="email"
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600 animate-fade-in">{errors.email}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200 bg-gray-50 ${
                                        errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="Nhập mật khẩu của bạn"
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
                                    onClick={togglePasswordVisibility}
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600 animate-fade-in">{errors.password}</p>
                            )}
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                                    disabled={isLoading}
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                    Ghi nhớ đăng nhập
                                </label>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowForgotPasswordModal(true)}
                                className="text-sm text-primary-600 hover:text-primary-500 transition-colors duration-200 disabled:opacity-50"
                                disabled={isLoading}
                            >
                                Quên mật khẩu?
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                    Đang đăng nhập...
                                </div>
                            ) : (
                                'Đăng nhập'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-gray-500">Hoặc</span>
                        </div>
                    </div>

                    {/* Google Sign-In Button */}
                    <GoogleSignInButton
                        onSuccess={handleGoogleSignIn}
                        onError={handleGoogleSignInError}
                        disabled={isLoading}
                        className="w-full"
                        theme="outline"
                        size="large"
                        text="signin_with"
                    />

                    {/* Forgot Password Modal */}
                    <ForgotPasswordModal
                        isOpen={showForgotPasswordModal}
                        onClose={() => setShowForgotPasswordModal(false)}
                    />
                </div>
            </div>
        </div>
    );
}; 