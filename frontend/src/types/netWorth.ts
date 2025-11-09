/**
 * Net Worth Types
 * Shared type definitions for net worth components
 */

export interface NetWorthDataPoint {
  date: string;
  totalNetWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  liquidNetWorth?: number;
  movingAverage?: number;
  assetsByClass?: {
    cash: number;
    stocks: number;
    bonds: number;
    realEstate: number;
    other: number;
  };
}

export interface Milestone {
  date: string;
  label: string;
  value: number;
  type: 'goal' | 'event' | 'achievement';
}
