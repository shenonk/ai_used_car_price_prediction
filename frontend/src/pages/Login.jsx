import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ArrowRight, Check, Eye, EyeOff, Loader2, Lock, Mail, Cpu } from "lucide-react";
import { login, loginWithGoogle } from "../utils/auth";
import LoadingOverlay from "../components/auth/LoadingOverlay";
import SuccessToast from "../components/auth/SuccessToast";

function AuthLogo() {
  return (
    <div className="auth-logo-block">
      <div className="auth-logo-icon"><Cpu /></div>
      <strong>AutoValueLK</strong>
      <span>Sri Lankan vehicle intelligence</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="auth-google-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const authMessage = location.state?.authMessage || "";
  const authSubMessage = location.state?.authSubMessage || "Please sign in to continue.";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Connecting to AutoValueLK...");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(Boolean(authMessage));

  useEffect(() => {
    if (!authMessage) return;

    const timeout = window.setTimeout(() => {
      setShowSuccess(false);
      navigate(location.pathname, { replace: true, state: {} });
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [authMessage, location.pathname, navigate]);

  const handleGoogleLogin = async () => {
    setError("");
    setLoadingMessage("Opening Google sign in...");
    setIsLoading(true);
    const result = await loginWithGoogle();
    if (!result.success) {
      setIsLoading(false);
      setError(result.error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoadingMessage("Connecting to AutoValueLK...");
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const result = await login(email, password);

    if (result.success) {
      setLoadingMessage("Login successful. Opening dashboard...");
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } else {
      setIsLoading(false);
      setError(result.error);
    }
  };

  return (
    <div className="auth-page">
      <LoadingOverlay isOpen={isLoading} message={loadingMessage} />
      <SuccessToast
        isOpen={showSuccess}
        message={authMessage || "Login Successful!"}
        subMessage={authMessage ? authSubMessage : "Redirecting to dashboard..."}
      />

      <AuthLogo />

      <div className="auth-card">
        <div className="auth-card-heading">
          <h1>Welcome back</h1>
          <p>Sign in to your AutoValueLK account</p>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          {error && <div className="auth-error-box">{error}</div>}

          <div className="auth-field" style={{ animationDelay: "0.1s" }}>
            <label>EMAIL ADDRESS</label>
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="auth-field" style={{ animationDelay: "0.2s" }}>
            <label>PASSWORD</label>
            <div className="input-wrapper has-right-icon">
              <Lock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <div className="auth-options-row">
            <label className="auth-check-row">
              <span className={`auth-checkbox ${rememberMe ? "is-checked" : ""}`}>
                {rememberMe && <Check />}
              </span>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              Remember me
            </label>
            <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
          </div>

          <button type="submit" disabled={isLoading} className="auth-primary-button">
            <span>Sign In</span>
            {isLoading ? <Loader2 className="spin" /> : <ArrowRight />}
          </button>

          <div className="auth-divider"><span />or continue with<span /></div>

          <button type="button" onClick={handleGoogleLogin} className="auth-google-button">
            <GoogleIcon />
            Google
          </button>
        </form>
      </div>

      <p className="auth-bottom-link">
        Don't have an account? <Link to="/register">Create account</Link>
      </p>

      <div className="auth-security-note">
        <Lock />
        <span>Secured with 256-bit encryption</span>
      </div>
      <p className="auth-footer-copy">© 2026 AutoValueLK. All rights reserved.</p>
    </div>
  );
}

export default Login;
