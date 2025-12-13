import React from 'react';

/**
 * Sidebar Component
 *
 * Navigation sidebar for desktop layouts.
 * Displays navigation items, thread lists, or other persistent content.
 *
 * @example
 * ```tsx
 * <Sidebar>
 *   <SidebarSection title="Navigation">
 *     <SidebarItem icon={<HomeIcon />} label="Dashboard" href="/dashboard" />
 *     <SidebarItem icon={<GoalIcon />} label="Goals" href="/goals" />
 *   </SidebarSection>
 * </Sidebar>
 * ```
 */

export interface SidebarProps {
  /** Sidebar content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export interface SidebarSectionProps {
  /** Section title */
  title?: string;
  /** Section content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export interface SidebarItemProps {
  /** Icon element */
  icon?: React.ReactNode;
  /** Item label */
  label: string;
  /** Link href */
  href?: string;
  /** Active state */
  active?: boolean;
  /** Badge or count */
  badge?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Main Sidebar Component
 */
export const Sidebar: React.FC<SidebarProps> = ({ children, className = '' }) => {
  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex-1 overflow-y-auto py-4">
        {children}
      </div>
    </div>
  );
};

/**
 * Sidebar Section Component
 */
export const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  children,
  className = '',
}) => {
  return (
    <div className={`px-3 mb-6 ${className}`}>
      {title && (
        <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <nav className="space-y-1">
        {children}
      </nav>
    </div>
  );
};

/**
 * Sidebar Item Component
 */
export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  href,
  active = false,
  badge,
  onClick,
  className = '',
}) => {
  const baseClasses = [
    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
    'hover:bg-gray-100',
  ].join(' ');

  const stateClasses = active
    ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
    : 'text-gray-700 hover:text-gray-900';

  const itemClasses = `${baseClasses} ${stateClasses} ${className}`;

  const content = (
    <>
      {icon && (
        <span className="flex-shrink-0 w-5 h-5">
          {icon}
        </span>
      )}
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="flex-shrink-0">
          {badge}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a href={href} className={itemClasses} onClick={onClick}>
        {content}
      </a>
    );
  }

  return (
    <button className={`${itemClasses} w-full`} onClick={onClick}>
      {content}
    </button>
  );
};

// Display names
Sidebar.displayName = 'Sidebar';
SidebarSection.displayName = 'SidebarSection';
SidebarItem.displayName = 'SidebarItem';

export default Sidebar;
