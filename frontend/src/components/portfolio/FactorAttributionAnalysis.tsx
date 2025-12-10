/**
 * Factor Attribution Analysis Component
 * Displays Fama-French factor analysis with exposures and performance attribution
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TrendingUp, Info, AlertCircle } from 'lucide-react';
import {
  useFactorAnalysis,
  generateSampleFactorData,
} from '../../hooks/useFactorAnalysis';
import type { FactorAnalysisRequest } from '../../types/factorAnalysis';
import { FactorExposureChart } from './charts/FactorExposureChart';
import { PerformanceAttributionChart } from './charts/PerformanceAttributionChart';

interface FactorAttributionAnalysisProps {
  portfolioReturns?: number[];
  marketReturns?: number[];
  demoMode?: boolean;
}

export function FactorAttributionAnalysis({
  portfolioReturns,
  marketReturns,
  demoMode = false,
}: FactorAttributionAnalysisProps) {
  const { data, loading, error, analyze } = useFactorAnalysis();
  const [modelType, setModelType] = useState<'three_factor' | 'five_factor'>(
    'three_factor'
  );

  // Use demo data if in demo mode or if analysis hasn't been run
  const displayData = demoMode || !data ? generateSampleFactorData() : data;
  const isDemoData = demoMode || !data;

  const handleAnalyze = async () => {
    if (!portfolioReturns || !marketReturns) {
      return;
    }

    const request: FactorAnalysisRequest = {
      portfolio_returns: portfolioReturns,
      market_returns: marketReturns,
      model_type: modelType,
      frequency: 'daily',
    };

    await analyze(request);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatNumber = (value: number, decimals = 2) => {
    return value.toFixed(decimals);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Factor Attribution Analysis
                {isDemoData && (
                  <Badge variant="secondary" className="ml-2">
                    Demo Data
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Fama-French {displayData.model_type === 'three_factor' ? '3' : '5'}-Factor
                Model - Performance attribution by risk factors
              </CardDescription>
            </div>
            {!demoMode && portfolioReturns && marketReturns && (
              <div className="flex gap-2">
                <select
                  value={modelType}
                  onChange={e =>
                    setModelType(e.target.value as 'three_factor' | 'five_factor')
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  disabled={loading}
                >
                  <option value="three_factor">3-Factor Model</option>
                  <option value="five_factor">5-Factor Model</option>
                </select>
                <Button onClick={handleAnalyze} disabled={loading}>
                  {loading ? 'Analyzing...' : 'Run Analysis'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Alpha (Annual)</div>
              <div
                className={`text-2xl font-bold ${
                  displayData.alpha_annual > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatPercent(displayData.alpha_annual)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                p-value: {displayData.alpha_p_value.toFixed(4)}
                {displayData.alpha_p_value < 0.05 && ' (significant)'}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">R-Squared</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatPercent(displayData.r_squared)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Adjusted: {formatPercent(displayData.adjusted_r_squared)}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Return</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPercent(displayData.total_return)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Annual</div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Explained Return</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatPercent(displayData.explained_return)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                By factors: {formatPercent(displayData.explained_return / displayData.total_return)}
              </div>
            </div>
          </div>

          {/* Interpretation */}
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {displayData.interpretation}
            </AlertDescription>
          </Alert>

          {/* Tabs for different views */}
          <Tabs defaultValue="exposures" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="exposures">Factor Exposures</TabsTrigger>
              <TabsTrigger value="attribution">Performance Attribution</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            {/* Factor Exposures Tab */}
            <TabsContent value="exposures" className="space-y-4">
              <FactorExposureChart exposures={displayData.exposures} />

              <div className="grid gap-3">
                {displayData.exposures.map(exposure => (
                  <div
                    key={exposure.factor_name}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-semibold">{exposure.factor_name}</span>
                        {exposure.is_significant && (
                          <Badge variant="default" className="ml-2 text-xs">
                            Significant
                          </Badge>
                        )}
                      </div>
                      <span className="text-lg font-bold">{formatNumber(exposure.beta, 3)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span>t-stat: </span>
                        <span className="font-mono">{formatNumber(exposure.t_statistic)}</span>
                      </div>
                      <div>
                        <span>p-value: </span>
                        <span className="font-mono">{exposure.p_value.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Performance Attribution Tab */}
            <TabsContent value="attribution" className="space-y-4">
              <PerformanceAttributionChart attributions={displayData.attributions} />

              <div className="grid gap-3">
                {displayData.attributions.map(attr => (
                  <div
                    key={attr.factor_name}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{attr.factor_name}</span>
                      <span className="text-lg font-bold">
                        {formatPercent(attr.contribution)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span>Beta: </span>
                        <span className="font-mono">{formatNumber(attr.beta, 3)}</span>
                      </div>
                      <div>
                        <span>Factor Return: </span>
                        <span className="font-mono">{formatPercent(attr.factor_return)}</span>
                      </div>
                      <div>
                        <span>% of Total: </span>
                        <span className="font-mono">{formatNumber(attr.contribution_pct)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-3">
              {displayData.recommendations.map((rec, idx) => (
                <Alert key={idx}>
                  <AlertDescription className="text-sm">{rec}</AlertDescription>
                </Alert>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Factor Definitions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Factor Definitions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <h4 className="font-semibold mb-1">MKT-RF (Market Risk Premium)</h4>
              <p className="text-sm text-gray-600">
                Excess return of the market over the risk-free rate. Captures broad market exposure.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">SMB (Small Minus Big)</h4>
              <p className="text-sm text-gray-600">
                Size factor: return difference between small-cap and large-cap stocks.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">HML (High Minus Low)</h4>
              <p className="text-sm text-gray-600">
                Value factor: return difference between high book-to-market (value) and low book-to-market (growth) stocks.
              </p>
            </div>
            {displayData.model_type === 'five_factor' && (
              <>
                <div>
                  <h4 className="font-semibold mb-1">RMW (Robust Minus Weak)</h4>
                  <p className="text-sm text-gray-600">
                    Profitability factor: return difference between companies with robust and weak operating profitability.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">CMA (Conservative Minus Aggressive)</h4>
                  <p className="text-sm text-gray-600">
                    Investment factor: return difference between companies with conservative and aggressive investment patterns.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
