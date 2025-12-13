/**
 * ProjectionTab Component
 *
 * Displays Monte Carlo simulation results with fan chart and key statistics.
 * Includes success probability display and simulation controls.
 *
 * Following UI Redesign specifications - Week 8
 */

import React from 'react';
import Button from '../../ui/Button';
import { MonteCarloFanChartRedesign } from './MonteCarloFanChartRedesign';
import { SuccessProbabilityDisplay } from './SuccessProbabilityDisplay';
import type { Goal } from '../../../types/goal';
import type { MonteCarloSimulation } from '../../../types/simulation';
import { PlayIcon, RefreshIcon } from '../icons/GoalIcons';

export interface ProjectionTabProps {
  goal: Goal;
  simulation?: MonteCarloSimulation;
  onRunSimulation?: (goalId: string) => void;
}

export function ProjectionTab({ goal, simulation, onRunSimulation }: ProjectionTabProps) {
  // If no simulation exists, show empty state with CTA
  if (!simulation) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 mb-4">
            <PlayIcon size={32} className="text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Run Monte Carlo Simulation</h3>
          <p className="text-sm text-gray-600 mb-6">
            Generate probabilistic projections to see the range of possible outcomes for this goal.
            The simulation will run 5,000+ iterations to calculate your success probability.
          </p>
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlayIcon size={20} />}
            onClick={() => onRunSimulation?.(goal.id)}
          >
            Run Simulation
          </Button>
        </div>
      </div>
    );
  }

  // If simulation is running, show progress
  if (simulation.status === 'running') {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 mb-4 animate-pulse">
            <RefreshIcon size={32} className="text-primary-600 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Running Simulation...</h3>
          <p className="text-sm text-gray-600 mb-4">
            Processing {simulation.iterations.toLocaleString()} iterations
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${simulation.progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">{simulation.progress.toFixed(0)}% complete</p>
        </div>
      </div>
    );
  }

  // Display completed simulation results
  return (
    <div className="space-y-8">
      {/* Success Probability Display */}
      <SuccessProbabilityDisplay
        probability={simulation.successProbability}
        iterations={simulation.iterations}
        goalAmount={goal.targetAmount}
        medianValue={simulation.statistics.medianFinalValue}
      />

      {/* Monte Carlo Fan Chart */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Portfolio Projection</h3>
            <p className="text-sm text-gray-600 mt-1">
              Showing {simulation.iterations.toLocaleString()} simulation paths
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshIcon size={16} />}
            onClick={() => onRunSimulation?.(goal.id)}
          >
            Re-run
          </Button>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <MonteCarloFanChartRedesign
            projections={simulation.portfolioProjections.map((p) => ({
              year: p.year,
              median: p.percentile50,
              p10: p.percentile10,
              p25: p.percentile25,
              p75: p.percentile75,
              p90: p.percentile90,
            }))}
            goalAmount={goal.targetAmount}
            width={800}
            height={400}
          />
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Success Rate"
          value={`${(simulation.successProbability * 100).toFixed(1)}%`}
          subtitle={`${Math.round(
            simulation.successProbability * simulation.iterations
          )} / ${simulation.iterations.toLocaleString()} scenarios`}
          color="primary"
        />
        <StatCard
          label="Median Final Value"
          value={formatCurrency(simulation.statistics.medianFinalValue)}
          subtitle={
            simulation.statistics.medianFinalValue > goal.targetAmount
              ? `+${formatCurrency(simulation.statistics.medianFinalValue - goal.targetAmount)} above target`
              : `${formatCurrency(goal.targetAmount - simulation.statistics.medianFinalValue)} below target`
          }
          color={simulation.statistics.medianFinalValue >= goal.targetAmount ? 'success' : 'warning'}
        />
        <StatCard
          label="95th Percentile"
          value={formatCurrency(simulation.statistics.bestCase)}
          subtitle="Best-case scenario"
          color="success"
        />
        <StatCard
          label="5th Percentile"
          value={formatCurrency(simulation.statistics.worstCase)}
          subtitle="Worst-case scenario"
          color={simulation.statistics.worstCase >= goal.targetAmount ? 'success' : 'error'}
        />
      </div>

      {/* Methodology Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">About This Simulation</h4>
        <p className="text-xs text-blue-800 leading-relaxed">
          This Monte Carlo simulation ran {simulation.iterations.toLocaleString()} scenarios using historical
          market return distributions. Each scenario models your portfolio value over time, accounting for
          contributions, market volatility, and sequence of returns risk. The success probability represents the
          percentage of scenarios where your portfolio meets or exceeds the target amount by the target date.
        </p>
      </div>
    </div>
  );
}

/**
 * StatCard - Small stat display card
 */
interface StatCardProps {
  label: string;
  value: string;
  subtitle: string;
  color: 'primary' | 'success' | 'warning' | 'error';
}

function StatCard({ label, value, subtitle, color }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary-50 border-primary-200 text-primary-900',
    success: 'bg-success-50 border-success-200 text-success-900',
    warning: 'bg-warning-50 border-warning-200 text-warning-900',
    error: 'bg-error-50 border-error-200 text-error-900',
  };

  const valueColorClasses = {
    primary: 'text-primary-700',
    success: 'text-success-700',
    warning: 'text-warning-700',
    error: 'text-error-700',
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-2xl font-bold font-mono ${valueColorClasses[color]}`}>{value}</p>
      <p className="text-xs mt-2 opacity-80">{subtitle}</p>
    </div>
  );
}

/**
 * Format currency with compact notation
 */
function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
