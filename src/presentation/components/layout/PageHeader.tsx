import type { ReactNode } from 'react';

export function PageHeader({
  crumb = 'Workspace',
  title,
  subtitle,
  children,
}: {
  crumb?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <div className="page-crumb">{crumb}</div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
