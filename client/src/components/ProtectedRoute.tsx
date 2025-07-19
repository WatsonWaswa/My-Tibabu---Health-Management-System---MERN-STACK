import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useLoading } from './LoadingProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();
  const { setIsLoading } = useLoading();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
        
        // If we're on login page and user is authenticated, redirect to their dashboard
        if (location.pathname === '/login' && user.role) {
          const dashboardPath = user.role === 'admin' ? '/admin' : 
                               user.role === 'doctor' ? '/doctor' : 
                               user.role === 'patient' ? '/patient' : '/';
          window.location.href = dashboardPath;
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    setIsLoading(true);
    return null;
  }

  setIsLoading(false);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If role restrictions are specified and user doesn't have access
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on user role
    const dashboardPath = userRole === 'admin' ? '/admin' : 
                         userRole === 'doctor' ? '/doctor' : 
                         userRole === 'patient' ? '/patient' : '/';
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 