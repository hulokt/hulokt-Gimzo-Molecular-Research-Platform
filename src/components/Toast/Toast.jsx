"use client";

import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, Copy } from "lucide-react";

const Toast = ({ message, type = "info", onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const bgColors = {
    success: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
    error: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
    info: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
  };

  const textColors = {
    success: "text-green-800 dark:text-green-200",
    error: "text-red-800 dark:text-red-200",
    info: "text-blue-800 dark:text-blue-200",
  };

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] flex min-w-[300px] max-w-md items-start gap-3 rounded-lg border p-4 shadow-xl transition-all duration-300 ${bgColors[type]}`}
      style={{
        animation: "slideInRight 0.3s ease-out",
      }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `
      }} />
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className={`flex-1 text-sm font-medium ${textColors[type]}`}>
        {message}
      </div>
      <button
        onClick={onClose}
        className={`flex-shrink-0 rounded p-1 transition-colors hover:bg-black/10 ${textColors[type]}`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;

