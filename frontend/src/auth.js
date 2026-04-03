export const ROLE_HOME = {
  superadmin: '/superadmin/dashboard',
  college_admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard'
};

export const getStoredAuth = () => ({
  token: localStorage.getItem('token'),
  role: localStorage.getItem('role'),
  name: localStorage.getItem('name')
});

export const clearStoredAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('name');
  localStorage.removeItem('userId');
  localStorage.removeItem('college');
  localStorage.removeItem('department');
};

export const getHomeRouteForRole = (role) => ROLE_HOME[role] || '/login';
