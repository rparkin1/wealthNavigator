/**
 * Rebalancing Plan Modal Component
 *
 * Modal dialog showing detailed rebalancing plan with trades and tax impact
 * Following UI Redesign specifications - Week 10
 */

import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import { DollarSignIcon, WarningIcon, CheckCircleIcon } from '../icons/PortfolioIcons';
import type { RebalancingPlanDetails } from '../../../types/portfolio';

export interface RebalancingPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: RebalancingPlanDetails;
  onExecute: () => void;
}

export function RebalancingPlanModal({
  isOpen,
  onClose,
  plan,
  onExecute,
}: RebalancingPlanModalProps) {
  const buyTrades = plan.trades.filter((t) => t.action === 'buy');
  const sellTrades = plan.trades.filter((t) => t.action === 'sell');
  const totalBuyAmount = buyTrades.reduce((sum, t) => sum + t.amount, 0);
  const totalSellAmount = sellTrades.reduce((sum, t) => sum + t.amount, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rebalancing Plan" size="lg">
      <div className="space-y-6">
        {/* Plan Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Plan Summary
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <SummaryItem
              label="Total Trades"
              value={plan.trades.length.toString()}
            />
            <SummaryItem
              label="Estimated Tax Impact"
              value={formatCurrency(plan.totalTaxImpact)}
              valueColor={plan.totalTaxImpact > 0 ? 'text-error-600' : 'text-success-600'}
            />
            <SummaryItem
              label="Trading Costs"
              value={formatCurrency(plan.estimatedCost)}
            />
            <SummaryItem
              label="Net Benefit"
              value={formatCurrency(
                (plan.expectedImprovement.returnIncrease * 10000) -
                  plan.totalTaxImpact -
                  plan.estimatedCost
              )}
              valueColor="text-success-600"
            />
          </div>
        </div>

        {/* Expected Improvements */}
        <div className="border border-success-200 bg-success-50 rounded-lg p-4">
          <div className="flex items-start gap-3 mb-3">
            <CheckCircleIcon size={20} className="text-success-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-success-900 mb-1">
                Expected Improvements
              </h4>
              <p className="text-sm text-success-700">
                Based on Modern Portfolio Theory optimization
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <ImprovementCard
              label="Return Increase"
              value={`+${(plan.expectedImprovement.returnIncrease * 100).toFixed(2)}%`}
            />
            <ImprovementCard
              label="Risk Reduction"
              value={`-${(plan.expectedImprovement.riskReduction * 100).toFixed(2)}%`}
            />
            <ImprovementCard
              label="Sharpe Improvement"
              value={`+${plan.expectedImprovement.sharpeImprovement.toFixed(3)}`}
            />
          </div>
        </div>

        {/* Trades List */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
            Recommended Trades ({plan.trades.length})
          </h3>

          {/* Sell Trades */}
          {sellTrades.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="error" size="sm">
                  SELL
                </Badge>
                <span className="text-xs text-gray-500">
                  {sellTrades.length} trades | Total: {formatCurrency(totalSellAmount)}
                </span>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b px-4 py-2 grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase">
                  <div className="col-span-3">Asset</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-2 text-right">Current %</div>
                  <div className="col-span-2 text-right">Target %</div>
                  <div className="col-span-3 text-right">Tax Impact</div>
                </div>
                {sellTrades.map((trade) => (
                  <TradeRow key={trade.id} trade={trade} />
                ))}
              </div>
            </div>
          )}

          {/* Buy Trades */}
          {buyTrades.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="success" size="sm">
                  BUY
                </Badge>
                <span className="text-xs text-gray-500">
                  {buyTrades.length} trades | Total: {formatCurrency(totalBuyAmount)}
                </span>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 border-b px-4 py-2 grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase">
                  <div className="col-span-3">Asset</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-2 text-right">Current %</div>
                  <div className="col-span-2 text-right">Target %</div>
                  <div className="col-span-3 text-right">Tax Impact</div>
                </div>
                {buyTrades.map((trade) => (
                  <TradeRow key={trade.id} trade={trade} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tax Warning */}
        {plan.totalTaxImpact > 1000 && (
          <div className="border border-warning-200 bg-warning-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <WarningIcon size={20} className="text-warning-600 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="text-sm font-semibold text-warning-900 mb-1">
                  Significant Tax Impact
                </h5>
                <p className="text-sm text-warning-700">
                  Executing this plan will result in {formatCurrency(plan.totalTaxImpact)} in
                  estimated capital gains taxes. Consider tax-loss harvesting opportunities or
                  spreading trades across tax years.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-3">
            <Button variant="secondary">Save for Later</Button>
            <Button variant="primary" onClick={onExecute}>
              Execute Plan
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Helper Components
interface SummaryItemProps {
  label: string;
  value: string;
  valueColor?: string;
}

function SummaryItem({ label, value, valueColor = 'text-gray-900' }: SummaryItemProps) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${valueColor}`}>{value}</p>
    </div>
  );
}

interface ImprovementCardProps {
  label: string;
  value: string;
}

function ImprovementCard({ label, value }: ImprovementCardProps) {
  return (
    <div className="bg-white rounded-lg p-3 text-center">
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className="text-lg font-bold text-success-600 font-mono">{value}</p>
    </div>
  );
}

interface TradeRowProps {
  trade: {
    ticker: string;
    action: 'buy' | 'sell';
    amount: number;
    currentPercent: number;
    targetPercent: number;
    tax_impact: number;
  };
}

function TradeRow({ trade }: TradeRowProps) {
  return (
    <div className="px-4 py-3 grid grid-cols-12 gap-4 text-sm hover:bg-gray-50 transition-colors border-b last:border-b-0">
      <div className="col-span-3 font-semibold text-gray-900">
        {trade.ticker}
      </div>
      <div className="col-span-2 text-right font-mono text-gray-900">
        {formatCurrency(trade.amount)}
      </div>
      <div className="col-span-2 text-right font-mono text-gray-600">
        {(trade.currentPercent * 100).toFixed(1)}%
      </div>
      <div className="col-span-2 text-right font-mono text-gray-600">
        {(trade.targetPercent * 100).toFixed(1)}%
      </div>
      <div
        className={`col-span-3 text-right font-mono font-medium ${
          trade.tax_impact > 0 ? 'text-error-600' : 'text-gray-600'
        }`}
      >
        {trade.tax_impact > 0 ? '+' : ''}
        {formatCurrency(trade.tax_impact)}
      </div>
    </div>
  );
}

// Utility Functions
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
