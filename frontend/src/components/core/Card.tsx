/**
 * Professional Card Component
 * WealthNavigator AI Design System
 *
 * Features:
 * - Clean white background
 * - Subtle borders and shadows
 * - Structured header/content/footer
 * - Hover states
 */

import { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick,
}: CardProps) {
  const baseStyles = 'bg-white border border-slate-200 rounded-lg overflow-hidden';

  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadowStyles = hover
    ? 'shadow-sm hover:shadow-md transition-shadow duration-200'
    : 'shadow-sm';

  const clickableStyles = onClick ? 'cursor-pointer hover:border-slate-300' : '';

  return (
    <div
      className={`${baseStyles} ${paddingStyles[padding]} ${shadowStyles} ${clickableStyles} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function CardHeader({ children, className = '', actions }: CardHeaderProps) {
  return (
    <div className={`flex items-center justify-between border-b border-slate-100 pb-4 mb-4 ${className}`}>
      <div className="flex-1">{children}</div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-xl font-semibold text-slate-900 ${className}`}>
      {children}
    </h3>
  );
}

export interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={className}>{children}</div>;
}

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`flex items-center gap-3 pt-4 mt-4 border-t border-slate-100 ${className}`}>
      {children}
    </div>
  );
}
