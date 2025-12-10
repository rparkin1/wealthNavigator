/**
 * SocialSecurityCalculator Component
 *
 * Calculate Social Security benefits based on filing strategy.
 */

import { useState } from 'react';
import type { SocialSecurityResult } from '../../services/retirementApi';

interface SocialSecurityParams {
  primaryInsuranceAmount: number;
  birthYear: number;
  filingAge: number;
  colaRate: number;
}

interface SocialSecurityCalculatorProps {
  onCalculate: (result: SocialSecurityResult) => void;
  defaultParams?: Partial<SocialSecurityParams>;
}

const DEFAULT_PARAMS: SocialSecurityParams = {
  primaryInsuranceAmount: 3000,
  birthYear: 1960,
  filingAge: 67,
  colaRate: 0.025
};

export function SocialSecurityCalculator({
  onCalculate,
  defaultParams = {}
}: SocialSecurityCalculatorProps) {
  const [params, setParams] = useState<SocialSecurityParams>({
    ...DEFAULT_PARAMS,
    ...defaultParams
  });

  const [result, setResult] = useState<SocialSecurityResult | null>(null);

  const updateParam = (key: keyof SocialSecurityParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const calculateFullRetirementAge = (birthYear: number): number => {
    if (birthYear <= 1954) return 66;
    if (birthYear >= 1960) return 67;
    return 66; // Simplified for 1955-1959
  };

  const calculateBenefits = () => {
    const fra = calculateFullRetirementAge(params.birthYear);
    const ageDiff = params.filingAge - fra;

    let monthlyBenefit: number;
    let reductionPercentage = 0;
    let increasePercentage = 0;

    if (ageDiff < 0) {
      // Filing early
      reductionPercentage = Math.abs(ageDiff) * 6.67;
      monthlyBenefit = params.primaryInsuranceAmount * (1 - reductionPercentage / 100);
    } else if (ageDiff > 0) {
      // Filing late
      increasePercentage = Math.min(ageDiff * 8, 24);
      monthlyBenefit = params.primaryInsuranceAmount * (1 + increasePercentage / 100);
    } else {
      monthlyBenefit = params.primaryInsuranceAmount;
    }

    const annualBenefit = monthlyBenefit * 12;
    const breakevenAge = fra + 12;

    const calculatedResult: SocialSecurityResult = {
      monthly_benefit: monthlyBenefit,
      annual_benefit: annualBenefit,
      lifetime_benefits: {}, // Simplified for client-side calculation
      full_retirement_age: fra,
      reduction_percentage: reductionPercentage,
      increase_percentage: increasePercentage,
      breakeven_age: breakevenAge,
      // Include original parameters for income projections
      primary_insurance_amount: params.primaryInsuranceAmount,
      birth_year: params.birthYear,
      filing_age: params.filingAge,
      cola_rate: params.colaRate
    };

    setResult(calculatedResult);
    onCalculate(calculatedResult);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getFilingStrategy = (): { label: string; color: string; description: string } => {
    const fra = calculateFullRetirementAge(params.birthYear);
    if (params.filingAge === 62) {
      return {
        label: 'Early Filing (Age 62)',
        color: 'text-orange-600',
        description: 'Permanent 30% reduction but receive benefits longer'
      };
    } else if (params.filingAge === fra) {
      return {
        label: 'Full Retirement Age',
        color: 'text-blue-600',
        description: '100% of benefits with no reduction'
      };
    } else if (params.filingAge === 70) {
      return {
        label: 'Delayed Filing (Age 70)',
        color: 'text-green-600',
        description: '24% increase but receive benefits for fewer years'
      };
    } else {
      return {
        label: 'Custom Filing Age',
        color: 'text-gray-600',
        description: 'Adjust benefits based on filing age'
      };
    }
  };

  const strategy = getFilingStrategy();

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Social Security Calculator
        </h3>
        <p className="text-sm text-gray-600">
          Estimate your Social Security retirement benefits based on filing age
        </p>
      </div>

      {/* Input Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary Insurance Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Insurance Amount (PIA)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={params.primaryInsuranceAmount}
              onChange={(e) => updateParam('primaryInsuranceAmount', parseFloat(e.target.value))}
              min={0}
              step={100}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Monthly benefit at full retirement age
          </p>
        </div>

        {/* Birth Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Birth Year
          </label>
          <input
            type="number"
            value={params.birthYear}
            onChange={(e) => updateParam('birthYear', parseInt(e.target.value))}
            min={1940}
            max={2010}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Determines full retirement age
          </p>
        </div>

        {/* Filing Age Slider */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filing Age: <span className="font-bold">{params.filingAge}</span>
          </label>
          <input
            type="range"
            value={params.filingAge}
            onChange={(e) => updateParam('filingAge', parseInt(e.target.value))}
            min={62}
            max={70}
            step={1}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>62 (Early)</span>
            <span>{calculateFullRetirementAge(params.birthYear)} (FRA)</span>
            <span>70 (Max)</span>
          </div>
          <div className={`mt-2 p-3 bg-gray-50 rounded-lg ${strategy.color}`}>
            <div className="font-semibold">{strategy.label}</div>
            <div className="text-xs text-gray-600 mt-1">{strategy.description}</div>
          </div>
        </div>

        {/* COLA Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cost of Living Adjustment (COLA)
          </label>
          <div className="relative">
            <input
              type="number"
              value={(params.colaRate * 100).toFixed(1)}
              onChange={(e) => updateParam('colaRate', parseFloat(e.target.value) / 100)}
              min={0}
              max={10}
              step={0.1}
              className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute right-3 top-2 text-gray-500">%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Annual increase (avg 2.5%)
          </p>
        </div>
      </div>

      {/* Calculate Button */}
      <button
        onClick={calculateBenefits}
        className="w-full px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Calculate Benefits
      </button>

      {/* Results */}
      {result && (
        <div className="pt-6 border-t border-gray-200 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">Estimated Benefits</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Monthly Benefit</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(result.monthly_benefit)}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Annual Benefit</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(result.annual_benefit)}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Full Retirement Age:</span>
              <span className="font-semibold">{result.full_retirement_age}</span>
            </div>

            {result.reduction_percentage > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Early Filing Reduction:</span>
                <span className="font-semibold text-orange-600">
                  -{result.reduction_percentage.toFixed(1)}%
                </span>
              </div>
            )}

            {result.increase_percentage > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Delayed Filing Increase:</span>
                <span className="font-semibold text-green-600">
                  +{result.increase_percentage.toFixed(1)}%
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-600">Breakeven Age:</span>
              <span className="font-semibold">{result.breakeven_age}</span>
            </div>
          </div>

          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="flex gap-2">
              <svg className="h-5 w-5 text-yellow-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-yellow-900">
                <strong>Note:</strong> This is a simplified estimate. Actual benefits depend on your
                earnings history, spouse's benefits, and other factors. Consult the SSA for precise calculations.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
