/**
 * HoldingForm Component
 *
 * Form for adding or editing individual portfolio holdings.
 * Supports stocks, bonds, ETFs, mutual funds, and other securities.
 *
 * Updated: 2025-12-13 - Using professional SVG icons (no emoji)
 */

import { useState } from 'react';
import {
  ArrowTrendingUpIcon,
  ChartBarSquareIcon,
  BuildingLibraryIcon,
  BanknotesIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export interface Holding {
  id?: string;
  ticker: string;
  name: string;
  securityType: SecurityType;
  shares: number;
  costBasis: number;
  currentValue: number;
  purchaseDate: string;
  accountId?: string;
  assetClass?: string;
  expenseRatio?: number;
}

export type SecurityType = 'stock' | 'bond' | 'etf' | 'mutual_fund' | 'other';

export interface HoldingFormProps {
  holding?: Holding | null;
  accounts: Array<{ id: string; name: string; type: string }>;
  onSubmit: (holdingData: Partial<Holding>) => void;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}

interface FormData {
  ticker: string;
  name: string;
  securityType: SecurityType;
  shares: string;
  costBasis: string;
  currentValue: string;
  purchaseDate: string;
  accountId: string;
  assetClass: string;
  expenseRatio: string;
}

const SECURITY_TYPES: Record<SecurityType, { label: string; icon: React.ReactNode; description: string }> = {
  stock: {
    label: 'Stock',
    icon: <ArrowTrendingUpIcon className="w-8 h-8" />,
    description: 'Individual company shares',
  },
  etf: {
    label: 'ETF',
    icon: <ChartBarSquareIcon className="w-8 h-8" />,
    description: 'Exchange-traded fund',
  },
  mutual_fund: {
    label: 'Mutual Fund',
    icon: <BuildingLibraryIcon className="w-8 h-8" />,
    description: 'Actively managed fund',
  },
  bond: {
    label: 'Bond',
    icon: <BanknotesIcon className="w-8 h-8" />,
    description: 'Fixed income security',
  },
  other: {
    label: 'Other',
    icon: <DocumentTextIcon className="w-8 h-8" />,
    description: 'Other security types',
  },
};

const ASSET_CLASSES = [
  { value: 'US_LargeCap', label: 'US Large Cap' },
  { value: 'US_MidCap', label: 'US Mid Cap' },
  { value: 'US_SmallCap', label: 'US Small Cap' },
  { value: 'US_Technology', label: 'US Technology' },
  { value: 'International_Developed', label: 'International Developed' },
  { value: 'International_Emerging', label: 'International Emerging' },
  { value: 'US_Bonds', label: 'US Bonds' },
  { value: 'International_Bonds', label: 'International Bonds' },
  { value: 'Real_Estate', label: 'Real Estate (REITs)' },
  { value: 'Commodities', label: 'Commodities' },
  { value: 'Cash', label: 'Cash & Equivalents' },
  { value: 'Other', label: 'Other' },
];

export function HoldingForm({ holding, accounts, onSubmit, onCancel, mode = 'create' }: HoldingFormProps) {
  const [formData, setFormData] = useState<FormData>({
    ticker: holding?.ticker || '',
    name: holding?.name || '',
    securityType: holding?.securityType || 'stock',
    shares: holding?.shares?.toString() || '',
    costBasis: holding?.costBasis?.toString() || '',
    currentValue: holding?.currentValue?.toString() || '',
    purchaseDate: holding?.purchaseDate
      ? new Date(holding.purchaseDate).toISOString().split('T')[0]
      : '',
    accountId: holding?.accountId || (accounts.length > 0 ? accounts[0].id : ''),
    assetClass: holding?.assetClass || 'US_LargeCap',
    expenseRatio: holding?.expenseRatio?.toString() || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isLookingUp, setIsLookingUp] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.ticker.trim()) {
      newErrors.ticker = 'Ticker symbol is required';
    } else if (!/^[A-Z]{1,5}$/.test(formData.ticker.toUpperCase())) {
      newErrors.ticker = 'Invalid ticker symbol (1-5 uppercase letters)';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Security name is required';
    }

    const shares = parseFloat(formData.shares);
    if (!formData.shares || shares <= 0) {
      newErrors.shares = 'Shares must be greater than 0';
    }

    const costBasis = parseFloat(formData.costBasis);
    if (!formData.costBasis || costBasis < 0) {
      newErrors.costBasis = 'Cost basis cannot be negative';
    }

    const currentValue = parseFloat(formData.currentValue);
    if (!formData.currentValue || currentValue < 0) {
      newErrors.currentValue = 'Current value cannot be negative';
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'Purchase date is required';
    } else {
      const purchaseDate = new Date(formData.purchaseDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (purchaseDate > today) {
        newErrors.purchaseDate = 'Purchase date cannot be in the future';
      }
    }

    if (!formData.accountId && accounts.length > 0) {
      newErrors.accountId = 'Please select an account';
    }

    if (formData.expenseRatio) {
      const expenseRatio = parseFloat(formData.expenseRatio);
      if (expenseRatio < 0 || expenseRatio > 10) {
        newErrors.expenseRatio = 'Expense ratio must be between 0% and 10%';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTickerLookup = async () => {
    const ticker = formData.ticker.trim().toUpperCase();
    if (!ticker) return;

    setIsLookingUp(true);
    try {
      // TODO: Integrate with real ticker lookup API (Alpha Vantage, Yahoo Finance, etc.)
      // For now, just set the ticker in uppercase
      updateField('ticker', ticker);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock data - replace with actual API call
      if (ticker === 'SPY') {
        updateField('name', 'SPDR S&P 500 ETF Trust');
        updateField('securityType', 'etf');
        updateField('assetClass', 'US_LargeCap');
        updateField('expenseRatio', '0.0945');
      } else if (ticker === 'AAPL') {
        updateField('name', 'Apple Inc.');
        updateField('securityType', 'stock');
        updateField('assetClass', 'US_Technology');
      } else if (ticker === 'VTI') {
        updateField('name', 'Vanguard Total Stock Market ETF');
        updateField('securityType', 'etf');
        updateField('assetClass', 'US_LargeCap');
        updateField('expenseRatio', '0.03');
      }
      // In production, you would call an actual API here
    } catch (error) {
      console.error('Error looking up ticker:', error);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const holdingData: Partial<Holding> = {
        ticker: formData.ticker.toUpperCase(),
        name: formData.name,
        securityType: formData.securityType,
        shares: parseFloat(formData.shares),
        costBasis: parseFloat(formData.costBasis),
        currentValue: parseFloat(formData.currentValue),
        purchaseDate: formData.purchaseDate,
        accountId: formData.accountId || undefined,
        assetClass: formData.assetClass || undefined,
        expenseRatio: formData.expenseRatio ? parseFloat(formData.expenseRatio) / 100 : undefined,
      };

      if (holding?.id) {
        holdingData.id = holding.id;
      }

      onSubmit(holdingData);
    }
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Calculate gain/loss
  const costBasis = parseFloat(formData.costBasis) || 0;
  const currentValue = parseFloat(formData.currentValue) || 0;
  const gainLoss = currentValue - costBasis;
  const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Add Portfolio Holding' : 'Edit Holding'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close form"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Security Identification */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-4">Security Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ticker Symbol */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ticker Symbol *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.ticker}
                    onChange={(e) => updateField('ticker', e.target.value.toUpperCase())}
                    onBlur={handleTickerLookup}
                    placeholder="e.g., SPY, AAPL, VTI"
                    maxLength={5}
                    className={`flex-1 px-4 py-2 border rounded-lg uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.ticker ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleTickerLookup}
                    disabled={isLookingUp || !formData.ticker}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLookingUp ? 'Looking up...' : 'Lookup'}
                  </button>
                </div>
                {errors.ticker && <p className="mt-1 text-sm text-red-600">{errors.ticker}</p>}
              </div>

              {/* Security Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Security Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., SPDR S&P 500 ETF Trust"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Security Type */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">Security Type *</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {Object.entries(SECURITY_TYPES).map(([key, info]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateField('securityType', key)}
                      className={`p-3 border-2 rounded-lg text-center transition-all ${
                        formData.securityType === key
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 hover:border-gray-400 text-gray-600'
                      }`}
                    >
                      <div className="flex justify-center mb-2">{info.icon}</div>
                      <div className="text-xs font-semibold text-gray-900">{info.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Holdings Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Position Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shares */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Shares *</label>
                <input
                  type="number"
                  value={formData.shares}
                  onChange={(e) => updateField('shares', e.target.value)}
                  placeholder="0"
                  min="0"
                  step="0.001"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.shares ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.shares && <p className="mt-1 text-sm text-red-600">{errors.shares}</p>}
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date *</label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => updateField('purchaseDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.purchaseDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.purchaseDate && <p className="mt-1 text-sm text-red-600">{errors.purchaseDate}</p>}
              </div>

              {/* Cost Basis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Cost Basis *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.costBasis}
                    onChange={(e) => updateField('costBasis', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.costBasis ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.costBasis && <p className="mt-1 text-sm text-red-600">{errors.costBasis}</p>}
                <p className="mt-1 text-xs text-gray-500">Total amount paid (including fees)</p>
              </div>

              {/* Current Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Value *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.currentValue}
                    onChange={(e) => updateField('currentValue', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.currentValue ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.currentValue && <p className="mt-1 text-sm text-red-600">{errors.currentValue}</p>}
                <p className="mt-1 text-xs text-gray-500">Current market value</p>
              </div>

              {/* Account */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account {accounts.length > 0 ? '*' : '(Optional)'}
                </label>
                {accounts.length > 0 ? (
                  <select
                    value={formData.accountId}
                    onChange={(e) => updateField('accountId', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.accountId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      No accounts created yet. Create an account first to organize your holdings.
                    </p>
                  </div>
                )}
                {errors.accountId && <p className="mt-1 text-sm text-red-600">{errors.accountId}</p>}
              </div>
            </div>
          </div>

          {/* Additional Details (Optional) */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Additional Details (Optional)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Asset Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asset Class</label>
                <select
                  value={formData.assetClass}
                  onChange={(e) => updateField('assetClass', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {ASSET_CLASSES.map((ac) => (
                    <option key={ac.value} value={ac.value}>
                      {ac.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expense Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Ratio (%)
                </label>
                <input
                  type="number"
                  value={formData.expenseRatio}
                  onChange={(e) => updateField('expenseRatio', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  max="10"
                  step="0.01"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.expenseRatio ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.expenseRatio && <p className="mt-1 text-sm text-red-600">{errors.expenseRatio}</p>}
                <p className="mt-1 text-xs text-gray-500">For ETFs and mutual funds</p>
              </div>
            </div>
          </div>

          {/* Gain/Loss Preview */}
          {costBasis > 0 && currentValue > 0 && (
            <div className={`border-2 rounded-lg p-4 ${
              gainLoss >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Position Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Cost Basis</p>
                  <p className="font-semibold text-gray-900">${costBasis.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Current Value</p>
                  <p className="font-semibold text-gray-900">${currentValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Gain/Loss</p>
                  <p className={`font-semibold ${gainLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {gainLoss >= 0 ? '+' : ''}${gainLoss.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Return</p>
                  <p className={`font-semibold ${gainLossPercent >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {gainLossPercent >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            {mode === 'create' ? 'Add Holding' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
