import React from 'react';
import logo from "../../assets/logo/autovaluelk-logo.png";

const LoadingOverlay = ({ isOpen, message }) => {
  if (!isOpen) return null;

  return (
    <div className="auth-loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="auth-loading-card">
        <div className="auth-loading-logo">
          <img src={logo} alt="AutoValueLK" />
        </div>
        <div className="auth-loading-ring" aria-hidden="true" />
        <div className="auth-loading-progress" aria-hidden="true">
          <span />
        </div>
        <p>{message || "Please wait..."}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
