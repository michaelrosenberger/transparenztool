import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  asPage?: boolean; // When true, adds min-h-screen, py-8, and bg-background
  dark?: boolean; // When true, adds min-h-screen, py-8, bg-black, and text-white
  fullWidth?: boolean; // When true, removes max-w-7xl constraint
}

export default function Container({ children, className = "", asPage = false, dark = false, fullWidth = false }: ContainerProps) {
  if (asPage) {
    return (
      <div className="min-h-screen py-8 bg-background">
        <div className={`${fullWidth ? '' : 'max-w-7xl mx-auto px-5 sm:px-6 lg:px-8'} ${className}`}>
          {children}
        </div>
      </div>
    );
  }

  if (dark) {
    return (
      <div className="py-8 bg-black text-white">
        <div className={`${fullWidth ? '' : 'max-w-7xl mx-auto px-5 sm:px-6 lg:px-8'} ${className}`}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`${fullWidth ? '' : 'max-w-7xl mx-auto px-5 sm:px-6 lg:px-8'} ${className}`}>
      {children}
    </div>
  );
}
