import { useNavigate } from 'react-router-dom';

// Navigation paths constants
export const NAVIGATION_PATHS = {
  NEWSFEED: '/newsfeed',
  DASHBOARD: '/dashboard',
  TASKS: '/tasks',
  PROJECTS: '/projects',
  DEPARTMENTS: '/departments',
  USERS: '/users',
  PROFILE: '/profile',
  LOGIN: '/login',
} as const;

// Navigation helper functions that take a navigate function
export const navigationActions = {
  // Quick actions
  createProject: (navigate: ReturnType<typeof useNavigate>) => () => {
    navigate(NAVIGATION_PATHS.PROJECTS);
  },

  createTask: (navigate: ReturnType<typeof useNavigate>) => () => {
    navigate(NAVIGATION_PATHS.TASKS);
  },

  inviteMember: (navigate: ReturnType<typeof useNavigate>) => () => {
    navigate(NAVIGATION_PATHS.USERS);
  },

  // View all actions
  viewAllProjects: (navigate: ReturnType<typeof useNavigate>) => () => {
    navigate(NAVIGATION_PATHS.PROJECTS);
  },

  viewAllActivities: (navigate: ReturnType<typeof useNavigate>) => () => {
    navigate(NAVIGATION_PATHS.NEWSFEED);
  },

  viewAllTasks: (navigate: ReturnType<typeof useNavigate>) => () => {
    navigate(NAVIGATION_PATHS.TASKS);
  },

  viewAllDepartments: (navigate: ReturnType<typeof useNavigate>) => () => {
    navigate(NAVIGATION_PATHS.DEPARTMENTS);
  },

  viewAllUsers: (navigate: ReturnType<typeof useNavigate>) => () => {
    navigate(NAVIGATION_PATHS.USERS);
  },

  // Specific item navigation
  viewProject: (navigate: ReturnType<typeof useNavigate>) => (projectId: string | number) => {
    navigate(`/project/${projectId}`);
  },

  viewTask: (navigate: ReturnType<typeof useNavigate>) => (taskId: string | number) => {
    navigate(`/tasks/${taskId}`);
  },

  viewDepartment: (navigate: ReturnType<typeof useNavigate>) => (departmentId: string | number) => {
    navigate(`/department/${departmentId}`);
  },

  viewProfile: (navigate: ReturnType<typeof useNavigate>) => (userId?: string | number) => {
    if (userId) {
      navigate(`/profile/${userId}`);
    } else {
      navigate(NAVIGATION_PATHS.PROFILE);
    }
  },

  // Auth navigation
  goToLogin: (navigate: ReturnType<typeof useNavigate>) => () => {
    navigate(NAVIGATION_PATHS.LOGIN, { replace: true });
  },

  goToHome: (navigate: ReturnType<typeof useNavigate>) => () => {
    navigate(NAVIGATION_PATHS.NEWSFEED, { replace: true });
  },
};

// Custom hook for easy navigation actions
export const useNavigationActions = () => {
  const navigate = useNavigate();

  return {
    // Quick actions
    handleCreateProject: navigationActions.createProject(navigate),
    handleCreateTask: navigationActions.createTask(navigate),
    handleInviteMember: navigationActions.inviteMember(navigate),

    // View all actions
    handleViewAllProjects: navigationActions.viewAllProjects(navigate),
    handleViewAllActivities: navigationActions.viewAllActivities(navigate),
    handleViewAllTasks: navigationActions.viewAllTasks(navigate),
    handleViewAllDepartments: navigationActions.viewAllDepartments(navigate),
    handleViewAllUsers: navigationActions.viewAllUsers(navigate),

    // Specific item navigation
    handleProjectClick: navigationActions.viewProject(navigate),
    handleTaskClick: navigationActions.viewTask(navigate),
    handleDepartmentClick: navigationActions.viewDepartment(navigate),
    handleProfileClick: navigationActions.viewProfile(navigate),

    // Auth navigation
    handleGoToLogin: navigationActions.goToLogin(navigate),
    handleGoToHome: navigationActions.goToHome(navigate),

    // Direct navigate access for custom use
    navigate,
  };
};

// Type definitions for better TypeScript support
export type NavigationPaths = typeof NAVIGATION_PATHS;
export type NavigationActions = typeof navigationActions; 