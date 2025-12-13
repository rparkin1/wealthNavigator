/**
 * Goal Projection Calculations
 * Week 11 - UI Redesign Phase 3
 *
 * Calculates projected outcomes for goal funding
 */

import type { ProjectionResult } from './types';

interface ProjectionInputs {
  currentSavings: number;
  monthlyContribution: number;
  expectedReturn: number; // Annual percentage (e.g., 7.0 for 7%)
  targetAmount: number;
  targetDate: string;
  successThreshold: number; // 0.0-1.0 (e.g., 0.90 for 90%)
}

/**
 * Calculate projected goal outcome
 * Using future value of series formula with compound interest
 */
export function calculateProjection(inputs: ProjectionInputs): ProjectionResult {
  const {
    currentSavings,
    monthlyContribution,
    expectedReturn,
    targetAmount,
    targetDate,
    successThreshold,
  } = inputs;

  // Calculate time horizon in months
  const today = new Date();
  const target = new Date(targetDate);
  const monthsToGoal = Math.max(
    1,
    Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
  );

  // Convert annual return to monthly
  const monthlyRate = expectedReturn / 100 / 12;

  // Future value of current savings
  const fvCurrentSavings = currentSavings * Math.pow(1 + monthlyRate, monthsToGoal);

  // Future value of monthly contributions (annuity)
  const fvContributions =
    monthlyContribution *
    ((Math.pow(1 + monthlyRate, monthsToGoal) - 1) / monthlyRate) *
    (1 + monthlyRate);

  // Total projected value
  const projectedValue = fvCurrentSavings + fvContributions;

  // Calculate success probability (simplified model)
  // In real implementation, this would use Monte Carlo simulation
  const shortfall = Math.max(0, targetAmount - projectedValue);
  const percentOfGoal = projectedValue / targetAmount;

  // Rough success probability based on percentage of goal achieved
  // Assuming normal distribution with standard deviation
  let successProbability: number;
  if (percentOfGoal >= 1.1) {
    successProbability = 0.95;
  } else if (percentOfGoal >= 1.0) {
    successProbability = 0.90;
  } else if (percentOfGoal >= 0.95) {
    successProbability = 0.85;
  } else if (percentOfGoal >= 0.90) {
    successProbability = 0.75;
  } else if (percentOfGoal >= 0.80) {
    successProbability = 0.65;
  } else if (percentOfGoal >= 0.70) {
    successProbability = 0.50;
  } else {
    successProbability = Math.max(0.20, percentOfGoal * 0.7);
  }

  // Calculate shortfall risk
  const shortfallRisk = 1 - successProbability;

  // Estimate median shortfall if goals are not met
  const medianShortfall = shortfallRisk > 0 ? shortfall * 0.6 : 0;

  // Calculate recommended contribution to reach success threshold
  let recommendedContribution = monthlyContribution;
  if (successProbability < successThreshold) {
    // Binary search for required contribution
    let low = monthlyContribution;
    let high = monthlyContribution * 3;
    let iterations = 0;

    while (iterations < 20 && high - low > 10) {
      const mid = (low + high) / 2;
      const testFvContributions =
        mid *
        ((Math.pow(1 + monthlyRate, monthsToGoal) - 1) / monthlyRate) *
        (1 + monthlyRate);
      const testProjectedValue = fvCurrentSavings + testFvContributions;
      const testPercentOfGoal = testProjectedValue / targetAmount;

      // Estimate success probability for this contribution
      let testSuccess: number;
      if (testPercentOfGoal >= 1.1) testSuccess = 0.95;
      else if (testPercentOfGoal >= 1.0) testSuccess = 0.90;
      else if (testPercentOfGoal >= 0.95) testSuccess = 0.85;
      else if (testPercentOfGoal >= 0.90) testSuccess = 0.75;
      else testSuccess = testPercentOfGoal * 0.7;

      if (testSuccess < successThreshold) {
        low = mid;
      } else {
        high = mid;
      }
      iterations++;
    }
    recommendedContribution = Math.ceil(high / 10) * 10; // Round to nearest 10
  }

  const contributionAdjustment = recommendedContribution - monthlyContribution;

  return {
    projectedValue: Math.round(projectedValue),
    successProbability: Math.round(successProbability * 100) / 100,
    shortfallRisk: Math.round(shortfallRisk * 100) / 100,
    medianShortfall: Math.round(medianShortfall),
    recommendedContribution: Math.round(recommendedContribution),
    contributionAdjustment: Math.round(contributionAdjustment),
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
