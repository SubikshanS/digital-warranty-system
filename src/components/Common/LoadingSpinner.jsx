import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ label = 'Loading blockchain data...' }) => {
  return (
    <div className="spinner-container">
      <Loader2 className="animate-spin text-indigo-600" size={36} />
      <span className="spinner-label">{label}</span>
    </div>
  );
};
