/**
 * AccessibleLink Component
 *
 * Fully accessible link with proper ARIA attributes
 */

import React from 'react';

export interface AccessibleLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Whether link opens in new window/tab
   */
  external?: boolean;

  /**
   * Whether link is currently active
   */
  isActive?: boolean;

  children: React.ReactNode;
}

export function AccessibleLink({
  children,
  external = false,
  isActive = false,
  className,
  ...props
}: AccessibleLinkProps) {
  return (
    <a
      className={`
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        hover:underline
        ${isActive ? 'font-semibold' : ''}
        ${className || ''}
      `.trim()}
      aria-current={isActive ? 'page' : undefined}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
      {external && (
        <span className="sr-only"> (opens in new window)</span>
      )}
    </a>
  );
}
