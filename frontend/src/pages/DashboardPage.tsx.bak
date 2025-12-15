/**
 * DashboardPage Component
 * Page wrapper for the Dashboard with data fetching and state management
 * Part of Phase 2 - Week 4: Dashboard Redesign
 */

import React, { useState, useEffect } from 'react';
import { Dashboard, DashboardData } from '../components/dashboard';

export interface DashboardPageProps {
  userId: string;
  onNavigate?: (view: string) => void;
}

export function DashboardPage({ userId, onNavigate }: DashboardPageProps) {
  const [data, setData] = useState<DashboardData | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading with mock data
    // In production, this would fetch from the API
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock data for demonstration
        const mockData: DashboardData = {
          netWorth: {
            value: 2400000,
            trend: {
              value: 2.3,
              direction: 'up',
            },
          },
          totalGoals: {
            total: 8,
            onTrack: 6,
          },
          riskScore: {
            level: 'medium',
            description: 'Moderate risk with balanced portfolio',
          },
          portfolioAllocation: [
            { name: 'Stocks', value: 60, color: '#3b82f6' },
            { name: 'Bonds', value: 30, color: '#8b5cf6' },
            { name: 'Cash', value: 10, color: '#10b981' },
          ],
          rebalancingWarning: {
            message: 'Rebalancing needed: Stocks +3% overweight',
            severity: 'warning',
          },
          goals: [
            {
              id: '1',
              title: 'Retirement 2045',
              currentAmount: 1200000,
              targetAmount: 1500000,
              targetDate: '2045-06-01',
              status: 'on_track',
              priority: 'essential',
            },
            {
              id: '2',
              title: 'College Fund 2030',
              currentAmount: 180000,
              targetAmount: 240000,
              targetDate: '2030-08-15',
              status: 'behind',
              priority: 'important',
            },
            {
              id: '3',
              title: 'Home Down Payment 2026',
              currentAmount: 95000,
              targetAmount: 100000,
              targetDate: '2026-03-01',
              status: 'on_track',
              priority: 'essential',
            },
          ],
          recentActivities: [
            {
              id: '1',
              type: 'market_update',
              message: 'Market update applied (+$12,000)',
              timestamp: new Date(Date.now() - 7200000), // 2 hours ago
            },
            {
              id: '2',
              type: 'goal_update',
              message: 'Goal "Retirement 2045" recalculated',
              timestamp: new Date(Date.now() - 14400000), // 4 hours ago
            },
            {
              id: '3',
              type: 'portfolio_update',
              message: 'Portfolio rebalanced automatically',
              timestamp: new Date(Date.now() - 86400000), // 1 day ago
            },
            {
              id: '4',
              type: 'user_action',
              message: 'You updated your risk tolerance to Medium',
              timestamp: new Date(Date.now() - 172800000), // 2 days ago
            },
            {
              id: '5',
              type: 'system',
              message: 'Monthly report generated and sent to your email',
              timestamp: new Date(Date.now() - 259200000), // 3 days ago
            },
          ],
        };

        setData(mockData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setData(undefined);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [userId]);

  const handleNavigateToGoals = () => {
    onNavigate?.('goals');
  };

  const handleNavigateToPortfolio = () => {
    onNavigate?.('portfolio');
  };

  const handleNavigateToGoalDetail = (goalId: string) => {
    // In production, this would navigate to the goal detail page
    console.log('Navigate to goal detail:', goalId);
    onNavigate?.('goals');
  };

  return (
    <Dashboard
      data={data}
      loading={loading}
      onNavigateToGoals={handleNavigateToGoals}
      onNavigateToPortfolio={handleNavigateToPortfolio}
      onNavigateToGoalDetail={handleNavigateToGoalDetail}
    />
  );
}
