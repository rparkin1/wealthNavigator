import React, { useState } from 'react';

/**
 * AppShell Component
 *
 * The main application layout structure with top bar, sidebar, and content area.
 * Responsive design that adapts to mobile with bottom navigation.
 *
 * @example
 * ```tsx
 * <AppShell
 *   topBar={<TopBar />}
 *   sidebar={<Sidebar />}
 *   mobileNav={<MobileNav />}
 * >
 *   <YourContent />
 * </AppShell>
 * ```
 */

export interface AppShellProps {
  /** Top bar component */
  topBar?: React.ReactNode;
  /** Sidebar component (desktop only) */
  sidebar?: React.ReactNode;
  /** Mobile navigation (mobile only) */
  mobileNav?: React.ReactNode;
  /** Main content */
  children: React.ReactNode;
  /** Initial sidebar state */
  sidebarDefaultOpen?: boolean;
  /** Callback when sidebar open state changes */
  onSidebarChange?: (isOpen: boolean) => void;
  /** Additional CSS classes */
  className?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  topBar,
  sidebar,
  mobileNav,
  children,
  sidebarDefaultOpen = true,
  onSidebarChange,
  className = '',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(sidebarDefaultOpen);

  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    onSidebarChange?.(newState);
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Top Bar */}
      {topBar && (
        <header className="fixed top-0 left-0 right-0 z-fixed bg-white border-b border-gray-200">
          {topBar}
        </header>
      )}

      {/* Main Content Area */}
      <div className={`flex ${topBar ? 'pt-16' : ''}`}>
        {/* Desktop Sidebar */}
        {sidebar && (
          <>
            {/* Sidebar Backdrop (mobile only) */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-gray-900 bg-opacity-50 z-modal-backdrop lg:hidden"
                onClick={handleSidebarToggle}
                aria-hidden="true"
              />
            )}

            {/* Sidebar */}
            <aside
              className={`
                fixed top-16 left-0 bottom-0 z-sticky bg-white border-r border-gray-200
                transition-transform duration-base ease-in-out
                lg:sticky lg:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                w-64 overflow-y-auto
              `}
            >
              {sidebar}
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="h-full pb-16 lg:pb-0">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {mobileNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-fixed bg-white border-t border-gray-200 lg:hidden">
          {mobileNav}
        </nav>
      )}
    </div>
  );
};

AppShell.displayName = 'AppShell';

export default AppShell;
