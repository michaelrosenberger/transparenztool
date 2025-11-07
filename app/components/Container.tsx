import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  asPage?: boolean; // When true, adds min-h-screen, py-8, and bg-background
}

export default function Container({ children, className = "", asPage = false }: ContainerProps) {
  if (asPage) {
    return (
      <div className="min-h-screen py-8 bg-background">
        <div className={`max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 ${className}`}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
