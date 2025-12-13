/**
 * WealthNavigator UI Component Library
 *
 * Core components following the design system.
 * All components are accessible, responsive, and themeable.
 */

// Button
export { default as Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

// Input
export { default as Input } from './Input';
export type { InputProps, InputType } from './Input';

// Card
export { default as Card, CardHeader, CardContent, CardFooter } from './Card';
export type {
  CardProps,
  CardHeaderProps,
  CardContentProps,
  CardFooterProps,
  CardVariant,
  CardPadding,
} from './Card';

// Badge
export { default as Badge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge';

// ProgressBar
export { default as ProgressBar } from './ProgressBar';
export type {
  ProgressBarProps,
  ProgressBarColor,
  ProgressBarHeight,
} from './ProgressBar';

// RangeSlider
export { RangeSlider, formatters as rangeSliderFormatters } from './RangeSlider';
export type { RangeSliderProps } from './RangeSlider';
