import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { clearStoredAuth, getHomeRouteForRole, getStoredAuth } from '../auth';

export default function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();
  const [authState, setAuthState] = useState({ loading: true, role: null, valid: false });
  const { token, role } = getStoredAuth();

  useEffect(() => {
    let mounted = true;

    const validateAuth = async () => {
      if (!token || !role) {
        if (mounted) {
          setAuthState({ loading: false, role: null, valid: false });
        }
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Authentication expired');
        }

        const user = await response.json();
        localStorage.setItem('role', user.role);
        localStorage.setItem('name', user.name);
        localStorage.setItem('userId', user._id);
        if (user.college) {
          localStorage.setItem('college', user.college);
        }
        if (user.department) {
          localStorage.setItem('department', user.department);
        }

        if (mounted) {
          setAuthState({ loading: false, role: user.role, valid: true });
        }
      } catch {
        clearStoredAuth();
        if (mounted) {
          setAuthState({ loading: false, role: null, valid: false });
        }
      }
    };

    validateAuth();

    return () => {
      mounted = false;
    };
  }, [token, role]);

  if (authState.loading) {
    return <div className="route-loading">Checking your access...</div>;
  }

  if (!authState.valid) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(authState.role)) {
    return <Navigate to={getHomeRouteForRole(authState.role)} replace />;
  }

  return <Outlet />;
}
