/**
 * WhatIfSliders Component
 * Interactive sliders for real-time scenario adjustment with debounced API calls
 */

import { useState, useEffect, useCallback } from 'react';
import { debounce } from '../../utils/debounce';

export interface WhatIfAdjustments {
  monthlyContribution?: number;
  expectedReturnStocks?: number;
  expectedReturnBonds?: number;
  inflationRate?: number;
  retirementAge?: number;
  lifeExpectancy?: number;
}

interface WhatIfSlidersProps {
  goalId: string;
  baseline: WhatIfAdjustments;
  onAdjustment: (adjustments: WhatIfAdjustments, results: any) => void;
}

export function WhatIfSliders({ goalId, baseline, onAdjustment }: WhatIfSlidersProps) {
  const [adjustments, setAdjustments] = useState<WhatIfAdjustments>(baseline);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedAnalyze = useCallback(
    debounce(async (newAdjustments: WhatIfAdjustments) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/v1/what-if/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goal_id: goalId,
            adjustments: newAdjustments,
          }),
        });

        if (!response.ok) throw new Error('Analysis failed');

        const results = await response.json();
        onAdjustment(newAdjustments, results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }, 500),
    [goalId, onAdjustment]
  );

  useEffect(() => {
    debouncedAnalyze(adjustments);
  }, [adjustments, debouncedAnalyze]);

  const handleSliderChange = (key: keyof WhatIfAdjustments, value: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">What-If Analysis</h3>
        {loading && (
          <div className="flex items-center text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Analyzing...
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Contribution: ${adjustments.monthlyContribution?.toLocaleString()}
          </label>
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={adjustments.monthlyContribution || 0}
            onChange={(e) => handleSliderChange('monthlyContribution', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock Returns: {(adjustments.expectedReturnStocks || 0).toFixed(1)}%
          </label>
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={adjustments.expectedReturnStocks || 0}
            onChange={(e) => handleSliderChange('expectedReturnStocks', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bond Returns: {(adjustments.expectedReturnBonds || 0).toFixed(1)}%
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={adjustments.expectedReturnBonds || 0}
            onChange={(e) => handleSliderChange('expectedReturnBonds', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Inflation Rate: {(adjustments.inflationRate || 0).toFixed(1)}%
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={adjustments.inflationRate || 0}
            onChange={(e) => handleSliderChange('inflationRate', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Retirement Age: {adjustments.retirementAge || 0}
          </label>
          <input
            type="range"
            min="50"
            max="75"
            step="1"
            value={adjustments.retirementAge || 0}
            onChange={(e) => handleSliderChange('retirementAge', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Life Expectancy: {adjustments.lifeExpectancy || 0}
          </label>
          <input
            type="range"
            min="75"
            max="100"
            step="1"
            value={adjustments.lifeExpectancy || 0}
            onChange={(e) => handleSliderChange('lifeExpectancy', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
