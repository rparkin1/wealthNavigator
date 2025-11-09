/**
 * Tax Projection Component
 * REQ-TAX-010: Estimate user tax liability
 * REQ-TAX-012: Multi-year tax projections
 */

import React, { useState } from 'react';
import { formatCurrency, formatPercentage } from '@/services/taxManagementApi';

// ==================== Types ====================

interface TaxProjectionProps {
  defaultIncome?: number;
  defaultState?: string;
  defaultFilingStatus?: string;
}

interface TaxProjectionResult {
  projections: Array<{
    year: number;
    agi: number;
    taxable_income: number;
    federal_tax: number;
    niit: number;
    state_tax: number;
    total_tax: number;
    effective_rate: number;
    marginal_rate: number;
  }>;
  filing_status: string;
  state: string;
  years: number;
}

// ==================== Component ====================

export const TaxProjection: React.FC<TaxProjectionProps> = ({
  defaultIncome = 150000,
  defaultState = 'CA',
  defaultFilingStatus = 'married_joint',
}) => {
  const [income, setIncome] = useState(defaultIncome);
  const [capitalGains, setCapitalGains] = useState(0);
  const [qualifiedDividends, setQualifiedDividends] = useState(0);
  const [ordinaryDividends, setOrdinaryDividends] = useState(0);
  const [state, setState] = useState(defaultState);
  const [filingStatus, setFilingStatus] = useState(defaultFilingStatus);
  const [deductions, setDeductions] = useState(0);
  const [years, setYears] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TaxProjectionResult | null>(null);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/tax-management/tax-projection`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            income,
            capital_gains: capitalGains,
            qualified_dividends: qualifiedDividends,
            ordinary_dividends: ordinaryDividends,
            state,
            filing_status: filingStatus,
            deductions,
            years
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to calculate tax projection');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate projection';
      setError(errorMessage);
      console.error('Tax projection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setResult(null);
    setError(null);
  };

  // ==================== Render ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Tax Projection Calculator</h2>
        <p className="text-gray-600 mt-1">
          Multi-year tax liability estimation with federal and state taxes
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white border rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-semibold">Income Information</h3>

        {/* Income Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordinary Income (Wages, Interest)
            </label>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="150000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Long-Term Capital Gains
            </label>
            <input
              type="number"
              value={capitalGains}
              onChange={(e) => setCapitalGains(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="25000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Qualified Dividends
            </label>
            <input
              type="number"
              value={qualifiedDividends}
              onChange={(e) => setQualifiedDividends(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="5000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordinary Dividends
            </label>
            <input
              type="number"
              value={ordinaryDividends}
              onChange={(e) => setOrdinaryDividends(parseFloat(e.target.value) || 0)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="2000"
            />
          </div>
        </div>

        {/* Tax Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="CA"
              maxLength={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filing Status
            </label>
            <select
              value={filingStatus}
              onChange={(e) => setFilingStatus(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="single">Single</option>
              <option value="married_joint">Married Filing Jointly</option>
              <option value="married_separate">Married Filing Separately</option>
              <option value="head_of_household">Head of Household</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years to Project
            </label>
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value) || 1)}
              min="1"
              max="30"
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Deductions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Itemized Deductions (0 for Standard Deduction)
          </label>
          <input
            type="number"
            value={deductions}
            onChange={(e) => setDeductions(parseFloat(e.target.value) || 0)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        {/* Calculate Button */}
        <div className="flex gap-3">
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Calculating...' : 'Calculate Projection'}
          </button>
          {result && (
            <button
              onClick={handleClear}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Calculating tax projections...</p>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Summary Cards for First Year */}
          {result.projections.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Total Tax ({result.projections[0].year})</div>
                <div className="text-3xl font-bold text-red-600">
                  {formatCurrency(result.projections[0].total_tax)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Effective Rate: {formatPercentage(result.projections[0].effective_rate)}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">Federal Tax</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(result.projections[0].federal_tax)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Marginal Rate: {formatPercentage(result.projections[0].marginal_rate)}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">State Tax ({state.toUpperCase()})</div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(result.projections[0].state_tax)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {result.projections[0].state_tax === 0 ? 'No state tax' : 'State portion'}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-6">
                <div className="text-sm text-gray-600 mb-1">NIIT (3.8%)</div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(result.projections[0].niit)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Investment income tax
                </div>
              </div>
            </div>
          )}

          {/* Multi-Year Projection Table */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              {years}-Year Tax Projection
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Year</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">AGI</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Federal</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">State</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">NIIT</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total Tax</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Effective Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {result.projections.map((projection, index) => (
                    <tr key={index} className={index === 0 ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-3 text-sm font-medium">{projection.year}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(projection.agi)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(projection.federal_tax)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(projection.state_tax)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(projection.niit)}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold">
                        {formatCurrency(projection.total_tax)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatPercentage(projection.effective_rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-sm font-bold text-right">
                      Total {years}-Year Tax:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-right">
                      {formatCurrency(
                        result.projections.reduce((sum, p) => sum + p.total_tax, 0)
                      )}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Tax Breakdown Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              Tax Calculation Details
            </h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>
                <strong>Federal Tax:</strong> Progressive brackets (10-37%) applied to ordinary income
              </li>
              <li>
                <strong>Capital Gains:</strong> Preferential rates (0%, 15%, 20%) for long-term gains and qualified dividends
              </li>
              <li>
                <strong>NIIT:</strong> 3.8% surtax on investment income above threshold ($200k single, $250k joint)
              </li>
              <li>
                <strong>State Tax:</strong> {state.toUpperCase()} income tax applied to taxable income
              </li>
              <li>
                <strong>Inflation Adjustment:</strong> 2.5% annual adjustment to brackets in future years
              </li>
              <li>
                <strong>Standard Deduction:</strong> Automatically applied if no itemized deductions specified
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
              Save Projection
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !loading && !error && (
        <div className="text-center p-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">
            Enter your income information and click "Calculate Projection" to see your estimated tax liability
          </p>
          <p className="text-sm text-gray-500">
            Projections include federal, state, and NIIT taxes with multi-year inflation adjustments
          </p>
        </div>
      )}
    </div>
  );
};
