import React from 'react';
import logo from "../../assets/logo/autovaluelk-logo.png";

const LoadingOverlay = ({ isOpen, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f172a]/80 backdrop-blur-md animate-fade-in">
      <div className="flex flex-col items-center text-center">
        <img 
          src={logo} 
          alt="AutoValueLK" 
          className="h-20 object-contain mb-8 animate-pulse-glow" 
        />
        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mb-6 relative">
          <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] rounded-full animate-progress-indeterminate"></div>
        </div>
        <p className="text-white text-lg font-medium tracking-wide">
          {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
