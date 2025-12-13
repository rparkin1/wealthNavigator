/**
 * Holdings Table Component
 *
 * Sortable, filterable table of portfolio holdings grouped by account
 * Following UI Redesign specifications - Week 10
 */

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import Badge from '../../ui/Badge';
import Input from '../../ui/Input';
import {
  TableIcon,
  SortAscIcon,
  SortDescIcon,
  FilterIcon,
  RefreshIcon,
} from '../icons/PortfolioIcons';
import type {
  Account,
  Holding,
  SortField,
  SortDirection,
  HoldingsFilter,
} from '../../../types/portfolio';

export interface HoldingsTableProps {
  accounts: Account[];
  onRebalance?: () => void;
}

export function HoldingsTable({ accounts, onRebalance }: HoldingsTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({ field: 'value', direction: 'desc' });

  const [filters, setFilters] = useState<HoldingsFilter>({
    search: '',
    assetClass: 'all',
    accountId: 'all',
  });

  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(
    new Set(accounts.map((a) => a.id))
  );

  // Aggregate all holdings with account info
  const allHoldings = useMemo(() => {
    return accounts.flatMap((account) =>
      account.holdings.map((holding) => ({
        ...holding,
        accountId: account.id,
        accountName: account.name,
        accountType: account.type,
        ticker: holding.symbol, // Add ticker alias
        gainLoss: holding.value - holding.costBasis,
        gainLossPercent: ((holding.value - holding.costBasis) / holding.costBasis) * 100,
      }))
    );
  }, [accounts]);

  // Filter holdings
  const filteredHoldings = useMemo(() => {
    return allHoldings.filter((holding) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          holding.name.toLowerCase().includes(searchLower) ||
          holding.symbol.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Asset class filter
      if (filters.assetClass && filters.assetClass !== 'all') {
        if (holding.assetClass !== filters.assetClass) return false;
      }

      // Account filter
      if (filters.accountId && filters.accountId !== 'all') {
        if (holding.accountId !== filters.accountId) return false;
      }

      return true;
    });
  }, [allHoldings, filters]);

  // Sort holdings
  const sortedHoldings = useMemo(() => {
    return [...filteredHoldings].sort((a, b) => {
      const aValue = a[sortConfig.field as keyof typeof a];
      const bValue = b[sortConfig.field as keyof typeof b];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [filteredHoldings, sortConfig]);

  // Group by account
  const groupedHoldings = useMemo(() => {
    const groups: Record<string, typeof sortedHoldings> = {};
    sortedHoldings.forEach((holding) => {
      if (!groups[holding.accountId]) {
        groups[holding.accountId] = [];
      }
      groups[holding.accountId].push(holding);
    });
    return groups;
  }, [sortedHoldings]);

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const toggleAccount = (accountId: string) => {
    setExpandedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const totalValue = allHoldings.reduce((sum, h) => sum + h.value, 0);
  const totalGainLoss = allHoldings.reduce((sum, h) => sum + (h.gainLoss || 0), 0);

  return (
    <Card variant="default" padding="none">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <TableIcon size={20} className="text-primary-600" />
            <span>Holdings Detail</span>
          </div>
        }
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" leftIcon={<RefreshIcon size={16} />}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={onRebalance}>
              Rebalance All
            </Button>
          </div>
        }
      />
      <CardContent>
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search holdings..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              leftIcon={<FilterIcon size={16} />}
            />
          </div>
          <select
            value={filters.accountId || 'all'}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, accountId: e.target.value }))
            }
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Total Value
            </p>
            <p className="text-xl font-bold text-gray-900 font-mono">
              {formatCurrency(totalValue)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Total Gain/Loss
            </p>
            <p
              className={`text-xl font-bold font-mono ${
                totalGainLoss >= 0 ? 'text-success-600' : 'text-error-600'
              }`}
            >
              {totalGainLoss >= 0 ? '+' : ''}
              {formatCurrency(totalGainLoss)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Holdings Count
            </p>
            <p className="text-xl font-bold text-gray-900 font-mono">
              {allHoldings.length}
            </p>
          </div>
        </div>

        {/* Holdings Table */}
        <div className="border rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <SortableHeader
                label="Ticker"
                field="ticker"
                sortConfig={sortConfig}
                onSort={handleSort}
                className="col-span-2"
              />
              <SortableHeader
                label="Name"
                field="name"
                sortConfig={sortConfig}
                onSort={handleSort}
                className="col-span-3"
              />
              <SortableHeader
                label="Value"
                field="value"
                sortConfig={sortConfig}
                onSort={handleSort}
                className="col-span-2 text-right"
              />
              <SortableHeader
                label="Gain/Loss"
                field="gainLoss"
                sortConfig={sortConfig}
                onSort={handleSort}
                className="col-span-2 text-right"
              />
              <SortableHeader
                label="%"
                field="gainLossPercent"
                sortConfig={sortConfig}
                onSort={handleSort}
                className="col-span-1 text-right"
              />
              <div className="col-span-2 text-right">Account</div>
            </div>
          </div>

          {/* Table Body - Grouped by Account */}
          <div className="divide-y divide-gray-200">
            {Object.entries(groupedHoldings).map(([accountId, holdings]) => {
              const account = accounts.find((a) => a.id === accountId)!;
              const isExpanded = expandedAccounts.has(accountId);
              const accountTotal = holdings.reduce((sum, h) => sum + h.value, 0);

              return (
                <div key={accountId}>
                  {/* Account Header */}
                  <button
                    onClick={() => toggleAccount(accountId)}
                    className="w-full bg-gray-50 hover:bg-gray-100 transition-colors px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      <span className="font-semibold text-gray-900">{account.name}</span>
                      <Badge variant="neutral" size="sm">
                        {holdings.length} holdings
                      </Badge>
                    </div>
                    <span className="text-sm font-mono text-gray-600">
                      {formatCurrency(accountTotal)}
                    </span>
                  </button>

                  {/* Holdings Rows */}
                  {isExpanded && (
                    <div className="bg-white">
                      {holdings.map((holding) => (
                        <HoldingRow key={`${holding.accountId}-${holding.symbol}`} holding={holding} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {filteredHoldings.length === 0 && (
          <div className="text-center py-12">
            <TableIcon size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No holdings found matching your filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper Components
interface SortableHeaderProps {
  label: string;
  field: SortField;
  sortConfig: { field: SortField; direction: SortDirection };
  onSort: (field: SortField) => void;
  className?: string;
}

function SortableHeader({
  label,
  field,
  sortConfig,
  onSort,
  className = '',
}: SortableHeaderProps) {
  const isActive = sortConfig.field === field;

  return (
    <button
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 hover:text-gray-900 transition-colors ${className}`}
    >
      <span>{label}</span>
      {isActive ? (
        sortConfig.direction === 'asc' ? (
          <SortAscIcon size={14} />
        ) : (
          <SortDescIcon size={14} />
        )
      ) : (
        <div className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

interface HoldingRowProps {
  holding: Holding & {
    accountName: string;
    gainLoss?: number;
    gainLossPercent?: number;
  };
}

function HoldingRow({ holding }: HoldingRowProps) {
  const gainLoss = holding.gainLoss || 0;
  const gainLossPercent = holding.gainLossPercent || 0;

  return (
    <div className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors text-sm">
      <div className="col-span-2 font-mono font-semibold text-gray-900">
        {holding.symbol}
      </div>
      <div className="col-span-3 text-gray-600 truncate">{holding.name}</div>
      <div className="col-span-2 font-mono text-right text-gray-900">
        {formatCurrency(holding.value)}
      </div>
      <div
        className={`col-span-2 font-mono text-right font-medium ${
          gainLoss >= 0 ? 'text-success-600' : 'text-error-600'
        }`}
      >
        {gainLoss >= 0 ? '+' : ''}
        {formatCurrency(gainLoss)}
      </div>
      <div
        className={`col-span-1 font-mono text-right font-medium ${
          gainLossPercent >= 0 ? 'text-success-600' : 'text-error-600'
        }`}
      >
        {gainLossPercent >= 0 ? '+' : ''}
        {gainLossPercent.toFixed(1)}%
      </div>
      <div className="col-span-2 text-right text-gray-500 text-xs truncate">
        {holding.accountName}
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
