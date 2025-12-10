/**
 * Performance Monitoring Hook
 * Tracks Web Vitals and custom performance metrics
 */

import React, { useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}


/**
 * Web Vitals thresholds
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
};

/**
 * Get performance rating based on value and thresholds
 */
const getRating = (
  value: number,
  thresholds: { good: number; poor: number }
): 'good' | 'needs-improvement' | 'poor' => {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
};

/**
 * Send metrics to analytics service
 */
const sendToAnalytics = (metric: PerformanceMetrics) => {
  // In production, send to PostHog, Mixpanel, or custom analytics
  if (import.meta.env.PROD) {
    // Example: posthog.capture('performance_metric', metric);
    console.log('[Analytics] Performance metric:', metric);
  } else {
    console.log('[Performance]', metric.name, metric.value, metric.rating);
  }
};

/**
 * Observe Largest Contentful Paint (LCP)
 */
const observeLCP = () => {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];

    if (lastEntry && 'renderTime' in lastEntry) {
      const value = (lastEntry as any).renderTime || (lastEntry as any).loadTime;
      sendToAnalytics({
        name: 'LCP',
        value,
        rating: getRating(value, THRESHOLDS.LCP),
      });
    }
  });

  try {
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    console.warn('LCP observation not supported');
  }
};

/**
 * Observe First Input Delay (FID)
 */
const observeFID = () => {
  if (!('PerformanceObserver' in window)) return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      if (entry.processingStart && entry.startTime) {
        const value = entry.processingStart - entry.startTime;
        sendToAnalytics({
          name: 'FID',
          value,
          rating: getRating(value, THRESHOLDS.FID),
        });
      }
    });
  });

  try {
    observer.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    console.warn('FID observation not supported');
  }
};

/**
 * Observe Cumulative Layout Shift (CLS)
 */
const observeCLS = () => {
  if (!('PerformanceObserver' in window)) return;

  let clsValue = 0;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    });

    sendToAnalytics({
      name: 'CLS',
      value: clsValue,
      rating: getRating(clsValue, THRESHOLDS.CLS),
    });
  });

  try {
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    console.warn('CLS observation not supported');
  }
};

/**
 * Measure Time to First Byte (TTFB)
 */
const measureTTFB = () => {
  if (!('performance' in window) || !performance.getEntriesByType) return;

  const navigationEntry = performance.getEntriesByType('navigation')[0] as any;
  if (navigationEntry && navigationEntry.responseStart) {
    const value = navigationEntry.responseStart;
    sendToAnalytics({
      name: 'TTFB',
      value,
      rating: getRating(value, THRESHOLDS.TTFB),
    });
  }
};

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Observe Web Vitals
    observeLCP();
    observeFID();
    observeCLS();
    measureTTFB();

    // Report on page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Report final metrics when page becomes hidden
        const navigation = performance.getEntriesByType('navigation')[0] as any;
        if (navigation) {
          console.log('[Performance] Navigation timing:', {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            domInteractive: navigation.domInteractive,
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  /**
   * Measure custom component render time
   */
  const measureComponentRender = useCallback((componentName: string, startMark: string) => {
    if (!('performance' in window)) return;

    const endMark = `${componentName}-render-end`;
    performance.mark(endMark);

    try {
      const measure = performance.measure(
        `${componentName}-render`,
        startMark,
        endMark
      );

      sendToAnalytics({
        name: `component-render:${componentName}`,
        value: measure.duration,
        rating: measure.duration < 500 ? 'good' : measure.duration < 1000 ? 'needs-improvement' : 'poor',
      });
    } catch (e) {
      console.warn(`Could not measure ${componentName} render time`);
    }
  }, []);

  /**
   * Measure API call duration
   */
  const measureAPICall = useCallback((endpoint: string, duration: number) => {
    sendToAnalytics({
      name: `api-call:${endpoint}`,
      value: duration,
      rating: duration < 1000 ? 'good' : duration < 2000 ? 'needs-improvement' : 'poor',
    });
  }, []);

  /**
   * Measure chart rendering time
   */
  const measureChartRender = useCallback((chartType: string, duration: number) => {
    sendToAnalytics({
      name: `chart-render:${chartType}`,
      value: duration,
      rating: duration < 500 ? 'good' : duration < 1000 ? 'needs-improvement' : 'poor',
    });
  }, []);

  return {
    measureComponentRender,
    measureAPICall,
    measureChartRender,
  };
};

/**
 * HOC for automatic component performance tracking
 */
export const withPerformanceTracking = <P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  componentName: string
): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props: P) => {
    useEffect(() => {
      const startMark = `${componentName}-render-start`;
      performance.mark(startMark);

      return () => {
        const endMark = `${componentName}-render-end`;
        performance.mark(endMark);

        try {
          const measure = performance.measure(
            `${componentName}-render`,
            startMark,
            endMark
          );

          sendToAnalytics({
            name: `component-render:${componentName}`,
            value: measure.duration,
            rating: measure.duration < 500 ? 'good' : measure.duration < 1000 ? 'needs-improvement' : 'poor',
          });
        } catch (e) {
          console.warn(`Could not measure ${componentName} render time`);
        }
      };
    }, []);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPerformanceTracking(${componentName})`;
  return WrappedComponent;
};
