/**
 * Efficient Frontier Chart Component
 *
 * Scatter plot visualization of efficient frontier with current and recommended portfolios
 * Following UI Redesign specifications - Week 10
 */

import { Card, CardHeader, CardContent } from '../../ui/Card';
import Badge from '../../ui/Badge';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Label,
} from 'recharts';
import { TrendingUpIcon } from '../icons/PortfolioIcons';
import type { EfficientFrontierPoint } from '../../../types/portfolio';

export interface EfficientFrontierProps {
  points: EfficientFrontierPoint[];
  currentPortfolio?: {
    risk: number;
    return: number;
    label: string;
  };
  recommendedPortfolio?: {
    risk: number;
    return: number;
    label: string;
  };
}

export function EfficientFrontier({
  points,
  currentPortfolio,
  recommendedPortfolio,
}: EfficientFrontierProps) {
  // Prepare data for chart
  const chartData = points.map((point) => ({
    x: point.risk * 100, // Convert to percentage
    y: point.return * 100,
    z: point.sharpeRatio * 10, // Scale for dot size
    label: point.label,
    isCurrent: point.isCurrent,
    isRecommended: point.isRecommended,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        {data.label && (
          <p className="font-semibold text-gray-900 mb-2">{data.label}</p>
        )}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Expected Return:</span>
            <span className="font-medium text-gray-900">{data.y.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Risk (Std Dev):</span>
            <span className="font-medium text-gray-900">{data.x.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Sharpe Ratio:</span>
            <span className="font-medium text-gray-900">{(data.z / 10).toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  // Find max Sharpe ratio point
  const maxSharpePoint = points.reduce((max, point) =>
    point.sharpeRatio > max.sharpeRatio ? point : max
  );

  return (
    <Card variant="default" padding="none">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <TrendingUpIcon size={20} className="text-primary-600" />
            <span>Efficient Frontier</span>
          </div>
        }
      />
      <CardContent>
        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            The efficient frontier shows the optimal portfolios offering the highest expected return
            for a given level of risk. Your current portfolio position is marked below.
          </p>

          {/* Key Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InsightCard
              label="Your Position"
              value={currentPortfolio ? `${(currentPortfolio.return).toFixed(1)}% return` : 'N/A'}
              sublabel={currentPortfolio ? `${(currentPortfolio.risk * 100).toFixed(1)}% risk` : ''}
            />
            <InsightCard
              label="Max Sharpe Ratio"
              value={(maxSharpePoint.sharpeRatio).toFixed(2)}
              sublabel={`${(maxSharpePoint.return * 100).toFixed(1)}% return, ${(maxSharpePoint.risk * 100).toFixed(1)}% risk`}
              badge={<Badge variant="success" size="sm">Recommended</Badge>}
            />
            <InsightCard
              label="Improvement Potential"
              value={currentPortfolio ? `+${((maxSharpePoint.return - currentPortfolio.return / 100) * 100).toFixed(1)}%` : 'N/A'}
              sublabel="Expected return increase"
            />
          </div>
        </div>

        {/* Scatter Plot */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

              <XAxis
                type="number"
                dataKey="x"
                name="Risk"
                unit="%"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              >
                <Label
                  value="Risk (Standard Deviation %)"
                  position="insideBottom"
                  offset={-15}
                  style={{ fontSize: '14px', fill: '#4b5563' }}
                />
              </XAxis>

              <YAxis
                type="number"
                dataKey="y"
                name="Return"
                unit="%"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              >
                <Label
                  value="Expected Return %"
                  angle={-90}
                  position="insideLeft"
                  style={{ fontSize: '14px', fill: '#4b5563', textAnchor: 'middle' }}
                />
              </YAxis>

              <ZAxis type="number" dataKey="z" range={[50, 200]} />

              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

              {/* Efficient Frontier Points */}
              <Scatter
                name="Efficient Frontier"
                data={chartData}
                fill="#3b82f6"
                fillOpacity={0.6}
              />

              {/* Current Portfolio Marker */}
              {currentPortfolio && (
                <ReferenceDot
                  x={currentPortfolio.risk * 100}
                  y={currentPortfolio.return}
                  r={8}
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth={2}
                  label={{
                    value: 'Current',
                    position: 'top',
                    fill: '#f59e0b',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
              )}

              {/* Recommended Portfolio Marker */}
              {recommendedPortfolio && (
                <ReferenceDot
                  x={recommendedPortfolio.risk * 100}
                  y={recommendedPortfolio.return}
                  r={8}
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth={2}
                  label={{
                    value: 'Recommended',
                    position: 'bottom',
                    fill: '#10b981',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <LegendItem color="#3b82f6" label="Efficient Portfolios" />
          {currentPortfolio && <LegendItem color="#f59e0b" label="Your Portfolio" marker="star" />}
          {recommendedPortfolio && <LegendItem color="#10b981" label="Recommended" marker="star" />}
        </div>

        {/* Recommendation */}
        {currentPortfolio && maxSharpePoint && (
          <div className="mt-6 p-4 bg-info-50 border border-info-200 rounded-lg">
            <h5 className="text-sm font-semibold text-info-900 mb-2">
              Portfolio Optimization Recommendation
            </h5>
            <p className="text-sm text-info-700">
              Moving to the maximum Sharpe ratio portfolio could increase your expected return by{' '}
              <span className="font-semibold">
                +{((maxSharpePoint.return - currentPortfolio.return / 100) * 100).toFixed(1)}%
              </span>{' '}
              while adjusting risk to {(maxSharpePoint.risk * 100).toFixed(1)}%.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper Components
interface InsightCardProps {
  label: string;
  value: string;
  sublabel?: string;
  badge?: React.ReactNode;
}

function InsightCard({ label, value, sublabel, badge }: InsightCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-start justify-between mb-1">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
        {badge}
      </div>
      <p className="text-lg font-bold text-gray-900 font-mono">{value}</p>
      {sublabel && <p className="text-xs text-gray-600 mt-1">{sublabel}</p>}
    </div>
  );
}

interface LegendItemProps {
  color: string;
  label: string;
  marker?: 'circle' | 'star';
}

function LegendItem({ color, label, marker = 'circle' }: LegendItemProps) {
  return (
    <div className="flex items-center gap-2">
      {marker === 'star' ? (
        <svg width="12" height="12" viewBox="0 0 12 12">
          <polygon
            points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9 3,11 3.5,7.5 1,5 4.5,4.5"
            fill={color}
            stroke="white"
            strokeWidth="1"
          />
        </svg>
      ) : (
        <div
          className="w-3 h-3 rounded-full border-2 border-white"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="text-gray-600">{label}</span>
    </div>
  );
}
