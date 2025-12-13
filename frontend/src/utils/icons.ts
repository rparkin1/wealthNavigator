/**
 * Professional Icon System - SVG Icons Only (Zero Emoji)
 * WealthNavigator AI Design System
 *
 * All icons imported from @heroicons/react
 * - 24/outline: Standard line icons
 * - 24/solid: Filled icons for emphasis
 */

import {
  // Goal Categories
  TrendingUpIcon,
  AcademicCapIcon,
  HomeIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  GiftIcon,

  // Status Indicators
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  BadgeCheckIcon,

  // Actions
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  ArrowPathIcon,

  // Navigation
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowLeftIcon,
  ArrowRightIcon,

  // Features
  LinkIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CogIcon,
  BellIcon,
  UserCircleIcon,
  Bars3Icon,

  // Mental Accounting / Features
  BeakerIcon,  // Buckets
  ArrowTrendingUpIcon,  // Trending/Waterfall
  ScaleIcon,  // Rebalance
  BanknotesIcon,  // Funding
  SparklesIcon,  // AI

  // Milestones
  FlagIcon,
  ClockIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

import {
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  XCircleIcon as XCircleIconSolid,
  BadgeCheckIcon as BadgeCheckIconSolid,
} from '@heroicons/react/24/solid';

/**
 * Goal Category Icons
 * Used for goal type identification
 */
export const categoryIcons = {
  retirement: TrendingUpIcon,
  education: AcademicCapIcon,
  home: HomeIcon,
  major_expense: CurrencyDollarIcon,
  emergency: ShieldCheckIcon,
  legacy: GiftIcon,
} as const;

export type GoalCategory = keyof typeof categoryIcons;

/**
 * Status Indicators (Outline for subtle, Solid for emphasis)
 * Used for goal and task status
 */
export const statusIcons = {
  on_track: CheckCircleIcon,
  behind: ExclamationTriangleIcon,
  at_risk: XCircleIcon,
  achieved: BadgeCheckIcon,
} as const;

export const statusIconsSolid = {
  on_track: CheckCircleIconSolid,
  behind: ExclamationTriangleIconSolid,
  at_risk: XCircleIconSolid,
  achieved: BadgeCheckIconSolid,
} as const;

export type GoalStatus = keyof typeof statusIcons;

/**
 * Action Icons
 * Used for buttons and interactive elements
 */
export const actionIcons = {
  add: PlusIcon,
  edit: PencilIcon,
  delete: TrashIcon,
  more: EllipsisVerticalIcon,
  close: XMarkIcon,
  search: MagnifyingGlassIcon,
  filter: FunnelIcon,
  calendar: CalendarIcon,
  refresh: ArrowPathIcon,
  back: ArrowLeftIcon,
  forward: ArrowRightIcon,
  settings: CogIcon,
  notifications: BellIcon,
  user: UserCircleIcon,
  menu: Bars3Icon,
} as const;

export type ActionIconType = keyof typeof actionIcons;

/**
 * Navigation Icons
 * Used for navigation components
 */
export const navigationIcons = {
  chevronLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  chevronDown: ChevronDownIcon,
  chevronUp: ChevronUpIcon,
  arrowLeft: ArrowLeftIcon,
  arrowRight: ArrowRightIcon,
} as const;

/**
 * Feature Icons
 * Used for advanced features and modules
 */
export const featureIcons = {
  dependencies: LinkIcon,
  timeline: CalendarDaysIcon,
  analytics: ChartBarIcon,
  documentation: DocumentTextIcon,
  buckets: BeakerIcon,
  waterfall: ArrowTrendingUpIcon,
  rebalance: ScaleIcon,
  funding: BanknotesIcon,
  ai: SparklesIcon,
  milestones: FlagIcon,
  time: ClockIcon,
  check: CheckIcon,
} as const;

/**
 * Priority Level Icons
 * Used for priority indicators
 */
export const priorityIcons = {
  essential: ExclamationTriangleIconSolid,
  important: ExclamationTriangleIcon,
  aspirational: CheckCircleIcon,
} as const;

export type PriorityLevel = keyof typeof priorityIcons;

/**
 * Icon Size Constants
 * Standard icon sizes across the application
 */
export const iconSizes = {
  xs: 'w-3 h-3',      // 12px - Inline icons
  sm: 'w-4 h-4',      // 16px - Small buttons
  md: 'w-5 h-5',      // 20px - Standard buttons
  lg: 'w-6 h-6',      // 24px - Large buttons, headers
  xl: 'w-8 h-8',      // 32px - Feature icons
  '2xl': 'w-10 h-10', // 40px - Hero icons
} as const;

/**
 * Helper function to get category icon component
 */
export function getCategoryIcon(category: GoalCategory) {
  return categoryIcons[category] || CurrencyDollarIcon;
}

/**
 * Helper function to get status icon component
 */
export function getStatusIcon(status: GoalStatus, solid = false) {
  return solid ? statusIconsSolid[status] : statusIcons[status];
}

/**
 * Helper function to get action icon component
 */
export function getActionIcon(action: ActionIconType) {
  return actionIcons[action];
}

/**
 * Helper function to get priority icon component
 */
export function getPriorityIcon(priority: PriorityLevel) {
  return priorityIcons[priority];
}
