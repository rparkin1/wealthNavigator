import React from 'react';

/**
 * Goal Icons
 *
 * Professional SVG icons for goal categories (replacing emojis).
 * Follows the design system guidelines for a professional financial interface.
 */

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

/**
 * Retirement Icon - Line chart trending upward
 */
export const RetirementIcon: React.FC<IconProps> = ({ className = '', size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M3 3v18h18" />
    <path d="M18 17l-3-3-4 4-4-4-4 4" />
    <path d="M18 9l-3 3-4-4-4 4-4-4" />
  </svg>
);

/**
 * Education Icon - Graduation cap
 */
export const EducationIcon: React.FC<IconProps> = ({ className = '', size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

/**
 * Home Icon - House
 */
export const HomeIcon: React.FC<IconProps> = ({ className = '', size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

/**
 * Major Expense Icon - Dollar sign in circle
 */
export const MajorExpenseIcon: React.FC<IconProps> = ({ className = '', size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H6" />
    <path d="M12 18V6" />
  </svg>
);

/**
 * Emergency Icon - Shield with checkmark
 */
export const EmergencyIcon: React.FC<IconProps> = ({ className = '', size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

/**
 * Legacy Icon - Star
 */
export const LegacyIcon: React.FC<IconProps> = ({ className = '', size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/**
 * More Icon - Three dots menu
 */
export const MoreIcon: React.FC<IconProps> = ({ className = '', size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

/**
 * Calendar Icon - Used for target dates
 */
export const CalendarIcon: React.FC<IconProps> = ({ className = '', size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

/**
 * Get category icon component
 */
export function getCategoryIcon(
  category: 'retirement' | 'education' | 'home' | 'major_expense' | 'emergency' | 'legacy',
  props?: IconProps
): React.ReactElement {
  const iconMap = {
    retirement: RetirementIcon,
    education: EducationIcon,
    home: HomeIcon,
    major_expense: MajorExpenseIcon,
    emergency: EmergencyIcon,
    legacy: LegacyIcon,
  };

  const IconComponent = iconMap[category];
  return <IconComponent {...props} />;
}

/**
 * Get category label
 */
export function getCategoryLabel(
  category: 'retirement' | 'education' | 'home' | 'major_expense' | 'emergency' | 'legacy'
): string {
  const labels = {
    retirement: 'Retirement',
    education: 'Education',
    home: 'Home Purchase',
    major_expense: 'Major Expense',
    emergency: 'Emergency Fund',
    legacy: 'Legacy Planning',
  };
  return labels[category];
}
