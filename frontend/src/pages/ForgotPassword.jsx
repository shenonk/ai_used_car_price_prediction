import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Check, CheckCircle, Cpu, Info, Key, Loader2, Lock, Mail } from "lucide-react";
import { resetPassword } from "../utils/auth";

function AuthLogo() {
  return (
    <div className="auth-logo-block">
      <div className="auth-logo-icon"><Cpu /></div>
      <strong>AutoValueLK</strong>
      <span>Sri Lankan vehicle intelligence</span>
    </div>
  );
}

function StepIndicator({ step }) {
  return (
    <div className="auth-stepper">
      <span className={step >= 1 ? step > 1 ? "is-complete" : "is-active" : ""}>
        {step > 1 ? <Check /> : "1"}
      </span>
      <i className={step > 1 ? "is-complete" : ""} />
      <span className={step === 2 ? "is-active" : ""}>2</span>
    </div>
  );
}

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await resetPassword(email);
    setIsLoading(false);

    if (result.success) {
      setStep(2);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-page">
      <AuthLogo />

      {step === 1 ? (
        <div className="auth-page-icon"><Key /></div>
      ) : (
        <div className="auth-success-ring">
          <span><Mail /></span>
        </div>
      )}

      <div className="auth-card">
        <div className="auth-card-heading">
          <h1>{step === 1 ? "Reset your password" : "Check your inbox"}</h1>
          {step === 1 ? (
            <p>Enter your email to receive a reset link</p>
          ) : (
            <>
              <p>We've sent a password recovery link to your email.</p>
              <p>Click the link in the email to reset your password.</p>
            </>
          )}
        </div>

        <StepIndicator step={step} />

        {step === 1 ? (
          <form onSubmit={handleEmailSubmit} className="auth-form">
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

            <div className="auth-info-note">
              <Info />
              <span>We'll verify your email and send a secure reset link</span>
            </div>

            <button type="submit" disabled={isLoading} className="auth-primary-button">
              <span>Send Reset Link</span>
              {isLoading ? <Loader2 className="spin" /> : <ArrowRight />}
            </button>
          </form>
        ) : (
          <div className="auth-success-content">
            <div className="auth-success-note">
              <CheckCircle />
              <span>Email sent successfully. Check your spam folder if not received.</span>
            </div>
            <button type="button" onClick={() => navigate("/login")} className="auth-primary-button auth-primary-button--success">
              <span>Go to Sign In</span>
              <ArrowRight />
            </button>
            <p className="auth-resend-row">
              Didn't receive it? <button type="button" onClick={handleEmailSubmit}>Resend email</button>
            </p>
          </div>
        )}
      </div>

      {step === 1 && (
        <p className="auth-bottom-link">
          Remember your password? <Link to="/login">Sign in</Link>
        </p>
      )}

      <div className="auth-security-note">
        <Lock />
        <span>Secured with 256-bit encryption</span>
      </div>
      <p className="auth-footer-copy">© 2026 AutoValueLK. All rights reserved.</p>
    </div>
  );
}

export default ForgotPassword;
