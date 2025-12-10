/**
 * Frontend Performance Monitoring
 * Tracks Web Vitals and custom performance metrics
 */

import React from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface WebVitalsMetrics {
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  TTFB?: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private webVitals: WebVitalsMetrics = {};
  private componentTimings: Map<string, number[]> = new Map();

  /**
   * Track Web Vitals metrics
   */
  trackWebVitals() {
    // Only run in browser with Performance API support
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Track Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.webVitals.LCP = lastEntry.renderTime || lastEntry.loadTime;
        this.recordMetric('LCP', this.webVitals.LCP, this.rateLCP(this.webVitals.LCP));
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP tracking not supported:', e);
    }

    // Track First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.webVitals.FID = entry.processingStart - entry.startTime;
          this.recordMetric('FID', this.webVitals.FID, this.rateFID(this.webVitals.FID));
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID tracking not supported:', e);
    }

    // Track Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.webVitals.CLS = clsValue;
        this.recordMetric('CLS', this.webVitals.CLS, this.rateCLS(this.webVitals.CLS));
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS tracking not supported:', e);
    }

    // Track Navigation Timing
    if ('navigation' in performance && 'getEntriesByType' in performance) {
      const [navEntry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntry) {
        // Time to First Byte
        this.webVitals.TTFB = navEntry.responseStart - navEntry.requestStart;
        this.recordMetric('TTFB', this.webVitals.TTFB, this.rateTTFB(this.webVitals.TTFB));

        // First Contentful Paint
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          this.webVitals.FCP = fcpEntry.startTime;
          this.recordMetric('FCP', this.webVitals.FCP, this.rateFCP(this.webVitals.FCP));
        }
      }
    }
  }

  /**
   * Track component render time
   */
  trackComponentRender(componentName: string, duration: number) {
    if (!this.componentTimings.has(componentName)) {
      this.componentTimings.set(componentName, []);
    }

    const timings = this.componentTimings.get(componentName)!;
    timings.push(duration);

    // Keep only last 100 measurements
    if (timings.length > 100) {
      timings.shift();
    }

    // Warn if component is slow
    if (duration > 16.67) { // 60 FPS = 16.67ms per frame
      console.warn(`Slow component render: ${componentName} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Track custom timing
   */
  trackTiming(name: string, duration: number) {
    const rating = duration < 100 ? 'good' : duration < 300 ? 'needs-improvement' : 'poor';
    this.recordMetric(name, duration, rating);
  }

  /**
   * Get performance report
   */
  getReport() {
    const componentStats = Array.from(this.componentTimings.entries()).map(([name, timings]) => {
      const sorted = [...timings].sort((a, b) => a - b);
      return {
        component: name,
        count: timings.length,
        mean: timings.reduce((a, b) => a + b, 0) / timings.length,
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        max: Math.max(...timings),
      };
    });

    return {
      webVitals: this.webVitals,
      metrics: this.metrics,
      componentTimings: componentStats,
      slowComponents: componentStats.filter(c => c.p95 > 16.67),
      timestamp: Date.now(),
    };
  }

  /**
   * Send metrics to backend
   */
  async sendMetrics() {
    const report = this.getReport();

    try {
      await fetch('/api/v1/performance-metrics/frontend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  }

  // Rating functions based on Web Vitals thresholds
  private rateLCP(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
  }

  private rateFID(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
  }

  private rateCLS(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
  }

  private rateFCP(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
  }

  private rateTTFB(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
  }

  private recordMetric(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') {
    this.metrics.push({
      name,
      value,
      rating,
      timestamp: Date.now(),
    });

    // Log poor metrics
    if (rating === 'poor') {
      console.warn(`Poor ${name} performance:`, value);
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize Web Vitals tracking on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    performanceMonitor.trackWebVitals();

    // Send metrics after 5 seconds
    setTimeout(() => {
      performanceMonitor.sendMetrics();
    }, 5000);
  });
}

/**
 * React hook to track component render performance
 */
export function usePerformanceTracking(componentName: string) {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    performanceMonitor.trackComponentRender(componentName, duration);
  };
}

/**
 * HOC to track component performance
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const name = componentName || Component.displayName || Component.name || 'Unknown';

  return (props: P) => {
    const trackEnd = usePerformanceTracking(name);

    React.useEffect(() => {
      return trackEnd;
    });

    return React.createElement(Component, props);
  };
}

export default performanceMonitor;
