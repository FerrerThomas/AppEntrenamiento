import React from 'react';

export default function Button({ children, variant = 'primary', size = 'default', className = '', ...props }) {
  const baseStyles = "inline-flex items-center justify-center font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-xl";
  const variants = {
    primary: "bg-primary text-surface-0 hover:bg-primary-dim shadow-glow",
    secondary: "bg-surface-1 border border-surface-2 text-white hover:bg-surface-2",
    ghost: "bg-transparent text-white hover:bg-surface-1"
  };
  const sizes = {
    default: "px-4 py-3 text-base",
    sm: "px-3 py-2 text-sm",
    lg: "px-6 py-4 text-lg w-full"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
