import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export const AlertMessage = ({ type = 'info', title, message, onClose }) => {
  if (!message) return null;

  const styles = {
    success: 'bg-emerald-50 border-emerald-300 text-emerald-900 icon-emerald',
    error: 'bg-rose-50 border-rose-300 text-rose-900 icon-rose',
    warning: 'bg-amber-50 border-amber-300 text-amber-900 icon-amber',
    info: 'bg-sky-50 border-sky-300 text-sky-900 icon-sky'
  };

  const IconComponent = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  }[type] || Info;

  return (
    <div className={`alert-box ${styles[type] || styles.info}`}>
      <div className="alert-content">
        <IconComponent className="alert-icon" size={20} />
        <div>
          {title && <h4 className="alert-title">{title}</h4>}
          <p className="alert-desc">{message}</p>
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="alert-close-btn" title="Dismiss">
          &times;
        </button>
      )}
    </div>
  );
};
