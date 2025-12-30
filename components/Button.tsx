import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl'; // xl for mobile driver
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl active:scale-95 shadow-sm";
  
  const variants = {
    primary: "bg-gradient-to-br from-primary to-blue-600 text-white hover:to-blue-700 shadow-blue-200/50",
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 dark:bg-slate-700 dark:text-white dark:border-slate-600",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-red-200/50",
    success: "bg-green-500 text-white hover:bg-green-600 shadow-green-200/50",
    outline: "border-2 border-slate-300 text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-800",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-5 py-3 text-base",
    lg: "px-6 py-4 text-lg",
    xl: "px-6 py-4 text-lg md:text-xl uppercase tracking-wide", // Optimized for driver gloves
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};