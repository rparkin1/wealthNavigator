/**
 * User Settings Component
 *
 * User profile and preferences including risk tolerance, tax rates, and personal information.
 */

import { useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  age?: number;
  riskTolerance?: number; // 0.0 - 1.0
  taxRate?: number; // 0.0 - 1.0
  preferences?: {
    currency?: string;
    dateFormat?: string;
    theme?: 'light' | 'dark';
  };
}

export interface UserSettingsProps {
  userId: string;
}

export function UserSettings({ userId }: UserSettingsProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    age: '',
    riskTolerance: '0.5',
    taxRate: '0.24',
  });

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v1/users/${userId}`);
      // const data = await response.json();

      // Mock data
      const mockProfile: UserProfile = {
        id: userId,
        email: 'user@example.com',
        fullName: 'Test User',
        age: 35,
        riskTolerance: 0.6,
        taxRate: 0.24,
        preferences: {
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          theme: 'light',
        },
      };

      setProfile(mockProfile);
      setFormData({
        fullName: mockProfile.fullName,
        email: mockProfile.email,
        age: mockProfile.age?.toString() || '',
        riskTolerance: (mockProfile.riskTolerance || 0.5).toString(),
        taxRate: (mockProfile.taxRate || 0.24).toString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Validate
      const riskTolerance = parseFloat(formData.riskTolerance);
      const taxRate = parseFloat(formData.taxRate);

      if (riskTolerance < 0 || riskTolerance > 1) {
        throw new Error('Risk tolerance must be between 0 and 1');
      }

      if (taxRate < 0 || taxRate > 1) {
        throw new Error('Tax rate must be between 0 and 1');
      }

      // TODO: API call
      // await fetch(`/api/v1/users/${userId}`, {
      //   method: 'PUT',
      //   body: JSON.stringify({
      //     full_name: formData.fullName,
      //     age: parseInt(formData.age),
      //     risk_tolerance: riskTolerance,
      //     tax_rate: taxRate,
      //   }),
      // });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const getRiskToleranceLabel = (value: number): string => {
    if (value < 0.25) return 'Conservative';
    if (value < 0.5) return 'Moderate-Conservative';
    if (value < 0.75) return 'Moderate-Aggressive';
    return 'Aggressive';
  };

  const getRiskToleranceColor = (value: number): string => {
    if (value < 0.25) return 'text-green-600';
    if (value < 0.5) return 'text-blue-600';
    if (value < 0.75) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Settings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Manage your profile, financial preferences, and risk tolerance
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <span className="text-green-700">Settings saved successfully!</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {/* Personal Information */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              min="18"
              max="120"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Used for retirement planning and age-based recommendations</p>
          </div>
        </div>
      </div>

      {/* Financial Preferences */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Preferences</h3>
        <div className="space-y-6">
          {/* Risk Tolerance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Risk Tolerance
              </label>
              <span className={`text-sm font-semibold ${getRiskToleranceColor(parseFloat(formData.riskTolerance))}`}>
                {getRiskToleranceLabel(parseFloat(formData.riskTolerance))} ({(parseFloat(formData.riskTolerance) * 100).toFixed(0)}%)
              </span>
            </div>
            <input
              type="range"
              value={parseFloat(formData.riskTolerance) * 100}
              onChange={(e) => setFormData({ ...formData, riskTolerance: (parseFloat(e.target.value) / 100).toString() })}
              min="0"
              max="100"
              step="1"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Conservative (0%)</span>
              <span>Moderate (50%)</span>
              <span>Aggressive (100%)</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">What is Risk Tolerance?</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li><strong>Conservative (0-25%):</strong> Focus on capital preservation, low volatility, bonds and cash</li>
                <li><strong>Moderate (25-75%):</strong> Balanced approach, mix of stocks and bonds, moderate growth</li>
                <li><strong>Aggressive (75-100%):</strong> Maximum growth potential, high stock allocation, accepts volatility</li>
              </ul>
            </div>
          </div>

          {/* Tax Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Estimated Tax Rate
              </label>
              <span className="text-sm font-semibold text-gray-900">
                {(parseFloat(formData.taxRate) * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              value={parseFloat(formData.taxRate) * 100}
              onChange={(e) => setFormData({ ...formData, taxRate: (parseFloat(e.target.value) / 100).toString() })}
              min="0"
              max="50"
              step="1"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>24%</span>
              <span>50%</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-3">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Tax Rate Guide (2024)</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li><strong>10-12%:</strong> Lower income brackets</li>
                <li><strong>22-24%:</strong> Middle income brackets ($44k-$191k single, $89k-$364k married)</li>
                <li><strong>32-37%:</strong> Higher income brackets</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
