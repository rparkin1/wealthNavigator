import React, { useState, useRef, useEffect } from 'react';

/**
 * Tooltip Component
 *
 * Displays helpful information on hover or focus.
 * Automatically positions to stay within viewport.
 *
 * @example
 * ```tsx
 * <Tooltip content="This is the probability of achieving your goal" placement="top">
 *   <span>Success Rate: 87% <InfoIcon /></span>
 * </Tooltip>
 * ```
 */

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipProps {
  /** Tooltip content */
  content: React.ReactNode;
  /** Placement relative to trigger */
  placement?: TooltipPlacement;
  /** Delay before showing (ms) */
  delay?: number;
  /** Additional CSS classes */
  className?: string;
  /** Element to trigger tooltip */
  children: React.ReactElement;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  placement = 'top',
  delay = 200,
  className = '',
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPlacement, setActualPlacement] = useState(placement);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Show tooltip with delay
  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  // Hide tooltip immediately
  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Adjust position to stay in viewport
  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !triggerRef.current) return;

    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();

    let newPlacement = placement;

    // Check if tooltip goes out of viewport
    if (placement === 'top' && tooltipRect.top < 0) {
      newPlacement = 'bottom';
    } else if (placement === 'bottom' && tooltipRect.bottom > window.innerHeight) {
      newPlacement = 'top';
    } else if (placement === 'left' && tooltipRect.left < 0) {
      newPlacement = 'right';
    } else if (placement === 'right' && tooltipRect.right > window.innerWidth) {
      newPlacement = 'left';
    }

    setActualPlacement(newPlacement);
  }, [isVisible, placement]);

  // Placement classes
  const placementClasses: Record<TooltipPlacement, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Arrow classes
  const arrowClasses: Record<TooltipPlacement, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-gray-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-gray-900',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-gray-900',
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {/* Trigger Element */}
      {React.cloneElement(children, {
        'aria-describedby': isVisible ? 'tooltip' : undefined,
      })}

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          id="tooltip"
          role="tooltip"
          className={`
            absolute ${placementClasses[actualPlacement]}
            z-tooltip pointer-events-none
            animate-in fade-in zoom-in-95 duration-200
            ${className}
          `}
        >
          <div className="bg-gray-900 text-white text-sm rounded-md px-3 py-2 max-w-xs shadow-lg">
            {content}
          </div>

          {/* Arrow */}
          <div
            className={`
              absolute w-2 h-2
              border-4 border-transparent
              ${arrowClasses[actualPlacement]}
            `}
          />
        </div>
      )}
    </div>
  );
};

Tooltip.displayName = 'Tooltip';

export default Tooltip;
