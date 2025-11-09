/**
 * ScreenReaderOnly Component
 *
 * Visually hides content but keeps it accessible to screen readers
 */

import React from 'react';

export interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  /**
   * HTML element type
   */
  as?: keyof JSX.IntrinsicElements;
}

export function ScreenReaderOnly({ children, as: Component = 'span' }: ScreenReaderOnlyProps) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
}
