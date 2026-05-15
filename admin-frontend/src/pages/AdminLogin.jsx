import { AlertCircle, Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminLogo from '../assets/logo/AutovalueLK_admin_logo.png';
import api from '../services/api';

/**
 * AdminLogin - email + password form with JWT authentication.
 * On success, stores token and redirects to /admin/dashboard.
 */
function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/api/admin/login', { email, password });
      localStorage.setItem('admin_token', res.data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-shell">
        <div className="admin-login-logo">
          <div className="admin-login-logo-icon">
            <img src={adminLogo} alt="AutoValueLK Admin" />
          </div>
          <div className="admin-login-logo-name">AutoValueLK</div>
          <div className="admin-login-logo-sub">Admin Control Panel</div>
        </div>

        <div className="admin-login-card">
          <div className="admin-login-heading">
            <h1>Admin Login</h1>
            <p>AutoValueLK Control Panel</p>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form">
            {error && (
              <div className="admin-alert admin-alert--error">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <div className="admin-auth-field">
              <label className="admin-auth-label" htmlFor="admin-email">
                Email
              </label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={15} />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@autovaluelk.com"
                  required
                />
              </div>
            </div>

            <div className="admin-auth-field">
              <label className="admin-auth-label" htmlFor="admin-password">
                Password
              </label>
              <div className="input-wrapper has-right">
                <Lock className="input-icon" size={15} />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="admin-login-submit">
              {isLoading ? (
                <>
                  <span className="admin-btn-spinner" />
                  Signing in...
                </>
              ) : (
                <>Sign In -&gt;</>
              )}
            </button>
          </form>

          <div className="admin-security-note">
            <Shield size={12} />
            <span>Admin access only. All activity is logged.</span>
          </div>
        </div>

        <p className="admin-login-footer">© 2026 AutoValueLK. Admin Access Only.</p>
      </div>
    </div>
  );
}

export default AdminLogin;
