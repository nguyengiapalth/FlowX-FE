import React from 'react';
import { UserAvatar } from './UserAvatar';
import { UserNameCard } from './UserNameCard';

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

export const SeparateComponentsDemo: React.FC = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Separate Avatar & Name Components Demo</h1>
        
        {/* Avatar Only */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">UserAvatar Component</h2>
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 items-center">
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Small</h3>
                <UserAvatar user={demoUsers[0]} size="sm" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Medium</h3>
                <UserAvatar user={demoUsers[0]} size="md" />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-3">Large</h3>
                <UserAvatar user={demoUsers[0]} size="lg" showOnlineStatus={true} />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-3">XL</h3>
                <UserAvatar user={demoUsers[0]} size="xl" showOnlineStatus={true} />
              </div>
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-600 mb-3">2XL</h3>
                <UserAvatar user={demoUsers[1]} size="2xl" showOnlineStatus={true} />
              </div>
            </div>
          </div>
        </section>

        {/* Name Card Only */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">UserNameCard Component</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Default Style</h3>
              <UserNameCard 
                user={demoUsers[0]}
                size="md"
                showPosition={true}
                showEmail={true}
                variant="default"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Card Style</h3>
              <UserNameCard 
                user={demoUsers[1]}
                size="md"
                showPosition={true}
                showEmail={true}
                variant="card"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Minimal Style</h3>
              <UserNameCard 
                user={demoUsers[2]}
                size="md"
                showPosition={true}
                showEmail={true}
                variant="minimal"
              />
            </div>
          </div>
        </section>

        {/* Combined Usage Examples */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Combined Usage Examples</h2>
          
          {/* Horizontal Layout */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Horizontal Layout</h3>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="space-y-4">
                {demoUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-4">
                    <UserAvatar user={user} size="md" showOnlineStatus={true} />
                    <UserNameCard 
                      user={user}
                      size="md"
                      showPosition={true}
                      showEmail={true}
                      variant="minimal"
                      layout="horizontal"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Grid Layout</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {demoUsers.map((user) => (
                <div key={user.id} className="bg-white rounded-lg p-6 shadow-sm border text-center">
                  <div className="mb-4 flex justify-center">
                    <UserAvatar user={user} size="xl" showOnlineStatus={true} />
                  </div>
                  <UserNameCard 
                    user={user}
                    size="lg"
                    showPosition={true}
                    showEmail={true}
                    variant="minimal"
                    layout="vertical"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Chat Style */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Chat Style với Time</h3>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="space-y-4">
                {demoUsers.map((user, index) => (
                  <div key={user.id} className="flex items-start space-x-3">
                    <UserAvatar user={user} size="sm" />
                    <div className="flex-1">
                      <UserNameCard 
                        user={user}
                        size="sm"
                        showTime={true}
                        time={`${23 + index} phút trước`}
                        showPosition={true}
                        variant="minimal"
                        layout="horizontal"
                        className="mb-1"
                      />
                      <div className="bg-gray-100 rounded-lg p-3">
                        <p className="text-sm text-gray-800">
                          Đây là tin nhắn mẫu từ {user.fullName}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

                     {/* Time Display Examples */}
           <div className="mb-8">
             <h3 className="text-lg font-medium text-gray-700 mb-4">Name + Position Inline Examples</h3>
             <div className="bg-white rounded-lg p-6 shadow-sm border">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <UserNameCard 
                   user={demoUsers[0]}
                   size="md"
                   showTime={true}
                   time="23 giờ trước"
                   showPosition={true}
                   variant="card"
                 />
                 <UserNameCard 
                   user={demoUsers[1]}
                   size="md"
                   showTime={true}
                   time="1 tép"
                   showPosition={true}
                   showEmail={true}
                   variant="default"
                 />
                 <UserNameCard 
                   user={demoUsers[2]}
                   size="md"
                   showTime={true}
                   time="Vừa xong"
                   showPosition={true}
                   showEmail={true}
                   variant="minimal"
                 />
               </div>
             </div>
           </div>

          {/* Avatar Gallery */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Avatar Gallery</h3>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center space-x-2 mb-4">
                {demoUsers.map((user) => (
                  <UserAvatar key={user.id} user={user} size="md" showOnlineStatus={true} />
                ))}
              </div>
              <p className="text-sm text-gray-600">Click on any avatar to view profile</p>
            </div>
          </div>
        </section>

                 {/* Code Examples */}
         <section className="mb-12">
           <h2 className="text-2xl font-semibold text-gray-800 mb-6">Code Examples</h2>
           <div className="bg-gray-900 rounded-lg p-6 text-green-400 font-mono text-sm overflow-x-auto">
             <pre>{`// Avatar Only
<UserAvatar 
  user={user} 
  size="lg" 
  showOnlineStatus={true} 
/>

// Name Card với Time và Position inline
<UserNameCard 
  user={user}
  size="md"
  showTime={true}
  time="23 phút trước"
  showPosition={true}
  showEmail={true}
  variant="card"
/>
// Output: "Tên User • Position"
//         "23 phút trước"
//         "email@example.com"

// Chat Style với Time ngay dưới tên
<div className="flex items-start space-x-3">
  <UserAvatar user={user} size="sm" />
  <div className="flex-1">
    <UserNameCard 
      user={user}
      size="sm"
      showTime={true}
      time="1 tép"
      variant="minimal"
    />
    <div className="bg-gray-100 rounded-lg p-3">
      <p>Nội dung tin nhắn...</p>
    </div>
  </div>
</div>

// Combined Vertical với Time
<div className="text-center">
  <UserAvatar user={user} size="xl" className="mb-4" />
  <UserNameCard 
    user={user}
    showTime={true}
    time="Vừa xong"
    variant="minimal"
    layout="vertical"
  />
</div>`}</pre>
           </div>
         </section>
      </div>
    </div>
  );
}; 