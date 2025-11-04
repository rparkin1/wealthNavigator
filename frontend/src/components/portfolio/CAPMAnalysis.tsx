/**
 * CAPM Analysis Component
 * Displays Capital Asset Pricing Model analysis with Security Market Line
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TrendingUp, Info, AlertCircle } from 'lucide-react';
import {
  useCAPMAnalysis,
  generateSampleCAPMData,
  generateSampleSMLData,
} from '../../hooks/useCAPMAnalysis';
import type { CAPMAnalysisRequest } from '../../types/factorAnalysis';
import { SecurityMarketLineChart } from './charts/SecurityMarketLineChart';

interface CAPMAnalysisProps {
  securityReturns?: number[];
  marketReturns?: number[];
  securityName?: string;
  demoMode?: boolean;
}

export function CAPMAnalysis({
  securityReturns,
  marketReturns,
  securityName = 'Portfolio',
  demoMode = false,
}: CAPMAnalysisProps) {
  const { data, smlData, loading, error, analyzeSecurity, fetchSML } = useCAPMAnalysis();
  const [frequency, setFrequency] = useState<'daily' | 'monthly'>('daily');

  // Use demo data if in demo mode or if analysis hasn't been run
  const displayData = demoMode || !data ? generateSampleCAPMData() : data;
  const displaySMLData = demoMode || !smlData ? generateSampleSMLData() : smlData;
  const isDemoData = demoMode || !data;

  const handleAnalyze = async () => {
    if (!securityReturns || !marketReturns) {
      return;
    }

    const request: CAPMAnalysisRequest = {
      security_returns: securityReturns,
      market_returns: marketReturns,
      frequency,
      security_name: securityName,
    };

    const result = await analyzeSecurity(request);

    // Fetch SML data if analysis successful
    if (result.data) {
      await fetchSML(0, 2.0, 50);
    }
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatNumber = (value: number, decimals = 2) => {
    return value.toFixed(decimals);
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'undervalued':
        return 'text-green-600';
      case 'overvalued':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'undervalued':
        return 'Undervalued (Above SML)';
      case 'overvalued':
        return 'Overvalued (Below SML)';
      default:
        return 'Fair Value (On SML)';
    }
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
                CAPM Analysis - {securityName}
                {isDemoData && (
                  <Badge variant="secondary" className="ml-2">
                    Demo Data
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Capital Asset Pricing Model - Risk-return analysis and Security Market Line
              </CardDescription>
            </div>
            {!demoMode && securityReturns && marketReturns && (
              <div className="flex gap-2">
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value as 'daily' | 'monthly')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  disabled={loading}
                >
                  <option value="daily">Daily Returns</option>
                  <option value="monthly">Monthly Returns</option>
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
              <div className="text-sm text-gray-600 mb-1">Beta (β)</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(displayData.beta, 2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                95% CI: [{formatNumber(displayData.beta_confidence_interval[0], 2)},{' '}
                {formatNumber(displayData.beta_confidence_interval[1], 2)}]
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Alpha (α)</div>
              <div
                className={`text-2xl font-bold ${
                  displayData.alpha > 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatPercent(displayData.alpha)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {displayData.alpha > 0 ? 'Outperforming' : 'Underperforming'} CAPM
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Expected Return</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatPercent(displayData.expected_return)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Actual: {formatPercent(displayData.actual_return)}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Position</div>
              <div className={`text-2xl font-bold ${getPositionColor(displayData.position)}`}>
                {getPositionLabel(displayData.position)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Distance: {formatPercent(Math.abs(displayData.distance_from_sml))}
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">R-Squared</div>
              <div className="text-lg font-bold">{formatPercent(displayData.r_squared)}</div>
              <div className="text-xs text-gray-500">
                {(displayData.r_squared * 100).toFixed(1)}% of variance explained by market
              </div>
            </div>

            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Information Ratio</div>
              <div className="text-lg font-bold">{formatNumber(displayData.information_ratio, 2)}</div>
              <div className="text-xs text-gray-500">
                Alpha per unit of tracking error
              </div>
            </div>

            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Treynor Ratio</div>
              <div className="text-lg font-bold">{formatNumber(displayData.treynor_ratio, 3)}</div>
              <div className="text-xs text-gray-500">
                Excess return per unit of systematic risk
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

          {/* Tabs */}
          <Tabs defaultValue="sml" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sml">Security Market Line</TabsTrigger>
              <TabsTrigger value="metrics">Risk Metrics</TabsTrigger>
              <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
            </TabsList>

            {/* SML Chart Tab */}
            <TabsContent value="sml" className="space-y-4">
              <SecurityMarketLineChart
                data={displaySMLData}
                actualReturn={displayData.actual_return}
              />
            </TabsContent>

            {/* Risk Metrics Tab */}
            <TabsContent value="metrics" className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold mb-3">Market Risk Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Risk-Free Rate:</span>
                      <span className="ml-2 font-mono">
                        {formatPercent(displayData.risk_free_rate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Market Return:</span>
                      <span className="ml-2 font-mono">
                        {formatPercent(displayData.market_return)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Market Premium:</span>
                      <span className="ml-2 font-mono">
                        {formatPercent(displayData.market_premium)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Correlation:</span>
                      <span className="ml-2 font-mono">
                        {formatNumber(displayData.correlation, 3)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold mb-3">Tracking and Performance</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Tracking Error:</span>
                      <span className="ml-2 font-mono">
                        {formatPercent(displayData.tracking_error)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Information Ratio:</span>
                      <span className="ml-2 font-mono">
                        {formatNumber(displayData.information_ratio, 2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Treynor Ratio:</span>
                      <span className="ml-2 font-mono">
                        {formatNumber(displayData.treynor_ratio, 3)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Distance from SML:</span>
                      <span className="ml-2 font-mono">
                        {formatPercent(displayData.distance_from_sml)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Recommendation Tab */}
            <TabsContent value="recommendation" className="space-y-3">
              <Alert>
                <AlertDescription className="text-sm whitespace-pre-line">
                  {displayData.investment_recommendation}
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2 text-blue-900">CAPM Formula</h4>
                <div className="font-mono text-sm text-blue-800 mb-2">
                  E(R) = Rf + β × (Rm - Rf)
                </div>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>E(R) = Expected Return = {formatPercent(displayData.expected_return)}</p>
                  <p>Rf = Risk-Free Rate = {formatPercent(displayData.risk_free_rate)}</p>
                  <p>β = Beta = {formatNumber(displayData.beta, 2)}</p>
                  <p>Rm = Market Return = {formatPercent(displayData.market_return)}</p>
                  <p>Rm - Rf = Market Premium = {formatPercent(displayData.market_premium)}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* CAPM Concepts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Understanding CAPM</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <h4 className="font-semibold mb-1">Beta (β)</h4>
              <p className="text-sm text-gray-600">
                Measures systematic risk. β = 1.0 means the security moves with the market. β
                &gt; 1.0 means higher volatility than market. β &lt; 1.0 means lower
                volatility.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Alpha (α)</h4>
              <p className="text-sm text-gray-600">
                Excess return above CAPM expectations. Positive alpha suggests outperformance,
                negative alpha suggests underperformance relative to risk taken.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Security Market Line (SML)</h4>
              <p className="text-sm text-gray-600">
                Graphical representation of CAPM showing expected return for any level of
                systematic risk. Securities above the line are undervalued, below are
                overvalued.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Treynor Ratio</h4>
              <p className="text-sm text-gray-600">
                Risk-adjusted return measure using beta as the risk metric. Higher values
                indicate better risk-adjusted performance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
