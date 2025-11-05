/**
 * Tax-Loss Harvesting Reporting Component
 * REQ-TAX-006: TLH reporting with losses harvested and tax benefit
 */

import React, { useState, useEffect } from 'react';
import { useTaxManagement } from '@/hooks/useTaxManagement';
import type { TLHReportParams } from '@/hooks/useTaxManagement';
import { formatCurrency, formatPercentage } from '@/services/taxManagementApi';

// ==================== Types ====================

interface TLHReportingProps {
  holdings?: any[];
  opportunities?: any[];
  executedHarvests?: any[];
  taxYear?: number;
  autoGenerate?: boolean;
}

// ==================== Component ====================

export const TLHReporting: React.FC<TLHReportingProps> = ({
  holdings = [],
  opportunities = [],
  executedHarvests = [],
  taxYear = new Date().getFullYear(),
  autoGenerate = false,
}) => {
  const {
    tlhReport,
    loadingTLH,
    tlhError,
    generateTLHReportAction,
    clearTLHReport,
  } = useTaxManagement();

  const [params, setParams] = useState<TLHReportParams>({
    holdings,
    opportunities,
    executed_harvests: executedHarvests,
    tax_year: taxYear,
  });

  // Auto-generate on mount if enabled
  useEffect(() => {
    if (autoGenerate && holdings.length > 0) {
      handleGenerate();
    }
  }, [autoGenerate]);

  const handleGenerate = async () => {
    await generateTLHReportAction(params);
  };

  const handleClear = () => {
    clearTLHReport();
  };

  // ==================== Render ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tax-Loss Harvesting Report</h2>
          <p className="text-gray-600 mt-1">
            Track losses harvested and estimated tax benefits for {params.tax_year}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={loadingTLH}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loadingTLH ? 'Generating...' : 'Generate Report'}
          </button>
          {tlhReport && (
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {tlhError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{tlhError}</p>
        </div>
      )}

      {/* Loading State */}
      {loadingTLH && (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating TLH report...</p>
          </div>
        </div>
      )}

      {/* Report Display */}
      {tlhReport && !loadingTLH && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Losses Harvested */}
            <div className="bg-white border rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Total Losses Harvested</div>
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(tlhReport.total_losses_harvested)}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                From {tlhReport.opportunities_executed} opportunities
              </div>
            </div>

            {/* Tax Benefit */}
            <div className="bg-white border rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Estimated Tax Benefit</div>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(tlhReport.total_tax_benefit)}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                ~29% effective rate
              </div>
            </div>

            {/* Opportunities Available */}
            <div className="bg-white border rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Available Opportunities</div>
              <div className="text-3xl font-bold text-blue-600">
                {tlhReport.opportunities_available}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Ready to execute
              </div>
            </div>

            {/* Wash Sale Warnings */}
            <div className="bg-white border rounded-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Wash Sale Warnings</div>
              <div className={`text-3xl font-bold ${
                tlhReport.wash_sale_warnings > 0 ? 'text-yellow-600' : 'text-gray-400'
              }`}>
                {tlhReport.wash_sale_warnings}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Potential violations
              </div>
            </div>
          </div>

          {/* Annual Savings Projection */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Estimated Annual Savings</h3>
            <div className="text-4xl font-bold text-green-700">
              {formatCurrency(tlhReport.estimated_annual_savings)}
            </div>
            <p className="text-gray-600 mt-2">
              Based on current harvesting activity and tax rates
            </p>
          </div>

          {/* Analysis Details */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Analysis Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Report Date:</span>
                <span className="ml-2 font-medium">
                  {new Date(tlhReport.report_date).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Tax Year:</span>
                <span className="ml-2 font-medium">{tlhReport.tax_year}</span>
              </div>
              <div>
                <span className="text-gray-600">Holdings Analyzed:</span>
                <span className="ml-2 font-medium">{tlhReport.holdings_analyzed}</span>
              </div>
              <div>
                <span className="text-gray-600">Opportunities Executed:</span>
                <span className="ml-2 font-medium">{tlhReport.opportunities_executed}</span>
              </div>
            </div>
          </div>

          {/* Wash Sale Warnings Detail */}
          {tlhReport.wash_sale_warnings > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Wash Sale Warnings
              </h3>
              <p className="text-yellow-700">
                {tlhReport.wash_sale_warnings} potential wash sale violation(s) detected.
                Review opportunities carefully to ensure compliance with IRS 30-day rule.
              </p>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              Recommendations
            </h3>
            <ul className="space-y-2 text-blue-700">
              {tlhReport.opportunities_available > 0 && (
                <li>
                  Execute {tlhReport.opportunities_available} available TLH opportunities
                  to maximize tax benefits
                </li>
              )}
              {tlhReport.wash_sale_warnings > 0 && (
                <li>
                  Review {tlhReport.wash_sale_warnings} wash sale warning(s) before executing
                </li>
              )}
              <li>
                Monitor portfolio regularly for new TLH opportunities
              </li>
              <li>
                Consider tax-loss harvesting as part of annual rebalancing strategy
              </li>
            </ul>
          </div>

          {/* Export Actions */}
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border rounded hover:bg-gray-50">
              Export as PDF
            </button>
            <button className="px-4 py-2 bg-white border rounded hover:bg-gray-50">
              Export as CSV
            </button>
            <button className="px-4 py-2 bg-white border rounded hover:bg-gray-50">
              Email Report
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!tlhReport && !loadingTLH && !tlhError && (
        <div className="text-center p-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">
            Click "Generate Report" to analyze your portfolio for tax-loss harvesting opportunities
          </p>
          <p className="text-sm text-gray-500">
            The report will show losses harvested, tax benefits, and available opportunities
          </p>
        </div>
      )}
    </div>
  );
};
