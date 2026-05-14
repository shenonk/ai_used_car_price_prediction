import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle,
  Cpu,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Shield,
  User,
  XCircle,
} from "lucide-react";
import { register } from "../utils/auth";
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

function getPasswordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 4) score += 1;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) || /\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

const strengthMeta = {
  0: { label: "", width: "0%", color: "#21262d" },
  1: { label: "Weak", width: "25%", color: "#f85149" },
  2: { label: "Fair", width: "50%", color: "#d29922" },
  3: { label: "Good", width: "75%", color: "#58a6ff" },
  4: { label: "Strong", width: "100%", color: "#3fb950" },
};

function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Securing your account...");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const strength = useMemo(() => strengthMeta[getPasswordStrength(password)], [password]);
  const hasConfirmValue = Boolean(password && confirmPassword);
  const passwordsMatch = hasConfirmValue && password === confirmPassword;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoadingMessage("Securing your account...");
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const result = await register(email, password, username);

    if (result.success) {
      setLoadingMessage("Account created. Opening sign in...");
      setShowSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else {
      setIsLoading(false);
      setError(result.error);
    }
  };

  return (
    <div className="auth-page">
      <LoadingOverlay isOpen={isLoading} message={loadingMessage} />
      <SuccessToast isOpen={showSuccess} message="Account Created!" subMessage="Redirecting to login..." />

      <AuthLogo />

      <div className="auth-card">
        <div className="auth-card-heading">
          <h1>Create your account</h1>
          <p>Join AutoValueLK and start predicting car prices</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          {error && <div className="auth-error-box">{error}</div>}

          <div className="auth-field" style={{ animationDelay: "0.1s" }}>
            <label>USERNAME</label>
            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
              />
            </div>
          </div>

          <div className="auth-field" style={{ animationDelay: "0.15s" }}>
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
                placeholder="Create a password"
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
            <div className="auth-strength">
              <span><i style={{ width: strength.width, background: strength.color }} /></span>
              {strength.label && <small style={{ color: strength.color }}>{strength.label}</small>}
            </div>
          </div>

          <div className="auth-field" style={{ animationDelay: "0.25s" }}>
            <label>CONFIRM PASSWORD</label>
            <div className={`input-wrapper has-right-icon ${hasConfirmValue ? passwordsMatch ? "is-valid" : "is-invalid" : ""}`}>
              <Shield className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
              <span className="input-icon-right auth-match-icon">
                {hasConfirmValue ? passwordsMatch ? <CheckCircle /> : <XCircle /> : null}
              </span>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="auth-primary-button">
            <span>Create Account</span>
            {isLoading ? <Loader2 className="spin" /> : <ArrowRight />}
          </button>
        </form>
      </div>

      <p className="auth-bottom-link">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
      <p className="auth-footer-copy">© 2026 AutoValueLK. All rights reserved.</p>
    </div>
  );
}

export default Register;
