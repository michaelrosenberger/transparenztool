import Container from "./Container";
import DynamicBreadcrumbs from "./DynamicBreadcrumbs";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  showBreadcrumbs?: boolean;
}

export default function PageHeader({ 
  title, 
  subtitle, 
  children,
  showBreadcrumbs = true 
}: PageHeaderProps) {
  return (
    <Container dark fullWidth>
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 mb-6">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
          {children}
        </div>
        {showBreadcrumbs && (
          <DynamicBreadcrumbs className="mt-4" darkMode />
        )}
      </div>
    </Container>
  );
}
