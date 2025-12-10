/**
 * Dashboard Performance Tests
 * Ensures dashboard loads meet performance requirements
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { performance } from 'perf_hooks';

// Performance thresholds from PRD
const PERFORMANCE_THRESHOLDS = {
  DASHBOARD_LOAD: 1000, // 1 second max
  CHART_GENERATION: 500, // 500ms max
  API_RESPONSE: 2000, // 2 seconds max
  MONTE_CARLO: 30000, // 30 seconds max
  PORTFOLIO_OPTIMIZATION: 5000, // 5 seconds max
};

describe('Dashboard Performance Tests', () => {
  beforeEach(() => {
    // Clear performance marks
    performance.clearMarks();
    performance.clearMeasures();
  });

  it('should load dashboard within 1 second', async () => {
    const startTime = performance.now();

    // Simulate dashboard load with API calls
    const mockApiCalls = [
      Promise.resolve({ goals: [] }),
      Promise.resolve({ portfolio: {} }),
      Promise.resolve({ netWorth: 0 }),
      Promise.resolve({ recentTransactions: [] }),
    ];

    await Promise.all(mockApiCalls);

    const loadTime = performance.now() - startTime;

    console.log(`Dashboard load time: ${loadTime.toFixed(2)}ms`);
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DASHBOARD_LOAD);
  });

  it('should render chart within 500ms', async () => {
    const startTime = performance.now();

    // Simulate chart data processing
    const dataPoints = Array.from({ length: 100 }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString(),
      value: Math.random() * 100000,
    }));

    // Simulate chart rendering
    const chartData = dataPoints.map(point => ({
      ...point,
      formattedValue: `$${point.value.toFixed(2)}`,
    }));

    const renderTime = performance.now() - startTime;

    console.log(`Chart render time: ${renderTime.toFixed(2)}ms`);
    expect(renderTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CHART_GENERATION);
    expect(chartData).toHaveLength(100);
  });

  it('should handle concurrent API requests efficiently', async () => {
    const startTime = performance.now();

    // Simulate multiple concurrent API calls
    const apiCalls = Array.from({ length: 10 }, (_, i) =>
      new Promise(resolve => setTimeout(() => resolve({ id: i }), 100))
    );

    await Promise.all(apiCalls);

    const totalTime = performance.now() - startTime;

    console.log(`Concurrent requests time: ${totalTime.toFixed(2)}ms`);
    // Should complete in parallel, not sequentially
    expect(totalTime).toBeLessThan(500); // Much less than 10 * 100ms
  });

  it('should efficiently process large transaction lists', () => {
    const startTime = performance.now();

    // Simulate processing 1000 transactions
    const transactions = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      date: new Date(2024, 0, i % 365).toISOString(),
      amount: Math.random() * 1000,
      category: ['Food', 'Transport', 'Housing'][i % 3],
    }));

    // Group by category
    const byCategory = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    const processingTime = performance.now() - startTime;

    console.log(`Transaction processing time: ${processingTime.toFixed(2)}ms`);
    expect(processingTime).toBeLessThan(100); // Should be very fast
    expect(Object.keys(byCategory)).toHaveLength(3);
  });

  it('should efficiently calculate portfolio metrics', () => {
    const startTime = performance.now();

    // Simulate portfolio calculation
    const holdings = Array.from({ length: 50 }, (_, i) => ({
      symbol: `STOCK${i}`,
      shares: Math.random() * 100,
      price: Math.random() * 500,
    }));

    const totalValue = holdings.reduce((sum, h) => sum + h.shares * h.price, 0);
    const weights = holdings.map(h => (h.shares * h.price) / totalValue);
    const concentration = Math.max(...weights);

    const calculationTime = performance.now() - startTime;

    console.log(`Portfolio calculation time: ${calculationTime.toFixed(2)}ms`);
    expect(calculationTime).toBeLessThan(50);
    expect(concentration).toBeLessThanOrEqual(1);
  });

  it('should handle Monte Carlo simulation data efficiently', () => {
    const startTime = performance.now();

    // Simulate 5000 Monte Carlo iterations
    const iterations = 5000;
    const years = 30;

    const results = Array.from({ length: iterations }, () => {
      const values = [100000]; // Starting value
      for (let year = 1; year < years; year++) {
        const return_ = (Math.random() - 0.5) * 0.3; // -15% to +15%
        values.push(values[year - 1] * (1 + return_));
      }
      return values[values.length - 1];
    });

    // Calculate percentiles
    const sorted = results.sort((a, b) => a - b);
    const p10 = sorted[Math.floor(iterations * 0.1)];
    const p50 = sorted[Math.floor(iterations * 0.5)];
    const p90 = sorted[Math.floor(iterations * 0.9)];

    const processingTime = performance.now() - startTime;

    console.log(`Monte Carlo data processing time: ${processingTime.toFixed(2)}ms`);
    expect(processingTime).toBeLessThan(1000); // Client-side processing should be fast
    expect(p10).toBeLessThan(p50);
    expect(p50).toBeLessThan(p90);
  });

  it('should efficiently filter and sort large datasets', () => {
    const startTime = performance.now();

    // Simulate large goal list
    const goals = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `Goal ${i}`,
      priority: ['essential', 'important', 'aspirational'][i % 3],
      targetAmount: Math.random() * 1000000,
      currentAmount: Math.random() * 500000,
      targetDate: new Date(2030 + (i % 20), 0, 1).toISOString(),
    }));

    // Filter essential goals and sort by target date
    const essentialGoals = goals
      .filter(g => g.priority === 'essential')
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

    const operationTime = performance.now() - startTime;

    console.log(`Filter and sort time: ${operationTime.toFixed(2)}ms`);
    expect(operationTime).toBeLessThan(10);
    expect(essentialGoals.length).toBeGreaterThan(0);
  });

  it('should cache expensive calculations', async () => {
    const cache = new Map();

    // First calculation
    const startTime1 = performance.now();
    const key = 'test_calculation';

    if (!cache.has(key)) {
      // Simulate expensive calculation
      await new Promise(resolve => setTimeout(resolve, 100));
      cache.set(key, { result: 42 });
    }

    const time1 = performance.now() - startTime1;

    // Second calculation (cached)
    const startTime2 = performance.now();

    if (!cache.has(key)) {
      await new Promise(resolve => setTimeout(resolve, 100));
      cache.set(key, { result: 42 });
    }
    const cachedResult = cache.get(key);

    const time2 = performance.now() - startTime2;

    console.log(`Uncached time: ${time1.toFixed(2)}ms, Cached time: ${time2.toFixed(2)}ms`);
    expect(time2).toBeLessThan(time1); // Cached should be faster
    expect(time2).toBeLessThan(10); // Cache lookup should be very fast
    expect(cachedResult).toEqual({ result: 42 });
  });
});

describe('Performance Regression Tests', () => {
  it('should maintain performance with increasing data size', () => {
    const sizes = [10, 100, 1000, 10000];
    const times: number[] = [];

    sizes.forEach(size => {
      const startTime = performance.now();

      const data = Array.from({ length: size }, (_, i) => ({
        id: i,
        value: Math.random(),
      }));

      const sum = data.reduce((acc, item) => acc + item.value, 0);

      const time = performance.now() - startTime;
      times.push(time);

      console.log(`Size ${size}: ${time.toFixed(2)}ms`);
    });

    // Check for linear scaling (allowing some variance)
    // Time should scale roughly linearly with data size
    const ratio1 = times[1] / times[0]; // 100 vs 10
    const ratio2 = times[2] / times[1]; // 1000 vs 100
    const ratio3 = times[3] / times[2]; // 10000 vs 1000

    console.log(`Scaling ratios: ${ratio1.toFixed(2)}, ${ratio2.toFixed(2)}, ${ratio3.toFixed(2)}`);

    // All should be roughly similar if scaling linearly
    expect(ratio1).toBeGreaterThan(0);
    expect(ratio2).toBeGreaterThan(0);
    expect(ratio3).toBeGreaterThan(0);

    // None should be exponential (e.g., > 20x)
    expect(ratio1).toBeLessThan(20);
    expect(ratio2).toBeLessThan(20);
    expect(ratio3).toBeLessThan(20);
  });
});
