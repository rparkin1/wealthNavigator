import React from 'react';
import { Button } from '../ui';

/**
 * TopBar Component
 *
 * Global navigation bar displayed at the top of the application.
 * Contains logo, quick actions, and user menu.
 *
 * @example
 * ```tsx
 * <TopBar
 *   logo={<Logo />}
 *   onMenuClick={handleMenuClick}
 *   actions={<Button>New Goal</Button>}
 *   userMenu={<UserMenu />}
 * />
 * ```
 */

export interface TopBarProps {
  /** Logo or brand element */
  logo?: React.ReactNode;
  /** Menu button click handler (for mobile sidebar) */
  onMenuClick?: () => void;
  /** Quick action buttons */
  actions?: React.ReactNode;
  /** User profile menu */
  userMenu?: React.ReactNode;
  /** Global search component */
  search?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  logo,
  onMenuClick,
  actions,
  userMenu,
  search,
  className = '',
}) => {
  return (
    <div className={`h-16 px-4 lg:px-6 flex items-center gap-4 ${className}`}>
      {/* Left Section: Menu + Logo */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Logo */}
        {logo && (
          <div className="flex items-center">
            {logo}
          </div>
        )}
      </div>

      {/* Center Section: Search */}
      {search && (
        <div className="hidden lg:flex flex-1 max-w-xl mx-4">
          {search}
        </div>
      )}

      {/* Right Section: Actions + User Menu */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Quick Actions */}
        {actions && (
          <div className="hidden md:flex items-center gap-2">
            {actions}
          </div>
        )}

        {/* User Menu */}
        {userMenu && (
          <div className="flex items-center">
            {userMenu}
          </div>
        )}
      </div>
    </div>
  );
};

TopBar.displayName = 'TopBar';

export default TopBar;
