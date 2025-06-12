import React, { useState } from 'react';
import authService from '../../services/auth.service';
import type { ForgotPasswordRequest } from '../../types/auth';
import { 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Mail, 
  Loader2 
} from 'lucide-react';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface FormErrors {
    email?: string;
    general?: string;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState<ForgotPasswordRequest>({
        email: ''
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        
        if (!formData.email) {
            newErrors.email = 'Email là bắt buộc';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
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
            await authService.forgotPassword(formData);
            setIsSuccess(true);
        } catch (error: any) {
            console.error('Forgot password error:', error);
            
            const errorMessage = error?.response?.data?.message || 
                               error?.message || 
                               'Đã có lỗi xảy ra. Vui lòng thử lại.';
            
            setErrors({ general: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ email: '' });
        setErrors({});
        setIsSuccess(false);
        setIsLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-slide-down">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Quên mật khẩu</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {isSuccess ? (
                    /* Success Message */
                    <div className="text-center animate-fade-in">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Email đã được gửi!</h3>
                        <p className="text-gray-600 mb-6">
                            Nếu email tồn tại trong hệ thống, một email đặt lại mật khẩu đã được gửi đến địa chỉ email của bạn.
                            Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
                        </p>
                        <button
                            onClick={handleClose}
                            className="w-full py-3 px-4 text-white rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl font-semibold"
                            style={{
                                background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)'
                            }}
                        >
                            Đóng
                        </button>
                    </div>
                ) : (
                    /* Form */
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <p className="text-gray-600 text-sm mb-4">
                                Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.
                            </p>
                        </div>

                        {/* Error Banner */}
                        {errors.general && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3 animate-fade-in">
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
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
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600 animate-fade-in">{errors.email}</p>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isLoading}
                                className="flex-1 py-3 px-4 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium transform hover:scale-[1.01] active:scale-[0.99]"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl"
                                style={{
                                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)'
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    'Gửi email'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}; 