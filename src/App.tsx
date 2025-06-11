import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import NewsfeedPage from './pages/NewsfeedPage';
import TaskPage from './pages/TaskPage';
import TaskDetailPage from './pages/TaskDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import DepartmentDetailPage from './pages/DepartmentDetailPage';
import DepartmentListPage from './pages/DepartmentListPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProjectListPage from './pages/ProjectListPage';
import UserListPage from './pages/UserListPage';
import { AuthChecker } from './components/auth/AuthChecker.tsx';
import { GoogleAuthCallback } from './components/auth/GoogleAuthCallback.tsx';
import { MainLayout } from './components/MainLayout';
import { useAuthStore } from './stores/auth-store';
import './App.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <AuthChecker>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/reset-password" 
            element={
              <PublicRoute>
                <ResetPasswordPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/auth/google/callback" 
            element={<GoogleAuthCallback />} 
          />

          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/departments" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DepartmentListPage />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/department/:departmentId" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DepartmentDetailPage />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProjectListPage />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <UserListPage />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/project/:projectId" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProjectDetailPage />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/newsfeed" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <NewsfeedPage />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tasks" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TaskPage />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tasks/:taskId" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <TaskDetailPage />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProfilePage />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/:userId" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProfilePage />
                </MainLayout>
              </ProtectedRoute>
            } 
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthChecker>
    </Router>
  );
}

export default App;
