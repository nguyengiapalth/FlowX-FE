import React, { useState } from 'react';
import authService from '../../services/auth.service';
import type { ChangePasswordRequest } from '../../types/auth';
import { 
  X 
} from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState<ChangePasswordRequest>({
    oldPassword: '',
    newPassword: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setPasswordData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    setPasswordErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const validatePassword = (): boolean => {
    const errors = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    };

    if (!passwordData.oldPassword.trim())
      errors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại';

    if (!passwordData.newPassword.trim())
      errors.newPassword = 'Vui lòng nhập mật khẩu mới';
    else if (passwordData.newPassword.length < 6)
      errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    else if (passwordData.newPassword === passwordData.oldPassword)
      errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';

    if (!confirmPassword)
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    else if (confirmPassword !== passwordData.newPassword)
      errors.confirmPassword = 'Xác nhận mật khẩu không khớp';

    setPasswordErrors(errors);
    return !errors.oldPassword && !errors.newPassword && !errors.confirmPassword;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    setIsChangingPassword(true);
    try {
      await authService.changePassword(passwordData);
      alert('Đổi mật khẩu thành công!');
      handleCancelChangePassword();
      onSuccess();
    } catch (error: any) {
      console.error('Failed to change password:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể đổi mật khẩu. Vui lòng thử lại!';
      alert(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancelChangePassword = () => {
    setPasswordData({
      oldPassword: '',
      newPassword: ''
    });
    setConfirmPassword('');
    setPasswordErrors({
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Đổi mật khẩu</h3>
          <button
            onClick={handleCancelChangePassword}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              name="oldPassword"
              value={passwordData.oldPassword}
              onChange={handlePasswordInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                passwordErrors.oldPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập mật khẩu hiện tại"
            />
            {passwordErrors.oldPassword && (
              <p className="text-red-500 text-sm mt-1">{passwordErrors.oldPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu mới
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập mật khẩu mới"
            />
            {passwordErrors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handlePasswordInputChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập lại mật khẩu mới"
            />
            {passwordErrors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleCancelChangePassword}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isChangingPassword}
          >
            Hủy
          </button>
          <button
            onClick={handleChangePassword}
            disabled={isChangingPassword}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {isChangingPassword && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{isChangingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}; 