import React from 'react';

/**
 * MobileNav Component
 *
 * Bottom navigation for mobile devices.
 * Displays primary navigation items with icons and labels.
 *
 * @example
 * ```tsx
 * <MobileNav>
 *   <MobileNavItem icon={<HomeIcon />} label="Dashboard" href="/dashboard" active />
 *   <MobileNavItem icon={<GoalIcon />} label="Goals" href="/goals" />
 *   <MobileNavItem icon={<ChatIcon />} label="Chat" href="/chat" />
 * </MobileNav>
 * ```
 */

export interface MobileNavProps {
  /** Navigation items */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export interface MobileNavItemProps {
  /** Icon element */
  icon: React.ReactNode;
  /** Item label */
  label: string;
  /** Link href */
  href?: string;
  /** Active state */
  active?: boolean;
  /** Badge or notification dot */
  badge?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Mobile Navigation Container
 */
export const MobileNav: React.FC<MobileNavProps> = ({ children, className = '' }) => {
  return (
    <div className={`h-16 px-2 flex items-center justify-around ${className}`}>
      {children}
    </div>
  );
};

/**
 * Mobile Navigation Item
 */
export const MobileNavItem: React.FC<MobileNavItemProps> = ({
  icon,
  label,
  href,
  active = false,
  badge,
  onClick,
  className = '',
}) => {
  const baseClasses = [
    'flex flex-col items-center justify-center gap-1',
    'min-w-[64px] px-3 py-2 rounded-lg',
    'text-xs font-medium transition-colors',
  ].join(' ');

  const stateClasses = active
    ? 'text-primary-600 bg-primary-50'
    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';

  const itemClasses = `${baseClasses} ${stateClasses} ${className}`;

  const content = (
    <>
      <div className="relative">
        <span className="w-6 h-6 flex items-center justify-center">
          {icon}
        </span>
        {badge && (
          <span className="absolute -top-1 -right-1">
            {badge}
          </span>
        )}
      </div>
      <span className="truncate max-w-full">{label}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={itemClasses}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      className={itemClasses}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      {content}
    </button>
  );
};

// Display names
MobileNav.displayName = 'MobileNav';
MobileNavItem.displayName = 'MobileNavItem';

export default MobileNav;
