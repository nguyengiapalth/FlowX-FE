import React from 'react';
import { Navbar } from './Navbar.tsx';
import { Sidebar } from './Sidebar.tsx';
import ToastNotification from './ToastNotification';
import { useProfileStore } from '../stores/profile-store';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user } = useProfileStore();

  const userName = user?.fullName || 'Người dùng';
  const userAvatar = user?.avatar;
  const userEmail = user?.email || 'Chưa có email';

  return (
    <div className="min-h-screen gradient-primary-soft">
      {/* Fixed Top Navbar */}
      <Navbar userName={userName} userAvatar={userAvatar} userEmail={userEmail}  />
      
      {/* Main Layout Container */}
      <div className="pt-16 min-h-screen"> {/* Add padding-top to account for fixed navbar */}
        <div className="max-w-7xl mx-auto px-4">
          {/* Main Content Area */}
          <div className="flex gap-6 py-4">
            {/* Left Sidebar - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-20"> {/* Make sidebar sticky with offset for navbar */}
                <Sidebar />
              </div>
            </div>
            
            {/* Main Content */}
            <main className="flex-1 min-w-0">
              <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 card-primary">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
      
      {/* Toast Notifications */}
      <ToastNotification />
    </div>
  );
}; 