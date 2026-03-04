import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — blocks access if no JWT token in localStorage.
 * Redirects unauthenticated users to /admin/login.
 */
function ProtectedRoute({ children }) {
    const token = localStorage.getItem('admin_token');

    if (!token) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
