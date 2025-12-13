import React from 'react';

/**
 * Card Component
 *
 * A container component with multiple variants for different elevation levels.
 * Used throughout the application for grouping related content.
 *
 * @example
 * ```tsx
 * <Card variant="default" padding="md" hoverable>
 *   <CardHeader title="Retirement 2045" />
 *   <CardContent>
 *     <ProgressBar value={82} />
 *   </CardContent>
 *   <CardFooter>
 *     <Button>View Details</Button>
 *   </CardFooter>
 * </Card>
 * ```
 */

export type CardVariant = 'default' | 'elevated' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: CardVariant;
  /** Padding size */
  padding?: CardPadding;
  /** Hoverable state with lift effect */
  hoverable?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Card content */
  children: React.ReactNode;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Header title */
  title?: React.ReactNode;
  /** Subtitle or description */
  subtitle?: React.ReactNode;
  /** Badge or tag element */
  badge?: React.ReactNode;
  /** Action buttons or menu */
  action?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Children elements */
  children?: React.ReactNode;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes */
  className?: string;
  /** Content */
  children: React.ReactNode;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Additional CSS classes */
  className?: string;
  /** Footer content */
  children: React.ReactNode;
}

/**
 * Main Card Component
 */
export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  className = '',
  children,
  ...props
}) => {
  // Base styles
  const baseStyles = [
    'bg-white',
    'rounded-lg',
    'overflow-hidden',
    'transition-all',
    'duration-base',
  ].join(' ');

  // Variant styles
  const variantStyles: Record<CardVariant, string> = {
    default: 'border border-gray-200 shadow-md',
    elevated: 'border border-gray-200 shadow-lg',
    flat: 'border border-gray-200 shadow-none',
  };

  // Padding styles (applied only if children are not Card subcomponents)
  const paddingStyles: Record<CardPadding, string> = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Hoverable styles
  const hoverStyles = hoverable
    ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
    : '';

  // Check if children contains CardHeader/CardContent/CardFooter
  const hasCardSubcomponents = React.Children.toArray(children).some(
    (child) =>
      React.isValidElement(child) &&
      (child.type === CardHeader ||
        child.type === CardContent ||
        child.type === CardFooter)
  );

  const cardClasses = [
    baseStyles,
    variantStyles[variant],
    !hasCardSubcomponents ? paddingStyles[padding] : '',
    hoverStyles,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

/**
 * Card Header Component
 */
export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  badge,
  action,
  className = '',
  children,
  ...props
}) => {
  const headerClasses = [
    'px-6',
    'py-4',
    'border-b',
    'border-gray-100',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={headerClasses} {...props}>
      {children || (
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {title && (
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {title}
                </h3>
                {badge && <div className="flex-shrink-0">{badge}</div>}
              </div>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 line-clamp-2">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0 ml-4">{action}</div>}
        </div>
      )}
    </div>
  );
};

/**
 * Card Content Component
 */
export const CardContent: React.FC<CardContentProps> = ({
  className = '',
  children,
  ...props
}) => {
  const contentClasses = ['px-6', 'py-4', className].filter(Boolean).join(' ');

  return (
    <div className={contentClasses} {...props}>
      {children}
    </div>
  );
};

/**
 * Card Footer Component
 */
export const CardFooter: React.FC<CardFooterProps> = ({
  className = '',
  children,
  ...props
}) => {
  const footerClasses = [
    'px-6',
    'py-4',
    'border-t',
    'border-gray-100',
    'flex',
    'items-center',
    'gap-3',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={footerClasses} {...props}>
      {children}
    </div>
  );
};

// Set display names for better debugging
Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export default Card;
