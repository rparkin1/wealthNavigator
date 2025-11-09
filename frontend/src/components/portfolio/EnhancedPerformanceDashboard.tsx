/**
 * Enhanced Performance Dashboard
 *
 * Complete performance reporting with TWR, MWR, tax reporting, and attribution
 * Completes requirements REQ-REPORT-006, REQ-REPORT-007, REQ-REPORT-008
 */

import React, { useState, useEffect } from 'react';
import { enhancedPerformanceApi } from '../../services/enhancedPerformanceApi';
import type {
  EnhancedPerformanceResponse,
  AccountPerformance,
  TaxReporting,
} from '../../services/enhancedPerformanceApi';

interface EnhancedPerformanceDashboardProps {
  userId: string;
  portfolioId?: string;
}

export const EnhancedPerformanceDashboard: React.FC<EnhancedPerformanceDashboardProps> = ({
  userId,
  portfolioId,
}) => {
  const [data, setData] = useState<EnhancedPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [peerGroup, setPeerGroup] = useState('Balanced 60/40');
  const [activeTab, setActiveTab] = useState<'overview' | 'accounts' | 'attribution' | 'tax' | 'peer'>('overview');

  useEffect(() => {
    loadPerformanceData();
  }, [userId, portfolioId]);

  const loadPerformanceData = async () => {
    setLoading(true);
    setError(null);

    const response = await enhancedPerformanceApi.analyzePerformance({
      user_id: userId,
      portfolio_id: portfolioId,
      start_date: startDate,
      end_date: endDate,
      include_tax_reporting: true,
      include_peer_comparison: true,
      peer_group: peerGroup,
      tax_rate_short_term: 0.37,
      tax_rate_long_term: 0.20,
    });

    if (response.error) {
      setError(response.error);
    } else {
      setData(response.data);
    }

    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getReturnColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getReturnBgColor = (value: number) => {
    if (value > 0) return 'bg-green-50 border-green-200';
    if (value < 0) return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Analyzing enhanced performance...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadPerformanceData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Enhanced Performance Reporting
          </h2>
          <button
            onClick={loadPerformanceData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Refresh Analysis
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Period: {data.analysis_period} | As of {data.as_of_date}
        </p>
      </div>

      {/* Settings */}
      <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Peer Group
            </label>
            <select
              value={peerGroup}
              onChange={(e) => setPeerGroup(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Conservative 30/70">Conservative 30/70</option>
              <option value="Balanced 60/40">Balanced 60/40</option>
              <option value="Aggressive 80/20">Aggressive 80/20</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadPerformanceData}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Update Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px px-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'accounts', label: 'By Account' },
            { id: 'attribution', label: 'Attribution' },
            { id: 'tax', label: 'Tax Reporting' },
            { id: 'peer', label: 'Peer Comparison' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-600 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(data.total_value)}
                </p>
              </div>
              <div className={`border-2 rounded-lg p-4 ${getReturnBgColor(data.total_gain_loss)}`}>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Gain/Loss</p>
                <p className={`text-2xl font-bold ${getReturnColor(data.total_gain_loss)}`}>
                  {formatCurrency(data.total_gain_loss)}
                </p>
                <p className={`text-sm ${getReturnColor(data.total_gain_loss_pct)}`}>
                  {formatPercent(data.total_gain_loss_pct)}
                </p>
              </div>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-600 mb-1">TWR (Manager)</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatPercent(data.time_weighted_return.twr_percentage)}
                </p>
                <p className="text-xs text-gray-600">Removes cash flows</p>
              </div>
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                <p className="text-sm font-medium text-indigo-600 mb-1">MWR (Investor)</p>
                <p className="text-2xl font-bold text-indigo-900">
                  {formatPercent(data.money_weighted_return.mwr_percentage)}
                </p>
                <p className="text-xs text-gray-600">Includes timing</p>
              </div>
            </div>

            {/* Return Comparison */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Return Methodology Comparison
              </h3>
              <div className="grid grid-cols-3 gap-6 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Simple Return</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatPercent(data.return_comparison.simple_return)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time-Weighted Return</p>
                  <p className="text-xl font-bold text-purple-700">
                    {formatPercent(data.return_comparison.time_weighted_return)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Money-Weighted Return</p>
                  <p className="text-xl font-bold text-indigo-700">
                    {formatPercent(data.return_comparison.money_weighted_return)}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Interpretation:</span> {data.return_comparison.interpretation}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Difference: {formatPercent(data.return_comparison.difference_twr_vs_mwr)}
                </p>
              </div>
            </div>

            {/* Cash Flows */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flows</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Contributions</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(data.money_weighted_return.total_contributions)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Withdrawals</p>
                  <p className="text-lg font-bold text-red-700">
                    {formatCurrency(data.money_weighted_return.total_withdrawals)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Net Cash Flow</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(data.money_weighted_return.net_cash_flow)}
                  </p>
                </div>
              </div>
            </div>

            {/* Fees Impact */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fees & Expenses Impact</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Management Fees</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(data.fees_impact.management_fees)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Trading Commissions</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(data.fees_impact.trading_commissions)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Expense Ratios</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(data.fees_impact.expense_ratios)}
                  </p>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <p className="text-xs text-red-600 font-medium">Total Fees</p>
                  <p className="text-sm font-bold text-red-700">
                    {formatCurrency(data.fees_impact.total_fees)}
                  </p>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <p className="text-xs text-orange-600 font-medium">Impact on Return</p>
                  <p className="text-sm font-bold text-orange-700">
                    {formatPercent(data.fees_impact.fee_impact_on_return)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Account</h3>
            {data.accounts_performance.map((account) => (
              <div key={account.account_id} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{account.account_name}</h4>
                    <p className="text-sm text-gray-600 capitalize">{account.account_type.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(account.ending_value)}
                    </p>
                    <p className={`text-sm font-semibold ${getReturnColor(account.gain_loss)}`}>
                      {formatCurrency(account.gain_loss)} ({formatPercent(account.gain_loss_pct)})
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Beginning Value</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(account.beginning_value)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Contributions</p>
                    <p className="font-semibold text-green-600">{formatCurrency(account.contributions)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">TWR</p>
                    <p className={`font-semibold ${getReturnColor(account.twr)}`}>{formatPercent(account.twr)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">MWR</p>
                    <p className={`font-semibold ${getReturnColor(account.mwr)}`}>{formatPercent(account.mwr)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'attribution' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Enhanced Attribution Analysis
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Performance attribution shows how different factors contributed to your total return.
            </p>
            {data.enhanced_attribution.map((attr, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{attr.asset_class}</h4>
                  <span className={`text-xl font-bold ${getReturnColor(attr.contribution_to_return)}`}>
                    {formatPercent(attr.contribution_to_return)}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-600">Weight</p>
                    <p className="font-semibold text-gray-900">{formatPercent(attr.weight * 100)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Asset Return</p>
                    <p className={`font-semibold ${getReturnColor(attr.asset_return)}`}>
                      {formatPercent(attr.asset_return)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Allocation Effect</p>
                    <p className={`font-semibold ${getReturnColor(attr.allocation_effect)}`}>
                      {formatPercent(attr.allocation_effect)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Selection Effect</p>
                    <p className={`font-semibold ${getReturnColor(attr.selection_effect)}`}>
                      {formatPercent(attr.selection_effect)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {attr.currency_effect !== 0 && (
                    <div>
                      <p className="text-gray-600">Currency Effect</p>
                      <p className={`font-semibold ${getReturnColor(attr.currency_effect || 0)}`}>
                        {formatPercent(attr.currency_effect || 0)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600">Fees Impact</p>
                    <p className="font-semibold text-red-600">{formatPercent(attr.fees_impact)}</p>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="mt-4 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${attr.contribution_to_return > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{
                      width: `${Math.min(Math.abs(attr.contribution_to_return) * 10, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tax' && data.tax_reporting && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Reporting Summary</h3>

            {/* Realized Gains/Losses */}
            <div className="grid grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Realized Gains & Losses</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Short-term Gains</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(data.tax_reporting.realized_gains_short_term)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Long-term Gains</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(data.tax_reporting.realized_gains_long_term)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Short-term Losses</span>
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(data.tax_reporting.realized_losses_short_term)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Long-term Losses</span>
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(data.tax_reporting.realized_losses_long_term)}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold text-gray-900">Net Realized</span>
                    <span className={`font-bold ${getReturnColor(data.tax_reporting.net_realized_gain_loss)}`}>
                      {formatCurrency(data.tax_reporting.net_realized_gain_loss)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Unrealized Gains & Losses</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Short-term Gains</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(data.tax_reporting.unrealized_gains_short_term)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Long-term Gains</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(data.tax_reporting.unrealized_gains_long_term)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Short-term Losses</span>
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(data.tax_reporting.unrealized_losses_short_term)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Long-term Losses</span>
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(data.tax_reporting.unrealized_losses_long_term)}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold text-gray-900">Net Unrealized</span>
                    <span className={`font-bold ${getReturnColor(data.tax_reporting.net_unrealized_gain_loss)}`}>
                      {formatCurrency(data.tax_reporting.net_unrealized_gain_loss)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium mb-1">Total Cost Basis</p>
                <p className="text-xl font-bold text-blue-900">
                  {formatCurrency(data.tax_reporting.total_cost_basis)}
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-medium mb-1">Current Value</p>
                <p className="text-xl font-bold text-purple-900">
                  {formatCurrency(data.tax_reporting.total_current_value)}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600 font-medium mb-1">Estimated Tax Liability</p>
                <p className="text-xl font-bold text-red-900">
                  {formatCurrency(data.tax_reporting.estimated_tax_liability)}
                </p>
              </div>
            </div>

            {/* TLH Opportunities */}
            {data.tax_reporting.tlh_opportunities_count > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-900 mb-2">
                  Tax-Loss Harvesting Opportunities
                </h4>
                <p className="text-sm text-green-700 mb-3">
                  {data.tax_reporting.tlh_opportunities_count} positions available for tax-loss harvesting
                </p>
                <div className="bg-white rounded p-4">
                  <p className="text-sm text-gray-600">Potential Tax Savings</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(data.tax_reporting.tlh_potential_savings)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'peer' && data.peer_comparison && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Peer Group Comparison</h3>

            {/* Performance Rating */}
            <div className={`border-2 rounded-lg p-6 ${
              data.peer_comparison.performance_rating === 'Excellent' ? 'bg-green-50 border-green-300' :
              data.peer_comparison.performance_rating === 'Above Average' ? 'bg-blue-50 border-blue-300' :
              data.peer_comparison.performance_rating === 'Average' ? 'bg-yellow-50 border-yellow-300' :
              'bg-orange-50 border-orange-300'
            }`}>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Your Performance Rating</p>
                <p className="text-4xl font-bold mb-2">{data.peer_comparison.performance_rating}</p>
                <p className="text-2xl font-semibold text-gray-700">
                  {data.peer_comparison.percentile_rank}th Percentile
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  vs. {data.peer_comparison.peer_group}
                </p>
              </div>
            </div>

            {/* Comparison Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Your Return</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatPercent(data.peer_comparison.portfolio_return)}
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Peer Median</p>
                <p className="text-2xl font-bold text-gray-700">
                  {formatPercent(data.peer_comparison.peer_median)}
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">vs. Median</p>
                <p className={`text-2xl font-bold ${getReturnColor(data.peer_comparison.vs_median)}`}>
                  {formatPercent(data.peer_comparison.vs_median)}
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Your Rank</p>
                <p className="text-2xl font-bold text-purple-700">
                  {data.peer_comparison.percentile_rank}th
                </p>
              </div>
            </div>

            {/* Distribution Chart */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Peer Distribution</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">75th Percentile (Top 25%)</span>
                  <span className="font-semibold text-gray-900">
                    {formatPercent(data.peer_comparison.peer_75th_percentile)}
                  </span>
                </div>
                <div className="h-8 bg-gradient-to-r from-red-200 via-yellow-200 via-green-200 to-green-400 rounded relative">
                  <div
                    className="absolute top-0 h-full w-1 bg-blue-600"
                    style={{ left: `${data.peer_comparison.percentile_rank}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-blue-600">
                      You
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Median (50th Percentile)</span>
                  <span className="font-semibold text-gray-900">
                    {formatPercent(data.peer_comparison.peer_median)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">25th Percentile (Bottom 75%)</span>
                  <span className="font-semibold text-gray-900">
                    {formatPercent(data.peer_comparison.peer_25th_percentile)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPerformanceDashboard;
