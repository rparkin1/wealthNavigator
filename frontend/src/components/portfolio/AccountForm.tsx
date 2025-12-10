/**
 * AccountForm Component
 *
 * Form for creating and editing investment accounts.
 * Supports different account types (Taxable, Tax-Deferred, Tax-Exempt, etc.)
 */

import { useState } from 'react';

export interface Account {
  id?: string;
  name: string;
  accountType: AccountType;
  institution: string;
  accountNumber?: string;
  balance: number;
  opened?: string;
  notes?: string;
}

export type AccountType = 'taxable' | 'tax_deferred' | 'tax_exempt' | 'depository' | 'credit';

export interface AccountFormProps {
  account?: Account | null;
  onSubmit: (accountData: Partial<Account>) => void;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}

interface FormData {
  name: string;
  accountType: AccountType;
  institution: string;
  accountNumber: string;
  balance: string;
  opened: string;
  notes: string;
}

const ACCOUNT_TYPES: Record<
  AccountType,
  { label: string; icon: string; description: string; examples: string }
> = {
  taxable: {
    label: 'Taxable',
    icon: '💼',
    description: 'Regular brokerage accounts',
    examples: 'Brokerage account, Individual account, Joint account',
  },
  tax_deferred: {
    label: 'Tax-Deferred',
    icon: '🏦',
    description: 'Pre-tax retirement accounts',
    examples: '401(k), Traditional IRA, 403(b), SEP IRA',
  },
  tax_exempt: {
    label: 'Tax-Exempt',
    icon: '🌟',
    description: 'After-tax retirement accounts',
    examples: 'Roth IRA, Roth 401(k), Roth 403(b)',
  },
  depository: {
    label: 'Bank Account',
    icon: '🏛️',
    description: 'Checking and savings accounts',
    examples: 'Checking, Savings, Money Market, CD',
  },
  credit: {
    label: 'Credit/Debt',
    icon: '💳',
    description: 'Credit cards and loans',
    examples: 'Credit card, Mortgage, Auto loan, Student loan',
  },
};

const POPULAR_INSTITUTIONS = [
  'Vanguard',
  'Fidelity',
  'Charles Schwab',
  'TD Ameritrade',
  'E*TRADE',
  'Merrill Edge',
  'Interactive Brokers',
  'Robinhood',
  'Betterment',
  'Wealthfront',
  'Bank of America',
  'Chase',
  'Wells Fargo',
  'Ally Bank',
  'Marcus by Goldman Sachs',
  'Other',
];

