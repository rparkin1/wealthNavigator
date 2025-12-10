/**
 * Net Worth Export Component
 *
 * Exports net worth data to CSV format
 */

import React, { useCallback } from 'react';
import type { NetWorthDataPoint } from './NetWorthTrendChart';

interface NetWorthExportProps {
  data: NetWorthDataPoint[];
  timeframe: string;
}

export const NetWorthExport: React.FC<NetWorthExportProps> = ({ data, timeframe }) => {
  const exportToCSV = useCallback(() => {
    if (!data || data.length === 0) {
      alert('No data available to export');
      return;
    }

    // Create CSV header
    const headers = [
      'Date',
      'Total Net Worth',
      'Total Assets',
      'Total Liabilities',
      'Liquid Net Worth',
      'Cash',
      'Stocks',
      'Bonds',
      'Real Estate',
      'Other Assets',
      'Debt-to-Asset Ratio',
    ];

    // Create CSV rows
    const rows = data.map(point => {
      const debtToAssetRatio = point.totalLiabilities / point.totalAssets;

      return [
        point.date,
        point.totalNetWorth.toFixed(2),
        point.totalAssets.toFixed(2),
        point.totalLiabilities.toFixed(2),
        (point.liquidNetWorth || 0).toFixed(2),
        (point.assetsByClass?.cash || 0).toFixed(2),
        (point.assetsByClass?.stocks || 0).toFixed(2),
        (point.assetsByClass?.bonds || 0).toFixed(2),
        (point.assetsByClass?.realEstate || 0).toFixed(2),
        (point.assetsByClass?.other || 0).toFixed(2),
        (debtToAssetRatio * 100).toFixed(2) + '%',
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `net-worth-${timeframe.toLowerCase()}-${timestamp}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data, timeframe]);

  return (
    <button
      onClick={exportToCSV}
      className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 transition-colors font-medium shadow-md"
      title="Export to CSV"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <span className="hidden sm:inline">Export CSV</span>
    </button>
  );
};

export default NetWorthExport;
