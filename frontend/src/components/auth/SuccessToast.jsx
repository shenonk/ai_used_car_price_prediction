import React from 'react';

const SuccessToast = ({ isOpen, message, subMessage }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
      <div className="bg-slate-900 border-l-4 border-emerald-500 rounded-r-xl shadow-2xl p-4 min-w-[300px] flex items-start gap-4">
        <div className="bg-emerald-500/10 rounded-full p-2">
          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h4 className="text-white font-semibold text-lg">{message}</h4>
          {subMessage && <p className="text-slate-400 text-sm mt-1">{subMessage}</p>}
        </div>
      </div>
    </div>
  );
};

export default SuccessToast;