export function AccountForm({ account, onSubmit, onCancel, mode = 'create' }: AccountFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: account?.name || '',
    accountType: account?.accountType || 'taxable',
    institution: account?.institution || '',
    accountNumber: account?.accountNumber || '',
    balance: account?.balance?.toString() || '0',
    opened: account?.opened ? new Date(account.opened).toISOString().split('T')[0] : '',
    notes: account?.notes || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showCustomInstitution, setShowCustomInstitution] = useState(
    account?.institution && !POPULAR_INSTITUTIONS.includes(account.institution)
  );

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Account name must be less than 100 characters';
    }

    if (!formData.institution.trim()) {
      newErrors.institution = 'Institution is required';
    }

    const balance = parseFloat(formData.balance);
    if (isNaN(balance)) {
      newErrors.balance = 'Balance must be a valid number';
    } else if (formData.accountType !== 'credit' && balance < 0) {
      newErrors.balance = 'Balance cannot be negative for this account type';
    }

    if (formData.opened) {
      const openedDate = new Date(formData.opened);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (openedDate > today) {
        newErrors.opened = 'Account opening date cannot be in the future';
      }
    }

    if (formData.accountNumber && formData.accountNumber.length < 4) {
      newErrors.accountNumber = 'Account number must be at least 4 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const accountData: Partial<Account> = {
        name: formData.name.trim(),
        accountType: formData.accountType,
        institution: formData.institution.trim(),
        accountNumber: formData.accountNumber.trim() || undefined,
        balance: parseFloat(formData.balance),
        opened: formData.opened || undefined,
        notes: formData.notes.trim() || undefined,
      };

      if (account?.id) {
        accountData.id = account.id;
      }

      onSubmit(accountData);
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

  const handleInstitutionChange = (value: string) => {
    if (value === 'Other') {
      setShowCustomInstitution(true);
      updateField('institution', '');
    } else {
      setShowCustomInstitution(false);
      updateField('institution', value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Add Account' : 'Edit Account'}
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
          {/* Account Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Account Type *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(ACCOUNT_TYPES).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => updateField('accountType', key)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    formData.accountType === key
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{info.icon}</span>
                    <span className="font-semibold text-gray-900">{info.label}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{info.description}</p>
                  <p className="text-xs text-gray-500 italic">{info.examples}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Account Details</h3>

            {/* Account Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., My 401(k), Emergency Fund, Brokerage Account"
                maxLength={100}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Give this account a memorable name (e.g., "Vanguard 401(k)" or "Emergency Savings")
              </p>
            </div>

            {/* Institution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution *
              </label>
              {!showCustomInstitution ? (
                <select
                  value={formData.institution}
                  onChange={(e) => handleInstitutionChange(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.institution ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select an institution</option>
                  {POPULAR_INSTITUTIONS.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.institution}
                    onChange={(e) => updateField('institution', e.target.value)}
                    placeholder="Enter institution name"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.institution ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomInstitution(false);
                      updateField('institution', '');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    ← Choose from popular institutions
                  </button>
                </div>
              )}
              {errors.institution && <p className="mt-1 text-sm text-red-600">{errors.institution}</p>}
            </div>

            {/* Balance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Balance *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.balance}
                  onChange={(e) => updateField('balance', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.balance ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.balance && <p className="mt-1 text-sm text-red-600">{errors.balance}</p>}
              <p className="mt-1 text-xs text-gray-500">
                {formData.accountType === 'credit'
                  ? 'Enter debt amount as positive number (e.g., 5000 for $5,000 owed)'
                  : 'Current total value of this account'}
              </p>
            </div>
          </div>

          {/* Optional Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Optional Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => updateField('accountNumber', e.target.value)}
                  placeholder="Last 4 digits"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.accountNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.accountNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Last 4 digits for identification
                </p>
              </div>

              {/* Opened Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Opened
                </label>
                <input
                  type="date"
                  value={formData.opened}
                  onChange={(e) => updateField('opened', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.opened ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.opened && <p className="mt-1 text-sm text-red-600">{errors.opened}</p>}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Add any additional notes about this account..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: Investment strategy, contribution limits, employer match, etc.
              </p>
            </div>
          </div>

          {/* Tax Benefits Info */}
          {(formData.accountType === 'tax_deferred' || formData.accountType === 'tax_exempt') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">
                    {formData.accountType === 'tax_deferred'
                      ? 'Tax-Deferred Account Benefits'
                      : 'Tax-Exempt Account Benefits'}
                  </h4>
                  <p className="text-sm text-blue-800">
                    {formData.accountType === 'tax_deferred'
                      ? 'Contributions may be tax-deductible, and investments grow tax-deferred until withdrawal. Withdrawals in retirement are taxed as ordinary income.'
                      : 'Contributions are made with after-tax dollars, but qualified withdrawals in retirement are tax-free. Investments grow tax-free.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Account Summary */}
          {formData.name && formData.institution && formData.balance && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Account Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account:</span>
                  <span className="font-medium text-gray-900">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900">
                    {ACCOUNT_TYPES[formData.accountType].label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Institution:</span>
                  <span className="font-medium text-gray-900">{formData.institution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {formData.accountType === 'credit' ? 'Amount Owed:' : 'Balance:'}
                  </span>
                  <span className="font-medium text-gray-900">
                    ${parseFloat(formData.balance || '0').toLocaleString()}
                  </span>
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
            {mode === 'create' ? 'Create Account' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
