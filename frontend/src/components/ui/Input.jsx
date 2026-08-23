import React from 'react';

export default function Input({ className = '', type = 'text', icon: Icon, rightIcon: RightIcon, ...props }) {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon size={18} />
        </div>
      )}
      <input
        type={type}
        className={`w-full bg-[#1c1b1b] border border-[#2a2a2a] rounded-xl py-3.5 text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${Icon ? 'pl-11' : 'px-4'} ${RightIcon ? 'pr-11' : 'pr-4'} ${className}`}
        {...props}
      />
      {RightIcon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-white transition-colors">
          <RightIcon size={18} />
        </div>
      )}
    </div>
  );
}
