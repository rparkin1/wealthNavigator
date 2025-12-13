/**
 * Allocation Comparison Component
 *
 * Displays current vs target asset allocation using dual pie charts
 * Following UI Redesign specifications - Week 10
 */

import { Card, CardHeader, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { WarningIcon, CheckCircleIcon } from '../icons/PortfolioIcons';
import type { AssetAllocation } from '../../../types/portfolio';

export interface AllocationComparisonProps {
  currentAllocation: AssetAllocation;
  targetAllocation: AssetAllocation;
  onOptimize?: () => void;
}

// Asset class labels and colors
const ASSET_CLASS_CONFIG: Record<string, { label: string; color: string }> = {
  us_stocks: { label: 'US Stocks', color: '#3b82f6' },
  intl_stocks: { label: 'International Stocks', color: '#8b5cf6' },
  bonds: { label: 'Bonds', color: '#10b981' },
  cash: { label: 'Cash', color: '#f59e0b' },
  reits: { label: 'REITs', color: '#ef4444' },
  commodities: { label: 'Commodities', color: '#06b6d4' },
};

export function AllocationComparison({
  currentAllocation,
  targetAllocation,
  onOptimize,
}: AllocationComparisonProps) {
  // Transform data for charts
  const currentData = Object.entries(currentAllocation).map(([key, value]) => ({
    name: ASSET_CLASS_CONFIG[key]?.label || key,
    value: value * 100, // Convert to percentage
    percentage: value,
  }));

  const targetData = Object.entries(targetAllocation).map(([key, value]) => ({
    name: ASSET_CLASS_CONFIG[key]?.label || key,
    value: value * 100,
    percentage: value,
  }));

  // Calculate variances
  const variances = calculateVariances(currentAllocation, targetAllocation);
  const needsRebalancing = variances.some(v => Math.abs(v.variance) > 0.05);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-1">{payload[0].name}</p>
        <p className="text-sm text-gray-600">
          {payload[0].value.toFixed(1)}%
        </p>
      </div>
    );
  };

  return (
    <Card variant="default" padding="none">
      <CardHeader
        title="Asset Allocation"
        action={
          needsRebalancing && (
            <Button variant="primary" size="sm" onClick={onOptimize}>
              Optimize Allocation
            </Button>
          )
        }
      />
      <CardContent>
        {/* Dual Pie Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          {/* Current Allocation */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Current Allocation
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={currentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {currentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={ASSET_CLASS_CONFIG[Object.keys(currentAllocation)[index]]?.color || '#9ca3af'}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Target Allocation */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Target Allocation
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={targetData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {targetData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={ASSET_CLASS_CONFIG[Object.keys(targetAllocation)[index]]?.color || '#9ca3af'}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Variance Table */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
            Allocation Variance
          </h4>
          <div className="space-y-2">
            {variances.map((item) => (
              <div
                key={item.assetClass}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 font-mono">
                    {(item.current * 100).toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-400">→</span>
                  <span className="text-sm text-gray-600 font-mono">
                    {(item.target * 100).toFixed(1)}%
                  </span>
                  {Math.abs(item.variance) > 0.05 ? (
                    <Badge variant="warning" size="sm">
                      <WarningIcon size={12} className="mr-1" />
                      {item.variance > 0 ? '+' : ''}
                      {(item.variance * 100).toFixed(1)}%
                    </Badge>
                  ) : (
                    <Badge variant="success" size="sm">
                      <CheckCircleIcon size={12} className="mr-1" />
                      On Target
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rebalancing Recommendation */}
        {needsRebalancing && (
          <div className="mt-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <div className="flex items-start gap-3">
              <WarningIcon size={20} className="text-warning-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-warning-900 mb-1">
                  Rebalancing Recommended
                </h5>
                <p className="text-sm text-warning-700">
                  Your portfolio has drifted from target allocation. Consider rebalancing to optimize
                  risk-adjusted returns.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Custom label renderer for pie chart
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  if (percent < 0.05) return null; // Don't show labels for small slices

  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Helper function to calculate variances
function calculateVariances(current: AssetAllocation, target: AssetAllocation) {
  const variances: Array<{
    assetClass: string;
    label: string;
    color: string;
    current: number;
    target: number;
    variance: number;
  }> = [];

  for (const assetClass in target) {
    const config = ASSET_CLASS_CONFIG[assetClass] || {
      label: assetClass,
      color: '#9ca3af',
    };

    variances.push({
      assetClass,
      label: config.label,
      color: config.color,
      current: current[assetClass] || 0,
      target: target[assetClass] || 0,
      variance: (current[assetClass] || 0) - (target[assetClass] || 0),
    });
  }

  return variances;
}
