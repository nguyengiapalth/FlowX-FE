import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProfileStore } from '../stores/profile-store';
import { useAuthStore } from '../stores/auth-store';
import {useProjectStore} from "../stores/project-store.ts";
import { 
  Building2, 
  Users, 
  Newspaper, 
  CalendarCheck, 
  CheckCircle, 
  ChevronDown, 
  Plus, 
  LayoutGrid,
  BarChart3,
  PieChart
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useProfileStore();
  const {isGlobalManager } = useAuthStore();
  const [showAllProjects, setShowAllProjects] = useState(false);

  // project from store
  const allProjects  = useProjectStore().myProjects;

  const userName = user?.fullName || 'Người dùng';
  const userAvatar = user?.avatar;


  // Filter projects based on access permissions
  const projects = allProjects.filter(project => {
    const userDepartmentId = user?.department?.id;
    
    // Global managers can see all projects
    if (isGlobalManager()) {
      return true;
    }
    
    // Department managers can see all projects in their department
    // if (userDepartmentId && canAccessAllProjectsInDepartment(project.de, userDepartmentId)) {
    //   return true;
    // }
    
    // Regular users can only see their own projects
    // return project.isJoined;
    return true
  });

  const displayedProjects = showAllProjects ? projects : projects.slice(0, 5);

  return (
    <div className="h-[calc(100vh-7rem)] w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <div className="p-4 space-y-2">
        {/* Profile Section */}
        <Link
          to="/profile"
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <span className="text-white text-sm font-medium">
                {userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-gray-900 font-medium">{userName}</span>
        </Link>

        {/* Manager Only Section */}
        {isGlobalManager() && (
          <>
            <Link
              to="/departments"
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-gray-700">Phòng ban</span>
            </Link>
            <Link
              to="/users"
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-gray-700">Nhân sự</span>
            </Link>
          </>
        )}

        {/* Main Navigation */}
        <Link
          to="/newsfeed"
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-green-600" />
          </div>
          <span className="text-gray-700">Newsfeed</span>
        </Link>

        <Link
          to="/tasks"
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-orange-600" />
          </div>
          <span className="text-gray-700">Task</span>
        </Link>

        {/* My Department */}
        {user?.department && (
          <Link
            to={`/department/${user.department.id}`}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-gray-700 text-sm">{user.department.name}</span>
              <span className="text-gray-500 text-xs">Phòng ban của tôi</span>
            </div>
          </Link>
        )}

        {/* Projects Section */}
        <hr className="my-3" />
        <div className="flex items-center justify-between px-2 mb-2">
          <Link to="/projects" className="text-gray-500 text-sm font-medium hover:text-gray-700">
            Dự án của bạn
          </Link>
          <button
            onClick={() => setShowAllProjects(!showAllProjects)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${showAllProjects ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Project List */}
        <div className="space-y-1">
          {displayedProjects.map((project) => (
            <Link
              key={project.id}
              to={`/project/${project.id}`}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">
                  {project.name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2)}
                </span>
              </div>
              <span className="text-gray-700 text-sm">{project.name}</span>
            </Link>
          ))}
          
          {!showAllProjects && projects.length > 5 && (
            <button
              onClick={() => setShowAllProjects(true)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 w-full"
            >
              <div className="w-9 h-9 bg-gray-200 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-gray-600 text-sm">Xem thêm {projects.length - 5} dự án</span>
            </button>
          )}
          
          {/* View All Projects Link */}
          <Link
            to="/projects"
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 w-full text-center"
          >
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-gray-600 text-sm">Tất cả dự án</span>
          </Link>
        </div>

        {/* Manager Only Tools */}
        {isGlobalManager() && (
          <>
            <hr className="my-3" />
            <div className="mb-2">
              <h3 className="text-gray-500 text-sm font-medium px-2">Công cụ quản lý</h3>
            </div>

            <Link
              to="/reports"
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="w-9 h-9 bg-yellow-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-gray-700">Báo cáo</span>
            </Link>

            <Link
              to="/analytics"
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center">
                <PieChart className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-gray-700">Phân tích</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}; 