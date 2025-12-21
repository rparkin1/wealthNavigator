/**
 * IconRenderer Component
 *
 * Dynamically renders Heroicons based on icon name string.
 * Used throughout the app to display icons from API responses and metadata.
 */

import React from 'react';
import {
  ShieldCheckIcon,
  FlagIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  LinkIcon,
  BriefcaseIcon,
  HeartIcon,
  HomeIcon,
  RocketLaunchIcon,
  UserIcon,
  ArchiveBoxIcon,
  SparklesIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ComputerDesktopIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export type IconName =
  | 'ShieldCheckIcon'
  | 'FlagIcon'
  | 'BanknotesIcon'
  | 'ChartBarIcon'
  | 'ExclamationTriangleIcon'
  | 'GlobeAltIcon'
  | 'ArrowTrendingUpIcon'
  | 'ArrowTrendingDownIcon'
  | 'ArrowPathIcon'
  | 'LinkIcon'
  | 'BriefcaseIcon'
  | 'HeartIcon'
  | 'HomeIcon'
  | 'RocketLaunchIcon'
  | 'UserIcon'
  | 'ArchiveBoxIcon'
  | 'SparklesIcon'
  | 'CalendarDaysIcon'
  | 'BuildingOffice2Icon'
  | 'CheckCircleIcon'
  | 'ExclamationCircleIcon'
  | 'ComputerDesktopIcon'
  | 'ClockIcon';

const ICON_MAP: Record<IconName, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  ShieldCheckIcon,
  FlagIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  LinkIcon,
  BriefcaseIcon,
  HeartIcon,
  HomeIcon,
  RocketLaunchIcon,
  UserIcon,
  ArchiveBoxIcon,
  SparklesIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ComputerDesktopIcon,
  ClockIcon,
};

export interface IconRendererProps {
  /** Icon name string (e.g., 'ShieldCheckIcon') */
  name: string;
  /** CSS class name for styling */
  className?: string;
  /** Color for the icon */
  color?: string;
  /** Additional style overrides */
  style?: React.CSSProperties;
}

/**
 * Renders a Heroicon based on the provided icon name
 */
export function IconRenderer({ name, className = 'w-5 h-5', color, style }: IconRendererProps) {
  const IconComponent = ICON_MAP[name as IconName];

  if (!IconComponent) {
    // Fallback to ChartBarIcon if icon not found
    console.warn(`Icon "${name}" not found in IconRenderer map. Using ChartBarIcon as fallback.`);
    return <ChartBarIcon className={className} style={{ color, ...style }} />;
  }

  return <IconComponent className={className} style={{ color, ...style }} />;
}

/**
 * Hook to get an icon component by name
 */
export function useIcon(name: string): React.ComponentType<React.SVGProps<SVGSVGElement>> {
  return ICON_MAP[name as IconName] || ChartBarIcon;
}

export default IconRenderer;
