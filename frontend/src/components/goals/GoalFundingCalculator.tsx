/**
 * Goal Funding Calculator Component
 * Comprehensive calculator for goal funding analysis with multiple calculation modes
 *
 * REQ-GOAL-007: Goal funding calculations UI
 */

import React, { useState, useEffect } from 'react';
import type {
  FundingCalculatorTab,
  FundingRequirementsResult,
  SuccessProbabilityResult,
  RequiredSavingsForProbabilityResult,
  ContributionOptimizationResult,
  CatchUpStrategyResult,
  ComprehensiveAnalysisResult,
} from '../../types/goalFunding';
import * as goalFundingApi from '../../services/goalFundingApi';

export interface GoalFundingCalculatorProps {
  goalId?: string;
  initialTargetAmount?: number;
  initialCurrentAmount?: number;
  initialMonthlyContribution?: number;
  initialYearsToGoal?: number;
  onClose?: () => void;
}

export function GoalFundingCalculator({
  goalId,
  initialTargetAmount = 500000,
  initialCurrentAmount = 50000,
  initialMonthlyContribution = 1500,
  initialYearsToGoal = 20,
  onClose,
}: GoalFundingCalculatorProps) {
  // Tab state
  const [selectedTab, setSelectedTab] = useState<FundingCalculatorTab>('comprehensive');

  // Input state
  const [targetAmount, setTargetAmount] = useState(initialTargetAmount);
  const [currentAmount, setCurrentAmount] = useState(initialCurrentAmount);
  const [monthlyContribution, setMonthlyContribution] = useState(initialMonthlyContribution);
  const [yearsToGoal, setYearsToGoal] = useState(initialYearsToGoal);
  const [expectedReturn, setExpectedReturn] = useState(0.07);
  const [returnVolatility, setReturnVolatility] = useState(0.15);
  const [inflationRate, setInflationRate] = useState(0.03);
  const [targetProbability, setTargetProbability] = useState(0.90);
  const [maxMonthlyContribution, setMaxMonthlyContribution] = useState(2000);
  const [yearsBehindSchedule, setYearsBehindSchedule] = useState(0);

  // Results state
  const [fundingRequirements, setFundingRequirements] = useState<FundingRequirementsResult | null>(null);
  const [successProbability, setSuccessProbability] = useState<SuccessProbabilityResult | null>(null);
  const [requiredSavings, setRequiredSavings] = useState<RequiredSavingsForProbabilityResult | null>(null);
  const [optimization, setOptimization] = useState<ContributionOptimizationResult | null>(null);
  const [catchUpStrategy, setCatchUpStrategy] = useState<CatchUpStrategyResult | null>(null);
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState<ComprehensiveAnalysisResult | null>(null);

  // UI state
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate on tab change or input change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedTab === 'comprehensive') {
        handleComprehensiveAnalysis();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [targetAmount, currentAmount, monthlyContribution, yearsToGoal, expectedReturn, returnVolatility, selectedTab]);

  // Handlers
  const handleCalculateFundingRequirements = async () => {
    setIsCalculating(true);
    setError(null);
    try {
      const result = await goalFundingApi.calculateFundingRequirements({
        target_amount: targetAmount,
        current_amount: currentAmount,
        years_to_goal: yearsToGoal,
        expected_return: expectedReturn,
        inflation_rate: inflationRate,
      });
      setFundingRequirements(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate funding requirements');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculateSuccessProbability = async () => {
    setIsCalculating(true);
    setError(null);
    try {
      const result = await goalFundingApi.calculateSuccessProbability({
        target_amount: targetAmount,
        current_amount: currentAmount,
        monthly_contribution: monthlyContribution,
        years_to_goal: yearsToGoal,
        expected_return: expectedReturn,
        return_volatility: returnVolatility,
        iterations: 5000,
      });
      setSuccessProbability(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate success probability');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculateRequiredSavings = async () => {
    setIsCalculating(true);
    setError(null);
    try {
      const result = await goalFundingApi.calculateRequiredSavingsForProbability({
        target_amount: targetAmount,
        current_amount: currentAmount,
        years_to_goal: yearsToGoal,
        target_probability: targetProbability,
        expected_return: expectedReturn,
        return_volatility: returnVolatility,
      });
      setRequiredSavings(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate required savings');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleOptimizeContributions = async () => {
    setIsCalculating(true);
    setError(null);
    try {
      const result = await goalFundingApi.optimizeContributionTimeline({
        target_amount: targetAmount,
        current_amount: currentAmount,
        years_to_goal: yearsToGoal,
        max_monthly_contribution: maxMonthlyContribution,
        expected_return: expectedReturn,
      });
      setOptimization(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize contributions');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCalculateCatchUp = async () => {
    setIsCalculating(true);
    setError(null);
    try {
      const result = await goalFundingApi.calculateCatchUpStrategy({
        target_amount: targetAmount,
        current_amount: currentAmount,
        years_remaining: yearsToGoal,
        years_behind_schedule: yearsBehindSchedule,
        expected_return: expectedReturn,
      });
      setCatchUpStrategy(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate catch-up strategy');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleComprehensiveAnalysis = async () => {
    setIsCalculating(true);
    setError(null);
    try {
      const result = await goalFundingApi.comprehensiveFundingAnalysis(
        targetAmount,
        currentAmount,
        monthlyContribution,
        yearsToGoal,
        expectedReturn,
        returnVolatility
      );
      setComprehensiveAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run comprehensive analysis');
    } finally {
      setIsCalculating(false);
    }
  };

  // Render helpers
  const renderInputFields = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
          Target Amount
        </label>
        <input
          type="number"
          value={targetAmount}
          onChange={(e) => setTargetAmount(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
          Current Amount
        </label>
        <input
          type="number"
          value={currentAmount}
          onChange={(e) => setCurrentAmount(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      {selectedTab !== 'requirements' && (
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
            Monthly Contribution
          </label>
          <input
            type="number"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>
      )}

      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
          Years to Goal
        </label>
        <input
          type="number"
          value={yearsToGoal}
          onChange={(e) => setYearsToGoal(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
          Expected Return (%)
        </label>
        <input
          type="number"
          step="0.01"
          value={expectedReturn * 100}
          onChange={(e) => setExpectedReturn(Number(e.target.value) / 100)}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      {(selectedTab === 'probability' || selectedTab === 'comprehensive') && (
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
            Return Volatility (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={returnVolatility * 100}
            onChange={(e) => setReturnVolatility(Number(e.target.value) / 100)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>
      )}
    </div>
  );

  const renderComprehensiveResults = () => {
    if (!comprehensiveAnalysis) return null;

    const statusColors = {
      on_track: '#10b981',
      fair: '#f59e0b',
      at_risk: '#ef4444',
    };

    return (
      <div style={{ marginTop: '24px' }}>
        {/* Status Card */}
        <div
          style={{
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '24px',
            border: `2px solid ${statusColors[comprehensiveAnalysis.status]}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: statusColors[comprehensiveAnalysis.status],
                marginRight: '12px',
              }}
            />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
              Status: {comprehensiveAnalysis.status.replace('_', ' ').toUpperCase()}
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            {comprehensiveAnalysis.message}
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Current Success Probability
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: goalFundingApi.getStatusColor(comprehensiveAnalysis.current_success_probability.success_probability) }}>
              {goalFundingApi.formatPercentage(comprehensiveAnalysis.current_success_probability.success_probability, 1)}
            </div>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Required Monthly Savings
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>
              {goalFundingApi.formatCurrency(comprehensiveAnalysis.funding_requirements.required_monthly_savings)}
            </div>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Monthly Contribution Gap
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: comprehensiveAnalysis.monthly_contribution_gap > 0 ? '#ef4444' : '#10b981' }}>
              {goalFundingApi.formatCurrency(Math.abs(comprehensiveAnalysis.monthly_contribution_gap))}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {comprehensiveAnalysis.monthly_contribution_gap > 0 ? 'Under-contributing' : 'Over-contributing'}
            </div>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              For 90% Success
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700 }}>
              {goalFundingApi.formatCurrency(comprehensiveAnalysis.required_for_90_percent.required_monthly_savings)}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div style={{ padding: '20px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #dbeafe' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>📊 Recommendations</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <strong>Current Trajectory:</strong>{' '}
              <span style={{ color: '#6b7280' }}>{comprehensiveAnalysis.recommendations.current_trajectory}</span>
            </div>
            <div>
              <strong>To Achieve 90%:</strong>{' '}
              <span style={{ color: '#6b7280' }}>{comprehensiveAnalysis.recommendations.to_achieve_90_percent}</span>
            </div>
            <div>
              <strong>Alternative Strategies:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                {comprehensiveAnalysis.recommendations.alternative_strategies.map((strategy, index) => (
                  <li key={index} style={{ color: '#6b7280', marginTop: '4px' }}>
                    {strategy}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700 }}>
            💰 Goal Funding Calculator
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            Calculate savings requirements, success probability, and optimization strategies
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Close
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e5e7eb' }}>
        {[
          { id: 'comprehensive', label: '📊 Comprehensive' },
          { id: 'requirements', label: '💵 Requirements' },
          { id: 'probability', label: '🎯 Probability' },
          { id: 'optimization', label: '⚙️ Optimization' },
          { id: 'catch-up', label: '🚀 Catch-Up' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as FundingCalculatorTab)}
            style={{
              padding: '12px 20px',
              backgroundColor: selectedTab === tab.id ? '#3b82f6' : 'transparent',
              color: selectedTab === tab.id ? '#ffffff' : '#6b7280',
              border: 'none',
              borderBottom: selectedTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ padding: '16px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', marginBottom: '24px', color: '#991b1b' }}>
          ❌ {error}
        </div>
      )}

      {/* Input Fields */}
      {renderInputFields()}

      {/* Calculate Button */}
      {selectedTab !== 'comprehensive' && (
        <button
          onClick={() => {
            switch (selectedTab) {
              case 'requirements':
                handleCalculateFundingRequirements();
                break;
              case 'probability':
                handleCalculateSuccessProbability();
                break;
              case 'optimization':
                handleOptimizeContributions();
                break;
              case 'catch-up':
                handleCalculateCatchUp();
                break;
            }
          }}
          disabled={isCalculating}
          style={{
            padding: '12px 24px',
            backgroundColor: isCalculating ? '#9ca3af' : '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: isCalculating ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '24px',
          }}
        >
          {isCalculating ? 'Calculating...' : 'Calculate'}
        </button>
      )}

      {/* Results Display */}
      {selectedTab === 'comprehensive' && renderComprehensiveResults()}

      {/* Loading State */}
      {isCalculating && selectedTab === 'comprehensive' && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <div style={{ fontSize: '16px' }}>Running comprehensive analysis...</div>
        </div>
      )}
    </div>
  );
}
