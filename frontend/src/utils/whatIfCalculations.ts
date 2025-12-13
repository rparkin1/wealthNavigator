/**
 * What-If Analysis Calculation Engine
 *
 * Real-time financial calculations for scenario analysis.
 * Supports:
 * - Retirement projections
 * - Goal funding calculations
 * - Portfolio value projections
 * - Success probability estimates
 */

export interface WhatIfParameters {
  monthlyContribution: number;
  expectedReturn: number; // Annual percentage (e.g., 7.0 for 7%)
  retirementAge: number;
  currentAge: number;
  currentAmount: number;
  targetAmount: number;
  inflationRate?: number; // Annual percentage, default 2.5%
}

export interface WhatIfResult {
  projectedValue: number;
  successProbability: number;
  monthlyShortfall: number;
  yearsToGoal: number;
  realReturn: number; // Inflation-adjusted
  totalContributions: number;
  totalGrowth: number;
}

export interface ComparisonResult {
  valueDifference: number;
  valuePercentChange: number;
  probabilityDifference: number;
  monthlyDifference: number;
}

/**
 * Calculate future value with monthly contributions
 * FV = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
 */
function calculateFutureValue(
  presentValue: number,
  monthlyPayment: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;

  if (monthlyRate === 0) {
    return presentValue + (monthlyPayment * months);
  }

  const compoundedPV = presentValue * Math.pow(1 + monthlyRate, months);
  const compoundedPMT = monthlyPayment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

  return compoundedPV + compoundedPMT;
}

/**
 * Calculate required monthly contribution to reach goal
 * PMT = (FV - PV * (1 + r)^n) * r / ((1 + r)^n - 1)
 */
function calculateRequiredMonthly(
  presentValue: number,
  futureValue: number,
  annualRate: number,
  years: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;

  if (monthlyRate === 0) {
    return (futureValue - presentValue) / months;
  }

  const compoundedPV = presentValue * Math.pow(1 + monthlyRate, months);
  const numerator = (futureValue - compoundedPV) * monthlyRate;
  const denominator = Math.pow(1 + monthlyRate, months) - 1;

  return numerator / denominator;
}

/**
 * Estimate success probability based on Monte Carlo simplification
 * Uses normal distribution approximation with historical volatility
 */
function estimateSuccessProbability(
  projectedValue: number,
  targetValue: number,
  years: number,
  expectedReturn: number
): number {
  // Historical market volatility (standard deviation)
  const annualVolatility = 15; // 15% for balanced portfolio

  // Calculate z-score
  const expectedFinalValue = projectedValue;
  const standardDeviation = expectedFinalValue * (annualVolatility / 100) * Math.sqrt(years);
  const zScore = (expectedFinalValue - targetValue) / standardDeviation;

  // Convert z-score to probability using normal CDF approximation
  const probability = normalCDF(zScore);

  // Clamp between 1% and 99% for realism
  return Math.max(0.01, Math.min(0.99, probability));
}

/**
 * Normal cumulative distribution function (CDF) approximation
 * Using the error function approximation
 */
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return z > 0 ? 1 - probability : probability;
}

/**
 * Main calculation engine for what-if analysis
 */
export function calculateWhatIf(params: WhatIfParameters): WhatIfResult {
  const {
    monthlyContribution,
    expectedReturn,
    retirementAge,
    currentAge,
    currentAmount,
    targetAmount,
    inflationRate = 2.5
  } = params;

  const yearsToGoal = Math.max(0, retirementAge - currentAge);

  // Calculate projected value
  const projectedValue = calculateFutureValue(
    currentAmount,
    monthlyContribution,
    expectedReturn,
    yearsToGoal
  );

  // Calculate required monthly to exactly hit target
  const requiredMonthly = calculateRequiredMonthly(
    currentAmount,
    targetAmount,
    expectedReturn,
    yearsToGoal
  );

  const monthlyShortfall = Math.max(0, requiredMonthly - monthlyContribution);

  // Estimate success probability
  const successProbability = estimateSuccessProbability(
    projectedValue,
    targetAmount,
    yearsToGoal,
    expectedReturn
  );

  // Calculate real (inflation-adjusted) return
  const realReturn = expectedReturn - inflationRate;

  // Calculate total contributions and growth
  const totalContributions = monthlyContribution * yearsToGoal * 12;
  const totalGrowth = projectedValue - currentAmount - totalContributions;

  return {
    projectedValue,
    successProbability,
    monthlyShortfall,
    yearsToGoal,
    realReturn,
    totalContributions,
    totalGrowth
  };
}

/**
 * Compare two scenarios and calculate differences
 */
export function compareScenarios(
  baseline: WhatIfResult,
  alternative: WhatIfResult
): ComparisonResult {
  const valueDifference = alternative.projectedValue - baseline.projectedValue;
  const valuePercentChange = (valueDifference / baseline.projectedValue) * 100;
  const probabilityDifference = alternative.successProbability - baseline.successProbability;
  const monthlyDifference = alternative.monthlyShortfall - baseline.monthlyShortfall;

  return {
    valueDifference,
    valuePercentChange,
    probabilityDifference,
    monthlyDifference
  };
}

/**
 * Calculate optimal monthly contribution for target success probability
 */
export function calculateOptimalContribution(
  params: WhatIfParameters,
  targetProbability: number
): number {
  let low = 0;
  let high = params.targetAmount / ((params.retirementAge - params.currentAge) * 12);
  let iterations = 0;
  const maxIterations = 50;
  const tolerance = 0.01; // 1% probability tolerance

  while (iterations < maxIterations && high - low > 1) {
    const mid = (low + high) / 2;
    const result = calculateWhatIf({ ...params, monthlyContribution: mid });

    if (Math.abs(result.successProbability - targetProbability) < tolerance) {
      return mid;
    }

    if (result.successProbability < targetProbability) {
      low = mid;
    } else {
      high = mid;
    }

    iterations++;
  }

  return (low + high) / 2;
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format difference with + or - sign
 */
export function formatDifference(value: number, isCurrency: boolean = true): string {
  const sign = value >= 0 ? '+' : '';
  if (isCurrency) {
    return `${sign}${formatCurrency(Math.abs(value))}`;
  }
  return `${sign}${formatPercentage(value)}`;
}
