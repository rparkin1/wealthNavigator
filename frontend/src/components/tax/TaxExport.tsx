/**
 * Tax Export Component
 * REQ-TAX-011: Tax software integration with export functionality
 */

import React, { useState } from 'react';
import { useTaxManagement, TaxExportParams } from '@/hooks/useTaxManagement';
import { downloadTaxExport, getExportFormatName } from '@/services/taxManagementApi';

// ==================== Types ====================

interface TaxExportProps {
  transactions?: any[];
  taxYear?: number;
  defaultFormat?: 'csv' | 'json' | 'turbotax' | 'taxact' | 'hrblock';
}

type ExportFormat = 'csv' | 'json' | 'turbotax' | 'taxact' | 'hrblock';

// ==================== Component ====================

export const TaxExport: React.FC<TaxExportProps> = ({
  transactions = [],
  taxYear = new Date().getFullYear(),
  defaultFormat = 'csv',
}) => {
  const {
    taxExport,
    loadingExport,
    exportError,
    exportTaxDataAction,
    clearTaxExport,
  } = useTaxManagement();

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(defaultFormat);
  const [selectedYear, setSelectedYear] = useState(taxYear);

  const formats: Array<{ value: ExportFormat; label: string; description: string }> = [
    {
      value: 'csv',
      label: 'CSV (Generic)',
      description: 'Universal format for spreadsheets and custom imports',
    },
    {
      value: 'json',
      label: 'JSON',
      description: 'Structured data format for programmatic access',
    },
    {
      value: 'turbotax',
      label: 'TurboTax (TXF)',
      description: 'Direct import into TurboTax software',
    },
    {
      value: 'taxact',
      label: 'TaxACT',
      description: 'Direct import into TaxACT software',
    },
    {
      value: 'hrblock',
      label: 'H&R Block',
      description: 'Direct import into H&R Block software',
    },
  ];

  const handleExport = async () => {
    const params: TaxExportParams = {
      transactions,
      tax_year: selectedYear,
      format: selectedFormat,
    };

    await exportTaxDataAction(params);
  };

  const handleDownload = () => {
    if (taxExport) {
      downloadTaxExport(taxExport);
    }
  };

  const handleClear = () => {
    clearTaxExport();
  };

  // ==================== Render ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Tax Data Export</h2>
        <p className="text-gray-600 mt-1">
          Export your transaction data for tax software integration
        </p>
      </div>

      {/* Export Configuration */}
      <div className="bg-white border rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-semibold">Export Settings</h3>

        {/* Tax Year Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Export Format
          </label>
          <div className="space-y-3">
            {formats.map(format => (
              <div
                key={format.value}
                className={`p-4 border rounded cursor-pointer transition-colors ${
                  selectedFormat === format.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedFormat(format.value)}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={selectedFormat === format.value}
                    onChange={() => setSelectedFormat(format.value)}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{format.label}</div>
                    <div className="text-sm text-gray-600">{format.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="bg-gray-50 rounded p-4">
          <h4 className="font-medium mb-2">Transaction Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Transactions:</span>
              <span className="ml-2 font-medium">{transactions.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Tax Year:</span>
              <span className="ml-2 font-medium">{selectedYear}</span>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={loadingExport || transactions.length === 0}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loadingExport ? 'Exporting...' : `Export as ${getExportFormatName(selectedFormat)}`}
        </button>
      </div>

      {/* Error Display */}
      {exportError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{exportError}</p>
        </div>
      )}

      {/* Loading State */}
      {loadingExport && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600">Preparing export...</p>
          </div>
        </div>
      )}

      {/* Export Success */}
      {taxExport && !loadingExport && (
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-green-700">
              Export Ready
            </h3>
            <button
              onClick={handleClear}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>

          {/* Export Details */}
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Format:</span>
                <span className="ml-2 font-medium">{getExportFormatName(taxExport.format)}</span>
              </div>
              <div>
                <span className="text-gray-600">Tax Year:</span>
                <span className="ml-2 font-medium">{taxExport.tax_year}</span>
              </div>
              <div>
                <span className="text-gray-600">Records:</span>
                <span className="ml-2 font-medium">{taxExport.records_count}</span>
              </div>
              <div>
                <span className="text-gray-600">Export Date:</span>
                <span className="ml-2 font-medium">
                  {new Date(taxExport.export_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Download {taxExport.filename}
          </button>

          {/* Usage Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h4 className="font-medium text-blue-800 mb-2">
              How to Use This Export
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li>Download the file using the button above</li>
              <li>Open your tax software ({getExportFormatName(taxExport.format)})</li>
              <li>Navigate to the import section</li>
              <li>Select the downloaded file</li>
              <li>Verify imported transactions</li>
            </ol>
          </div>
        </div>
      )}

      {/* Format Information */}
      <div className="bg-gray-50 border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Export Format Information</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium">CSV (Generic):</span>
            <span className="ml-2 text-gray-600">
              Universal format compatible with Excel, Google Sheets, and most software
            </span>
          </div>
          <div>
            <span className="font-medium">JSON:</span>
            <span className="ml-2 text-gray-600">
              Structured format for developers and custom integrations
            </span>
          </div>
          <div>
            <span className="font-medium">TurboTax (TXF):</span>
            <span className="ml-2 text-gray-600">
              Direct import format for TurboTax desktop and online versions
            </span>
          </div>
          <div>
            <span className="font-medium">TaxACT:</span>
            <span className="ml-2 text-gray-600">
              Optimized CSV format for TaxACT software import
            </span>
          </div>
          <div>
            <span className="font-medium">H&R Block:</span>
            <span className="ml-2 text-gray-600">
              Compatible format for H&R Block tax software
            </span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {transactions.length === 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            No transactions available for export
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Add transactions to your portfolio to enable tax export
          </p>
        </div>
      )}
    </div>
  );
};
