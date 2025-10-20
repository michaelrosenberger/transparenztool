import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export default function Card({ children, className = "", title }: CardProps) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm ${className}`}>
      {title && <h2 className="text-2xl font-semibold mb-4 text-black">{title}</h2>}
      {children}
    </div>
  );
}
