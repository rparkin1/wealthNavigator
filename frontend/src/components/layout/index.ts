/**
 * WealthNavigator Layout Components
 *
 * Application shell, navigation, and structural components.
 */

// App Shell
export { default as AppShell } from './AppShell';
export type { AppShellProps } from './AppShell';

// Navigation
export { default as TopBar } from './TopBar';
export type { TopBarProps } from './TopBar';

export { default as Sidebar, SidebarSection, SidebarItem } from './Sidebar';
export type { SidebarProps, SidebarSectionProps, SidebarItemProps } from './Sidebar';

export { default as MobileNav, MobileNavItem } from './MobileNav';
export type { MobileNavProps, MobileNavItemProps } from './MobileNav';

// Overlays
export { default as Modal, ModalBody, ModalFooter } from './Modal';
export type { ModalProps, ModalBodyProps, ModalFooterProps, ModalSize } from './Modal';

export { default as Dropdown, DropdownItem, DropdownDivider } from './Dropdown';
export type { DropdownProps, DropdownItemProps, DropdownAlign } from './Dropdown';

export { default as Tooltip } from './Tooltip';
export type { TooltipProps, TooltipPlacement } from './Tooltip';

// Toast
export { default as ToastProvider, useToast } from './Toast';
export type { ToastVariant, ToastOptions, ToastAction } from './Toast';
