import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, CheckCircle, Eye, EyeOff, Key, Loader2, Lock, Shield } from "lucide-react";
import { updatePassword } from "../utils/auth";
import { supabase } from "../utils/supabaseClient";
import logo from "../assets/logo/autovaluelk-logo.png";

function AuthLogo() {
  return (
    <div className="auth-logo-block">
      <div className="auth-logo-icon"><img src={logo} alt="AutoValueLK" /></div>
      <strong>AutoValueLK</strong>
      <span>Sri Lankan vehicle intelligence</span>
    </div>
  );
}

function ResetPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const hasConfirmValue = Boolean(newPassword && confirmPassword);
  const passwordsMatch = hasConfirmValue && newPassword === confirmPassword;

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsValidSession(true);
        setError("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updatePassword(newPassword);

      if (result.success) {
        if (result.requiresRelogin) {
          navigate("/login", {
            replace: true,
            state: {
              authMessage: result.message || "Password updated, please log in again.",
              authSubMessage: "For security, your password reset ended the current session.",
            },
          });
          return;
        }

        setStep(2);
      } else {
        setError(result.error);
      }
    } catch (err) {
      const message = typeof err?.message === "string" && err.message.toLowerCase().includes("auth session missing")
        ? "Auth session missing. Please refresh the page or log in again for security before updating your password."
        : "Something went wrong while updating your password. Please refresh the page or log in again and try once more.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthLogo />

      <div className={step === 2 ? "auth-success-ring" : "auth-page-icon"}>
        {step === 2 ? <span><Check /></span> : <Key />}
      </div>

      <div className="auth-card">
        <div className="auth-card-heading">
          <h1>{step === 1 ? "Create new password" : "Password reset complete"}</h1>
          <p>{step === 1 ? "Choose a secure password for your account" : "You can now sign in with your new password."}</p>
        </div>

        {step === 1 && !isValidSession && !error && (
          <div className="auth-loading-state">
            <Loader2 className="spin" />
            <p>Validating secure link...</p>
          </div>
        )}

        {step === 1 && !isValidSession && error && (
          <div className="auth-success-content">
            <div className="auth-error-box">{error}</div>
            <button type="button" onClick={() => navigate("/forgot-password")} className="auth-primary-button">
              <span>Request New Link</span>
              <ArrowRight />
            </button>
          </div>
        )}

        {step === 1 && isValidSession && (
          <form onSubmit={handlePasswordReset} className="auth-form">
            {error && <div className="auth-error-box">{error}</div>}

            <div className="auth-field" style={{ animationDelay: "0.1s" }}>
              <label>NEW PASSWORD</label>
              <div className="input-wrapper has-right-icon">
                <Lock className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create a new password"
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

            <div className="auth-field" style={{ animationDelay: "0.2s" }}>
              <label>CONFIRM NEW PASSWORD</label>
              <div className={`input-wrapper has-right-icon ${hasConfirmValue ? passwordsMatch ? "is-valid" : "is-invalid" : ""}`}>
                <Shield className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                />
                <span className="input-icon-right auth-match-icon">
                  {hasConfirmValue ? passwordsMatch ? <CheckCircle /> : null : null}
                </span>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="auth-primary-button">
              <span>Reset Password</span>
              {isLoading ? <Loader2 className="spin" /> : <Check />}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="auth-success-content">
            <div className="auth-success-note">
              <CheckCircle />
              <span>Your password has been successfully reset.</span>
            </div>
            <button type="button" onClick={() => navigate("/login")} className="auth-primary-button auth-primary-button--success">
              <span>Go to Sign In</span>
              <ArrowRight />
            </button>
          </div>
        )}
      </div>

      <p className="auth-footer-copy">© 2026 AutoValueLK. All rights reserved.</p>
    </div>
  );
}

export default ResetPassword;
