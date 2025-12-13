import React, { useState, useRef, useEffect } from 'react';

/**
 * Dropdown Component
 *
 * Accessible dropdown menu with keyboard navigation.
 * Used for user menus, action menus, and context menus.
 *
 * @example
 * ```tsx
 * <Dropdown
 *   trigger={<Button>Options</Button>}
 *   align="right"
 * >
 *   <DropdownItem onClick={handleEdit}>Edit</DropdownItem>
 *   <DropdownItem onClick={handleDelete} variant="danger">Delete</DropdownItem>
 *   <DropdownDivider />
 *   <DropdownItem onClick={handleArchive}>Archive</DropdownItem>
 * </Dropdown>
 * ```
 */

export type DropdownAlign = 'left' | 'right';

export interface DropdownProps {
  /** Trigger element */
  trigger: React.ReactNode;
  /** Dropdown content */
  children: React.ReactNode;
  /** Alignment */
  align?: DropdownAlign;
  /** Additional CSS classes */
  className?: string;
}

export interface DropdownItemProps {
  /** Item label */
  children: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Icon before text */
  icon?: React.ReactNode;
  /** Item variant */
  variant?: 'default' | 'danger';
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface DropdownDividerProps {
  className?: string;
}

/**
 * Main Dropdown Component
 */
export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  align = 'left',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const alignClasses = align === 'right' ? 'right-0' : 'left-0';

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            absolute ${alignClasses} mt-2 w-56
            bg-white rounded-lg shadow-lg border border-gray-200
            py-1 z-dropdown
            animate-in fade-in slide-in-from-top-2 duration-200
          `}
          role="menu"
          aria-orientation="vertical"
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child) && child.type === DropdownItem) {
              return React.cloneElement(child as React.ReactElement<DropdownItemProps>, {
                onClick: () => {
                  child.props.onClick?.();
                  setIsOpen(false);
                },
              });
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Dropdown Item Component
 */
export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  onClick,
  icon,
  variant = 'default',
  disabled = false,
  className = '',
}) => {
  const baseClasses = [
    'w-full px-4 py-2 text-left text-sm',
    'flex items-center gap-3',
    'transition-colors',
  ].join(' ');

  const variantClasses =
    variant === 'danger'
      ? 'text-error-700 hover:bg-error-50'
      : 'text-gray-700 hover:bg-gray-100';

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';

  const itemClasses = `${baseClasses} ${variantClasses} ${disabledClasses} ${className}`;

  return (
    <button
      className={itemClasses}
      onClick={onClick}
      disabled={disabled}
      role="menuitem"
    >
      {icon && <span className="flex-shrink-0 w-5 h-5">{icon}</span>}
      <span className="flex-1">{children}</span>
    </button>
  );
};

/**
 * Dropdown Divider Component
 */
export const DropdownDivider: React.FC<DropdownDividerProps> = ({ className = '' }) => {
  return <div className={`my-1 border-t border-gray-200 ${className}`} role="separator" />;
};

// Display names
Dropdown.displayName = 'Dropdown';
DropdownItem.displayName = 'DropdownItem';
DropdownDivider.displayName = 'DropdownDivider';

export default Dropdown;
