import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProfileStore } from '../stores/profile-store';
import { useAuthStore } from '../stores/auth-store';
import { useContentStore } from '../stores/content-store';
import type { UserResponse, UserUpdateRequest } from '../types/user';
import type { ContentCreateRequest } from '../types/content';
import type { FileCreateRequest } from '../types/file';
import userService from '../services/user.service';
import { ContentList } from '../index.ts';
import { ExpandableCreateForm } from '../index.ts';
import SimpleToast from '../components/utils/SimpleToast';
import { ChangePasswordModal } from '../components/profile/ChangePasswordModal';
import { AvatarBackgroundModals } from '../components/profile/AvatarBackgroundModals';
import { validateProfileForm, getFieldError, type ValidationError } from '../utils/validation';
import { formatDate, getStatusColor, getStatusText } from '../utils/format.util';
import fileService from '../services/file.service';
import {AlertTriangle, Edit, User, Save, Linkedin, Twitter} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, isLoading, error, fetchProfile, updateProfile } = useProfileStore();
  const { userRoles } = useAuthStore();
  const { createContent, syncContentFiles } = useContentStore();

  // Determine if viewing own profile or someone else's
  const userIdNum = userId ? parseInt(userId) : (currentUser?.id || 0);
  const isOwnProfile = !userId || (currentUser && userIdNum === currentUser.id);

  // States
  const [targetUser, setTargetUser] = useState<UserResponse | null>(null);
  const [isLoadingTarget, setIsLoadingTarget] = useState(!isOwnProfile);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'photos'>('posts');

  // Content refresh state - để force re-render ContentList
  const [contentKey, setContentKey] = useState(0);

  // Edit states (only for own profile)
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UserUpdateRequest>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Modal states
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Content creation states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Get the user to display (own profile or target user)
  const displayUser = isOwnProfile ? currentUser : targetUser;
  const displayLoading = isOwnProfile ? isLoading : isLoadingTarget;
  const displayError = isOwnProfile ? error : targetError;

  // Fetch target user if viewing someone else's profile
  useEffect(() => {
    if (isOwnProfile) {
      if (!currentUser) {
        fetchProfile();
      }
    } else {
      // Fetch target user
      const fetchTargetUser = async () => {
        if (!userIdNum || userIdNum <= 0) {
          setTargetError('ID người dùng không hợp lệ');
          setIsLoadingTarget(false);
          return;
        }

        try {
          setIsLoadingTarget(true);
          setTargetError(null);

          const response = await userService.getUserById(userIdNum);

          if (response.code === 200 && response.data) {
            setTargetUser(response.data);
          } else {
            setTargetError(response.message || 'Không thể tải thông tin người dùng');
          }
        } catch (error: any) {
          console.error('Failed to fetch user profile:', error);
          const errorMessage = error.response?.data?.message || error.message || 'Không thể tải thông tin người dùng';
          setTargetError(errorMessage);
        } finally {
          setIsLoadingTarget(false);
        }
      };

      fetchTargetUser();
    }
  }, [userIdNum, isOwnProfile, currentUser, fetchProfile]);

  // Update form data when user changes
  useEffect(() => {
    if (displayUser && isOwnProfile) {
      setFormData({
        fullName: displayUser.fullName,
        phoneNumber: displayUser.phoneNumber || '',
        address: displayUser.address || '',
        dateOfBirth: displayUser.dateOfBirth || '',
        gender: displayUser.gender || 'OTHER',
        bio: displayUser.bio || '',
        facebook: displayUser.facebook || '',
        linkedin: displayUser.linkedin || '',
        twitter: displayUser.twitter || '',
      });
    }
  }, [displayUser, isOwnProfile]);

  // Handle create personal content
  const handleCreatePersonalContent = async (request: ContentCreateRequest, files?: File[]) => {
    try {
      // First, create the content
      const createdContent = await createContent({
        ...request,
        contentTargetType: 'GLOBAL',
        targetId: 0,
        parentId: -1
      });

      // If there are files, upload them
      if (files && files.length > 0 && createdContent.id) {
        await uploadContentFiles(createdContent.id, files);

              // Sync the content to update hasFile flag
      await syncContentFiles(createdContent.id);
    }

    // Force refresh ContentList by updating key with a small delay
    setTimeout(() => {
      setContentKey(prev => prev + 1);
    }, 100);

    setToast({ 
      message: 'Đã đăng bài viết thành công!', 
      type: 'success' 
    });
    } catch (error: any) {
      console.error('Failed to create personal content:', error);
      setToast({ 
        message: error.message || 'Không thể đăng bài viết. Vui lòng thử lại.', 
        type: 'error' 
      });
      throw error;
    }
  };

  const uploadContentFiles = async (contentId: number, files: File[]) => {
    const uploadPromises = files.map(async (file) => {
      try {
        // Step 1: Get presigned upload URL
        const fileRequest: FileCreateRequest = {
          name: file.name,
          type: file.type,
          size: file.size,
          targetId: contentId,
          fileTargetType: 'CONTENT'
        };

        const presignedResponse = await fileService.getPresignedUploadUrl(fileRequest);

        if (!presignedResponse.data) {
          throw new Error('No presigned URL returned from server');
        }

        // Step 2: Upload file directly to MinIO using presigned URL
        const uploadResponse = await fetch(presignedResponse.data.url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`File upload failed: ${uploadResponse.statusText}`);
        }

        console.log('File uploaded successfully:', file.name);
        return presignedResponse.data.presignedFileId;
      } catch (error) {
        console.error('Failed to upload file:', file.name, error);
        throw error;
      }
    });

    await Promise.all(uploadPromises);
  };

  // Handle form submission for own profile
  const handleSave = async () => {
    if (!isOwnProfile) return;

    // Validate form data
    const validation = validateProfileForm(formData);
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(formData);
      setValidationErrors([]);
      setIsEditing(false);
      setShowSuccessMessage(true);
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (displayUser && isOwnProfile) {
      setFormData({
        fullName: displayUser.fullName,
        phoneNumber: displayUser.phoneNumber || '',
        address: displayUser.address || '',
        dateOfBirth: displayUser.dateOfBirth || '',
        gender: displayUser.gender || 'OTHER',
        bio: displayUser.bio || '',
        facebook: displayUser.facebook || '',
        linkedin: displayUser.linkedin || '',
        twitter: displayUser.twitter || '',
      });
    }
    setValidationErrors([]);
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Avatar/Background handlers
  // Modal handlers
  const handleModalSuccess = (message: string) => {
    setToast({ message, type: 'success' });
    // Force refresh ContentList
    setTimeout(() => {
      setContentKey(prev => prev + 1);
    }, 100);
  };

  const handleModalError = (message: string) => {
    setToast({ message, type: 'error' });
  };

  const handlePasswordChangeSuccess = () => {
    // Optional: additional logic after password change
  };

  // Loading states
  if (displayLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Đang tải thông tin...</span>
        </div>
      </div>
    );
  }

  if (displayError) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Lỗi tải thông tin</h3>
              <p className="mt-1 text-sm text-red-700">{displayError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-4">👤</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Không tìm thấy người dùng</h3>
          <p className="text-gray-500">Người dùng này có thể đã bị xóa hoặc không tồn tại.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-400/8 to-indigo-400/8 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDuration: '6s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/8 to-pink-400/8 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDuration: '8s', animationDelay: '3s' }}></div>
        <div className="absolute top-3/4 left-1/2 transform -translate-x-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400/8 to-blue-400/8 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDuration: '10s', animationDelay: '5s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Toast Notification */}
        {toast && (
          <SimpleToast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg border border-white/20 backdrop-blur-sm flex items-center space-x-2 animate-bounce">
            <Save className="w-5 h-5" />
            <span className="font-medium">Cập nhật thông tin thành công!</span>
          </div>
        )}

        {/* Cover Photo & Profile Header */}
        <div className="relative">
          {/* Cover Photo */}
          <div 
            className={`h-80 relative overflow-hidden ${!displayUser.background ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-700' : ''}`}
            style={{
              backgroundImage: displayUser.background ? `url(${displayUser.background})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            role="img"
            aria-label={displayUser.background ? "Profile cover photo" : "Default cover background"}
          >
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/20"></div>
            
            {/* Default background when no image */}
            {displayUser.background ? (
              <img
                  src={displayUser.background}
                  alt={`${displayUser.fullName}'s cover photo`}
                  className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.8)' }}
              />
                ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <User className="w-10 h-10 opacity-80" />
                  </div>
                  {isOwnProfile && (
                    <p className="text-sm opacity-90 font-medium">Nhấn để thêm ảnh bìa</p>
                  )}
                </div>
              </div>
            )}

            {/* Cover Edit Button - only shown on own profile */}
            {isOwnProfile && (
              <button 
                onClick={() => setShowBackgroundModal(true)}
                className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white px-4 py-2 rounded-xl hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg border border-white/50 flex items-center space-x-2 focus:outline-none focus:ring-4 focus:ring-white/30"
                aria-label={displayUser.background ? "Change cover photo" : "Add cover photo"}
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm font-semibold">{displayUser.background ? 'Thay đổi ảnh bìa' : 'Thêm ảnh bìa'}</span>
              </button>
            )}
          </div>

          {/* Profile Info Bar */}
          <div className="bg-white/90 backdrop-blur-sm shadow-xl border-t border-white/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-end py-6 space-x-6">
                {/* Avatar */}
                <div className="relative -mt-20">
                  <div className="w-36 h-36 rounded-full overflow-hidden bg-white p-2 shadow-2xl ring-4 ring-white/50">
                    {displayUser.avatar ? (
                      <img 
                        src={displayUser.avatar} 
                        alt={displayUser.fullName} 
                        className="w-full h-full object-cover rounded-full" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold rounded-full shadow-inner">
                        {displayUser.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Avatar Edit Button - chỉ hiển thị nếu là profile của mình */}
                  {isOwnProfile && (
                    <button 
                      onClick={() => setShowAvatarModal(true)}
                      className="absolute bottom-2 right-2 bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300/50"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 pb-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-1">{displayUser.fullName}</h1>
                  <p className="text-gray-600 text-base font-medium">{displayUser.position || 'Chưa cập nhật chức vụ'}</p>
                  {displayUser.department && (
                    <p className="text-gray-500 text-sm mt-1">{displayUser.department.name}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 pb-2">
                  {isOwnProfile ? (
                    <>
                      <button
                        onClick={() => setShowChangePasswordModal(true)}
                        className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-5 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all duration-200 shadow-md border border-gray-200/50 flex items-center space-x-2 font-medium"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span>Đổi mật khẩu</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg flex items-center space-x-2 font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span>Nhắn tin</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="border-t border-gray-200/50">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`py-4 px-2 border-b-3 font-medium text-sm transition-all duration-200 ${
                      activeTab === 'posts'
                        ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
                    } rounded-t-lg`}
                  >
                    Bài viết
                  </button>
                  <button
                    onClick={() => setActiveTab('about')}
                    className={`py-4 px-2 border-b-3 font-medium text-sm transition-all duration-200 ${
                      activeTab === 'about'
                        ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
                    } rounded-t-lg`}
                  >
                    Giới thiệu
                  </button>
                  <button
                    onClick={() => setActiveTab('photos')}
                    className={`py-4 px-2 border-b-3 font-medium text-sm transition-all duration-200 ${
                      activeTab === 'photos'
                        ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
                    } rounded-t-lg`}
                  >
                    Ảnh
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-12">
              {/* Tab Content */}
              {activeTab === 'posts' && (
                <div className="space-y-6">
                  {isOwnProfile && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300">
                      <ExpandableCreateForm
                        contentTargetType="GLOBAL"
                        targetId={0}
                        parentId={-1}
                        onSubmit={handleCreatePersonalContent}
                        placeholder="Chia sẻ những suy nghĩ, cập nhật trạng thái hoặc thành tích cá nhân..."
                        compactPlaceholder="Chia sẻ trạng thái của bạn..."
                        autoFocus={false}
                      />
                    </div>
                  )}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
                    <ContentList 
                      key={contentKey}
                      userId={displayUser.id} 
                      showCreatePost={false}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                 <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 hover:shadow-2xl transition-all duration-300">
                   <div className="flex items-center justify-between mb-8">
                     <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Thông tin chi tiết</h3>
                     {isOwnProfile && !isEditing && (
                       <button
                         onClick={() => setIsEditing(true)}
                         className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg text-sm font-medium flex items-center space-x-2"
                       >
                         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                           <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                         </svg>
                         <span>Chỉnh sửa</span>
                       </button>
                     )}
                   </div>

                   {isOwnProfile && isEditing ? (
                     // Form chỉnh sửa
                     <div className="space-y-8">
                       {/* Thông tin cơ bản */}
                       <div>
                         <h4 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Thông tin cơ bản</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {/* Full Name */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">
                               Họ và tên <span className="text-red-500">*</span>
                             </label>
                             <input
                               type="text"
                               name="fullName"
                               value={formData.fullName || ''}
                               onChange={handleInputChange}
                               className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                 getFieldError(validationErrors, 'fullName') ? 'border-red-300' : 'border-gray-300'
                               }`}
                               placeholder="Nhập họ và tên"
                             />
                             {getFieldError(validationErrors, 'fullName') && (
                               <p className="text-red-500 text-xs mt-1">{getFieldError(validationErrors, 'fullName')}</p>
                             )}
                           </div>

                           {/* Email (readonly) */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                             <input
                               type="email"
                               value={displayUser.email}
                               disabled
                               className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                             />
                             <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
                           </div>

                           {/* Phone */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                             <input
                               type="tel"
                               name="phoneNumber"
                               value={formData.phoneNumber || ''}
                               onChange={handleInputChange}
                               className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                 getFieldError(validationErrors, 'phoneNumber') ? 'border-red-300' : 'border-gray-300'
                               }`}
                               placeholder="Nhập số điện thoại"
                             />
                             {getFieldError(validationErrors, 'phoneNumber') && (
                               <p className="text-red-500 text-xs mt-1">{getFieldError(validationErrors, 'phoneNumber')}</p>
                             )}
                           </div>

                           {/* Date of Birth */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
                             <input
                               type="date"
                               name="dateOfBirth"
                               value={formData.dateOfBirth || ''}
                               onChange={handleInputChange}
                               className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                 getFieldError(validationErrors, 'dateOfBirth') ? 'border-red-300' : 'border-gray-300'
                               }`}
                             />
                             {getFieldError(validationErrors, 'dateOfBirth') && (
                               <p className="text-red-500 text-xs mt-1">{getFieldError(validationErrors, 'dateOfBirth')}</p>
                             )}
                           </div>

                           {/* Gender */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
                             <select
                               name="gender"
                               value={formData.gender || 'OTHER'}
                               onChange={handleInputChange}
                               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                             >
                               <option value="MALE">Nam</option>
                               <option value="FEMALE">Nữ</option>
                               <option value="OTHER">Khác</option>
                             </select>
                           </div>

                           {/* Address */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                             <textarea
                               name="address"
                               value={formData.address || ''}
                               onChange={handleInputChange}
                               rows={3}
                               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                               placeholder="Nhập địa chỉ"
                             />
                           </div>
                         </div>
                       </div>

                       {/* Thông tin công việc */}
                       <div>
                         <h4 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Thông tin công việc</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {/* Position */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Chức vụ</label>
                             <input
                               type="text"
                               name="position"
                               value={displayUser.position || 'Chưa cập nhật'}
                               disabled
                               className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                             />
                              <p className="text-xs text-gray-500 mt-1">Chức vụ do quản trị viên phân công</p>
                           </div>

                           {/* Department (readonly) */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">Phòng ban</label>
                             <input
                               type="text"
                               value={displayUser.department?.name || 'Chưa được phân công'}
                               disabled
                               className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                             />
                             <p className="text-xs text-gray-500 mt-1">Phòng ban do quản trị viên phân công</p>
                           </div>

                           {/* Bio */}
                           <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-gray-700 mb-2">Giới thiệu bản thân</label>
                             <textarea
                               name="bio"
                               value={formData.bio || ''}
                               onChange={handleInputChange}
                               rows={4}
                               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                               placeholder="Viết vài dòng giới thiệu về bản thân..."
                             />
                           </div>
                         </div>
                       </div>

                       {/* Mạng xã hội */}
                       <div>
                         <h4 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Mạng xã hội</h4>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           {/* Facebook */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">
                               <div className="flex items-center space-x-2">
                                 <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                   <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                 </svg>
                                 <span>Facebook</span>
                               </div>
                             </label>
                             <input
                               type="url"
                               name="facebook"
                               value={formData.facebook || ''}
                               onChange={handleInputChange}
                               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                               placeholder="https://facebook.com/username"
                             />
                           </div>

                           {/* LinkedIn */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">
                               <div className="flex items-center space-x-2">
                                 <svg className="w-4 h-4 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                                   <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                 </svg>
                                 <span>LinkedIn</span>
                               </div>
                             </label>
                             <input
                               type="url"
                               name="linkedin"
                               value={formData.linkedin || ''}
                               onChange={handleInputChange}
                               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                               placeholder="https://linkedin.com/in/username"
                             />
                           </div>

                           {/* Twitter */}
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-2">
                               <div className="flex items-center space-x-2">
                                 <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                                   <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                 </svg>
                                 <span>Twitter</span>
                               </div>
                             </label>
                             <input
                               type="url"
                               name="twitter"
                               value={formData.twitter || ''}
                               onChange={handleInputChange}
                               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                               placeholder="https://twitter.com/username"
                             />
                           </div>
                         </div>
                       </div>

                       {/* Action buttons */}
                       <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                         <button
                           onClick={handleCancel}
                           className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                           disabled={isSaving}
                         >
                           Hủy
                         </button>
                         <button
                           onClick={handleSave}
                           disabled={isSaving}
                           className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 font-medium"
                         >
                           {isSaving ? (
                             <>
                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                               <span>Đang lưu...</span>
                             </>
                           ) : (
                             <>
                               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                 <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                               </svg>
                               <span>Lưu thông tin</span>
                             </>
                           )}
                         </button>
                       </div>
                     </div>
                   ) : (
                     // View mode
                     <div className="space-y-8">
                       <div>
                         <h4 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Thông tin cá nhân</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                             <span className="text-sm text-gray-600">Họ và tên:</span>
                             <p className="font-medium text-gray-900">{displayUser.fullName}</p>
                           </div>
                           <div>
                             <span className="text-sm text-gray-600">Email:</span>
                             <p className="font-medium text-gray-900">{displayUser.email}</p>
                           </div>
                           <div>
                             <span className="text-sm text-gray-600">Số điện thoại:</span>
                             <p className="font-medium text-gray-900">{displayUser.phoneNumber || 'Chưa cập nhật'}</p>
                           </div>
                           <div>
                             <span className="text-sm text-gray-600">Ngày sinh:</span>
                             <p className="font-medium text-gray-900">{formatDate(displayUser.dateOfBirth || '')}</p>
                           </div>
                           <div>
                             <span className="text-sm text-gray-600">Giới tính:</span>
                             <p className="font-medium text-gray-900">
                               {displayUser.gender === 'MALE' ? 'Nam' : 
                                displayUser.gender === 'FEMALE' ? 'Nữ' : 
                                displayUser.gender === 'OTHER' ? 'Khác' : 'Chưa cập nhật'}
                             </p>
                           </div>
                           <div>
                             <span className="text-sm text-gray-600">Ngày tham gia:</span>
                             <p className="font-medium text-gray-900">{formatDate(displayUser.joinDate || displayUser.createdAt)}</p>
                           </div>
                           {displayUser.address && (
                             <div className="md:col-span-2">
                               <span className="text-sm text-gray-600">Địa chỉ:</span>
                               <p className="font-medium text-gray-900">{displayUser.address}</p>
                             </div>
                           )}
                         </div>
                       </div>

                       <div>
                         <h4 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Thông tin công việc</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                             <span className="text-sm text-gray-600">Chức vụ:</span>
                             <p className="font-medium text-gray-900">{displayUser.position || 'Chưa cập nhật'}</p>
                           </div>
                           <div>
                             <span className="text-sm text-gray-600">Phòng ban:</span>
                             <p className="font-medium text-gray-900">{displayUser.department?.name || 'Chưa được phân công'}</p>
                           </div>
                           <div>
                             <span className="text-sm text-gray-600">Trạng thái:</span>
                             <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(displayUser.status || '')}`}>
                               {getStatusText(displayUser.status || '')}
                             </span>
                           </div>
                           {isOwnProfile && userRoles.length > 0 && (
                             <div>
                               <span className="text-sm text-gray-600">Quyền hạn:</span>
                               <div className="mt-1 space-y-1">
                                 {userRoles.slice(0, 2).map((userRole) => (
                                   <span key={userRole.id} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                                     {userRole.role.name}
                                   </span>
                                 ))}
                                 {userRoles.length > 2 && (
                                   <span className="text-xs text-gray-500">+{userRoles.length - 2} quyền khác</span>
                                 )}
                               </div>
                             </div>
                           )}
                           {displayUser.bio && (
                             <div className="md:col-span-2">
                               <span className="text-sm text-gray-600">Giới thiệu:</span>
                               <p className="font-medium text-gray-900 whitespace-pre-wrap">{displayUser.bio}</p>
                             </div>
                           )}
                         </div>
                       </div>
                       <div>
                         <h4 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Mạng xã hội</h4>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             {displayUser.facebook && (
                               <div>
                                 <span className="text-sm text-gray-600 flex items-center space-x-2 mb-2">
                                      <img src="/facebook-icon.svg" alt="Facebook icon" width={16} height={16} />
                                   <span>Facebook</span>
                                 </span>
                                 <a 
                                   href={displayUser.facebook} 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className="font-medium text-blue-600 hover:text-blue-800 transition-colors break-all"
                                 >
                                   {displayUser.facebook}
                                 </a>
                               </div>
                             )}
                             {displayUser.linkedin && (
                               <div>
                                 <span className="text-sm text-gray-600 flex items-center space-x-2 mb-2">
                                   <Linkedin className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"/>
                                   <span>LinkedIn</span>
                                 </span>
                                 <a 
                                   href={displayUser.linkedin} 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className="font-medium text-blue-600 hover:text-blue-800 transition-colors break-all"
                                 >
                                   {displayUser.linkedin}
                                 </a>
                               </div>
                             )}
                             {displayUser.twitter && (
                               <div>
                                 <span className="text-sm text-gray-600 flex items-center space-x-2 mb-2">
                                     <Twitter className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24"/>
                                     <span>Twitter</span>
                                 </span>
                                 <a 
                                   href={displayUser.twitter} 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   className="font-medium text-blue-600 hover:text-blue-800 transition-colors break-all"
                                 >
                                   {displayUser.twitter}
                                 </a>
                               </div>
                             )}
                           </div>
                       </div>
                     </div>
                   )}
                 </div>
               )}

                             {activeTab === 'photos' && (
                 <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 hover:shadow-2xl transition-all duration-300">
                   <div className="flex items-center justify-between mb-8">
                     <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Hình ảnh</h3>
                     <div className="text-sm text-gray-500">12 ảnh</div>
                   </div>
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                     {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                       <div key={i} className="group aspect-square rounded-xl overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl">
                         <div className={`w-full h-full bg-gradient-to-br ${
                           i % 6 === 0 ? 'from-purple-400 to-pink-400' :
                           i % 5 === 0 ? 'from-blue-400 to-cyan-400' :
                           i % 4 === 0 ? 'from-green-400 to-teal-400' :
                           i % 3 === 0 ? 'from-orange-400 to-red-400' :
                           i % 2 === 0 ? 'from-indigo-400 to-purple-400' :
                           'from-pink-400 to-rose-400'
                         } group-hover:opacity-90 transition-opacity relative`}>
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                             <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                             </svg>
                           </div>
                         </div>
                       </div>
                     ))}
                   </div>
                   
                   {/* Empty state for when no photos */}
                   <div className="hidden text-center py-16">
                     <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                       <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                       </svg>
                     </div>
                     <h3 className="text-lg font-semibold text-gray-800 mb-2">Chưa có ảnh nào</h3>
                     <p className="text-gray-600">Hãy chia sẻ những khoảnh khắc đẹp của bạn</p>
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={handlePasswordChangeSuccess}
      />

      <AvatarBackgroundModals
        showAvatarModal={showAvatarModal}
        showBackgroundModal={showBackgroundModal}
        onCloseAvatarModal={() => setShowAvatarModal(false)}
        onCloseBackgroundModal={() => setShowBackgroundModal(false)}
        onSuccess={handleModalSuccess}
        onError={handleModalError}
      />
    </div>
  );
}; 
