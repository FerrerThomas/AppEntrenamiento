import React from 'react';

export default function Card({ children, className = '', padding = 'p-4', glass = false, ...props }) {
  const baseClass = glass ? 'glass rounded-xl' : 'bg-surface-1 border border-surface-2 rounded-xl';
  return (
    <div className={`${baseClass} ${padding} ${className}`} {...props}>
      {children}
    </div>
  );
}
