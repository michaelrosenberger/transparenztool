import { ReactNode } from "react";
import {
  Card as ShadcnCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  noBorder?: boolean; // When true, removes border and ensures white background
  id?: string; // HTML id attribute for anchor linking
}

export default function Card({ children, className = "", title, noBorder = false, id }: CardProps) {
  return (
    <ShadcnCard id={id} className={`${noBorder ? 'border-0 bg-white' : ''} ${className}`}>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? "" : noBorder ? "p-0" : ""}>
        {children}
      </CardContent>
    </ShadcnCard>
  );
}
