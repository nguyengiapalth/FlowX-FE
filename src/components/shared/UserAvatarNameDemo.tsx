import React from 'react';
import { UserAvatarName } from './UserAvatarName';

// Demo data
const demoUsers = [
  {
    id: 1,
    fullName: 'Nguyễn Khắc Giáp',
    avatar: 'https://via.placeholder.com/150',
    position: 'Senior Developer',
    email: 'giap@example.com'
  },
  {
    id: 2,
    fullName: 'Trần Văn Minh',
    position: 'Project Manager',
    email: 'minh@example.com'
  },
  {
    id: 3,
    fullName: 'Lê Thị Hương',
    avatar: 'https://via.placeholder.com/150/ff69b4',
    position: 'UI/UX Designer',
    email: 'huong@example.com'
  }
];

export const UserAvatarNameDemo: React.FC = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">UserAvatarName Component Demo</h1>
        
        {/* Size Variations */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Kích thước khác nhau</h2>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3">Small (sm)</h3>
                <UserAvatarName user={demoUsers[0]} size="sm" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3">Medium (md)</h3>
                <UserAvatarName user={demoUsers[0]} size="md" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3">Large (lg)</h3>
                <UserAvatarName user={demoUsers[0]} size="lg" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-3">Extra Large (xl)</h3>
                <UserAvatarName user={demoUsers[0]} size="xl" />
              </div>
            </div>
          </div>
        </section>

        {/* Layout Variations */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Layout khác nhau</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Horizontal Layout</h3>
              <UserAvatarName 
                user={demoUsers[1]} 
                size="lg" 
                layout="horizontal"
                showPosition={true}
                showEmail={true}
              />
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Vertical Layout</h3>
              <UserAvatarName 
                user={demoUsers[1]} 
                size="lg" 
                layout="vertical"
                showPosition={true}
                showEmail={true}
              />
            </div>
          </div>
        </section>

        {/* Information Display Options */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Tùy chọn hiển thị thông tin</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Chỉ tên</h3>
              <UserAvatarName 
                user={demoUsers[2]} 
                size="md"
              />
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Tên + Chức vụ</h3>
              <UserAvatarName 
                user={demoUsers[2]} 
                size="md"
                showPosition={true}
              />
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Tên + Chức vụ + Email</h3>
              <UserAvatarName 
                user={demoUsers[2]} 
                size="md"
                showPosition={true}
                showEmail={true}
              />
            </div>
          </div>
        </section>

        {/* Clickable vs Non-clickable */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Clickable vs Non-clickable</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Clickable (điều hướng đến profile)</h3>
              <UserAvatarName 
                user={demoUsers[0]} 
                size="lg"
                showPosition={true}
                clickable={true}
              />
              <p className="text-sm text-gray-500 mt-2">Click để điều hướng đến profile</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Non-clickable</h3>
              <UserAvatarName 
                user={demoUsers[0]} 
                size="lg"
                showPosition={true}
                clickable={false}
              />
              <p className="text-sm text-gray-500 mt-2">Không thể click</p>
            </div>
          </div>
        </section>

        {/* User List Example */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Ví dụ danh sách users</h2>
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="divide-y divide-gray-200">
              {demoUsers.map((user) => (
                <div key={user.id} className="p-4 hover:bg-gray-50">
                  <UserAvatarName 
                    user={user} 
                    size="md"
                    showPosition={true}
                    showEmail={true}
                    clickable={true}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Chat/Comment Style Example */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Ví dụ style chat/comment</h2>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="space-y-4">
              {demoUsers.map((user, index) => (
                <div key={user.id} className="flex items-start space-x-3">
                  <UserAvatarName 
                    user={user} 
                    size="sm"
                    clickable={true}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 bg-gray-100 rounded-lg p-3">
                    <p className="text-sm text-gray-800">
                      Đây là một tin nhắn mẫu từ {user.fullName}. 
                      Avatar có thể click để xem profile.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">5 phút trước</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Code Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Ví dụ code sử dụng</h2>
          <div className="bg-gray-900 rounded-lg p-6 text-green-400 font-mono text-sm overflow-x-auto">
            <pre>{`// Cơ bản
<UserAvatarName user={user} />

// Với tùy chọn kích thước và thông tin
<UserAvatarName 
  user={user} 
  size="lg"
  showPosition={true}
  showEmail={true}
  clickable={true}
/>

// Layout dọc
<UserAvatarName 
  user={user} 
  layout="vertical"
  size="xl"
  showPosition={true}
/>

// Không thể click
<UserAvatarName 
  user={user} 
  clickable={false}
/>`}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}; 