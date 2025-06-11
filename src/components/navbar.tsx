import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth-store';
import { useProfileStore } from '../stores/profile-store';
import { useDepartmentStore } from '../stores/department-store';
import { useProjectStore } from '../stores/project-store';
import NotificationDropdown from './NotificationDropdown';
import { 
  Sun, 
  Moon, 
  Star, 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut 
} from 'lucide-react';

interface NavbarProps {
  userName?: string;
  userAvatar?: string;
  userEmail?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  userName = 'Người dùng', 
  userAvatar,
  userEmail = 'email.example@gmail.com'
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const { logout, isGlobalManager } = useAuthStore();
  const { clearProfile } = useProfileStore();
  const { clearDepartments } = useDepartmentStore();
  const { clearProjects } = useProjectStore();

  const handleLogout = () => {
    setShowLogoutModal(true);
    setIsProfileOpen(false);
  };

  const confirmLogout = () => {
    logout();
    clearProfile();
    clearDepartments();
    clearProjects();
    console.log('Đăng xuất thành công');
    setShowLogoutModal(false);
    // Redirect to auth page
    navigate('/login', { replace: true });
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/newsfeed" className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white text-sm font-bold">F</span>
              </div>
              <h1 className="ml-2 text-xl font-bold text-gray-900">FlowX</h1>
            </Link>
          </div>

          {/* Center Navigation - Role Based */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 border-b-2 border-transparent hover:border-primary-500 flex items-center space-x-2"
              >
                <Sun className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              
              {/* Common navigation for all users */}
              <Link
                to="/newsfeed"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 border-b-2 border-transparent hover:border-primary-500 flex items-center space-x-2"
              >
                <Star className="w-4 h-4" />
                <span>Newsfeed</span>
              </Link>

              {/* Common navigation for all users */}
              <Link
                to="/tasks"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 border-b-2 border-transparent hover:border-primary-500 flex items-center space-x-2"
              >
                <Moon className="w-4 h-4" />
                <span>Task</span>
              </Link>


            </div>
          </div>

          {/* Right side - Notifications and Profile */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Notifications */}
              <NotificationDropdown />

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={toggleProfile}
                  className="flex items-center space-x-3 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                    {userAvatar ? (
                      <img src={userAvatar} alt={userName} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-700 font-medium">{userName}</span>
                  <X
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      isProfileOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-fade-in">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{userName}</p>
                      <p className="text-sm text-gray-500">{userEmail}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      Hồ sơ cá nhân
                    </Link>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      Cài đặt
                    </a>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      Hỗ trợ
                    </a>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <span className="sr-only">Mở menu</span>
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white animate-slide-down">
          {/* Mobile Navigation - Role Based */}
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/dashboard"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center space-x-3"
            >
              <Sun className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            
            {/* Common navigation for all users */}
            <Link
              to="/newsfeed"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center space-x-3"
            >
              <Star className="w-5 h-5" />
              <span>Newsfeed</span>
            </Link>
            
            {/* Common navigation for all users */}
            <Link
              to="/tasks"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center space-x-3"
            >
              <Moon className="w-5 h-5" />
              <span>Task</span>
            </Link>
            
            {/* Manager only navigation */}
            {isGlobalManager() && (
              <>
                <Link
                  to="/department"
                  className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center space-x-3"
                >
                  <User className="w-5 h-5" />
                  <span>Phòng ban</span>
                </Link>
                <Link
                  to="/project"
                  className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center space-x-3"
                >
                  <Settings className="w-5 h-5" />
                  <span>Dự án</span>
                </Link>
                <a
                  href="#"
                  className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center space-x-3"
                >
                  <Settings className="w-5 h-5" />
                  <span>Báo cáo</span>
                </a>
              </>
            )}
          </div>
          
          {/* Mobile User Section */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-5">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <span className="text-white font-medium">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-900">{userName}</div>
                <div className="text-sm text-gray-500">{userEmail}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Link
                to="/profile"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                Hồ sơ cá nhân
              </Link>
              <a
                href="#"
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                Cài đặt
              </a>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 m-4 max-w-sm w-full animate-slide-up">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <LogOut className="w-6 h-6 text-red-600" />
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Xác nhận đăng xuất
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Bạn có chắc chắn muốn đăng xuất khỏi FlowX không?
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelLogout}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
              >
                Hủy
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors duration-200"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
