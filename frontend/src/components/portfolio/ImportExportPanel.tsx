/**
 * ImportExportPanel Component
 *
 * Handles CSV import and export for portfolio holdings, accounts, and budget data.
 * Features: File validation, preview, duplicate detection, batch import.
 */

import { useState, useRef } from 'react';
import type { Holding } from './HoldingForm';
import type { Account } from './AccountForm';

export interface ImportExportPanelProps {
  dataType: 'holdings' | 'accounts' | 'budget';
  onImport: (data: any[]) => Promise<void>;
  onExport: () => Promise<any[]>;
  existingData?: any[];
}

interface ImportPreview {
  valid: any[];
  invalid: Array<{ row: number; data: any; errors: string[] }>;
  duplicates: Array<{ row: number; data: any; existing: any }>;
}

const TEMPLATES = {
  holdings: {
    filename: 'holdings_template.csv',
    headers: ['ticker', 'name', 'security_type', 'shares', 'cost_basis', 'current_value', 'purchase_date', 'account_id', 'asset_class', 'expense_ratio'],
    example: [
      'SPY,SPDR S&P 500 ETF,etf,100,45000,47000,2024-01-15,account-123,US_LargeCap,0.0945',
      'AAPL,Apple Inc.,stock,50,9500,10200,2024-01-15,account-123,US_Technology,',
      'VTI,Vanguard Total Stock,etf,150,30000,32000,2023-06-01,account-456,US_LargeCap,0.03'
    ]
  },
  accounts: {
    filename: 'accounts_template.csv',
    headers: ['name', 'account_type', 'institution', 'account_number', 'balance', 'opened', 'notes'],
    example: [
      'My 401(k),tax_deferred,Vanguard,1234,150000,2018-03-15,Employer matches 6%',
      'Roth IRA,tax_exempt,Fidelity,5678,45000,2020-01-01,',
      'Brokerage Account,taxable,Charles Schwab,9012,75000,2019-06-15,General investing'
    ]
  },
  budget: {
    filename: 'budget_template.csv',
    headers: ['category', 'name', 'amount', 'frequency', 'type', 'is_fixed', 'notes', 'start_date', 'end_date'],
    example: [
      'salary,Monthly Salary,8000,monthly,income,true,Full-time job,,',
      'housing,Rent,2200,monthly,expense,true,,,',
      'retirement_contribution,401k Contribution,1000,monthly,savings,true,Company match,,'
    ]
  }
};

export function ImportExportPanel({ dataType, onImport, onExport, existingData = [] }: ImportExportPanelProps) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const template = TEMPLATES[dataType];

  // Generate CSV content
  const generateCSV = (data: any[], headers: string[]): string => {
    const headerRow = headers.join(',');
    const dataRows = data.map(item => {
      return headers.map(header => {
        const value = item[header] ?? '';
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });
    return [headerRow, ...dataRows].join('\n');
  };

  // Parse CSV content
  const parseCSV = (content: string): any[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        const value = values[index];
        // Convert to appropriate type
        if (value === '' || value === 'null' || value === 'undefined') {
          row[header] = null;
        } else if (!isNaN(Number(value)) && value !== '') {
          row[header] = Number(value);
        } else if (value === 'true' || value === 'false') {
          row[header] = value === 'true';
        } else {
          row[header] = value;
        }
      });
      data.push(row);
    }

    return data;
  };

  // Validate imported data
  const validateData = (data: any[]): ImportPreview => {
    const valid: any[] = [];
    const invalid: Array<{ row: number; data: any; errors: string[] }> = [];
    const duplicates: Array<{ row: number; data: any; existing: any }> = [];

    data.forEach((item, index) => {
      const errors: string[] = [];

      // Type-specific validation
      if (dataType === 'holdings') {
        if (!item.ticker || typeof item.ticker !== 'string') {
          errors.push('Ticker is required');
        }
        if (!item.shares || item.shares <= 0) {
          errors.push('Shares must be greater than 0');
        }
        if (item.cost_basis < 0) {
          errors.push('Cost basis cannot be negative');
        }
        if (item.current_value < 0) {
          errors.push('Current value cannot be negative');
        }

        // Check for duplicates
        const duplicate = existingData.find((existing: Holding) =>
          existing.ticker === item.ticker &&
          existing.accountId === item.account_id &&
          existing.purchaseDate === item.purchase_date
        );
        if (duplicate) {
          duplicates.push({ row: index + 2, data: item, existing: duplicate });
        }
      } else if (dataType === 'accounts') {
        if (!item.name || typeof item.name !== 'string') {
          errors.push('Account name is required');
        }
        if (!item.account_type) {
          errors.push('Account type is required');
        }
        if (!item.institution) {
          errors.push('Institution is required');
        }

        // Check for duplicates
        const duplicate = existingData.find((existing: Account) =>
          existing.name === item.name && existing.institution === item.institution
        );
        if (duplicate) {
          duplicates.push({ row: index + 2, data: item, existing: duplicate });
        }
      } else if (dataType === 'budget') {
        if (!item.name || typeof item.name !== 'string') {
          errors.push('Entry name is required');
        }
        if (!item.amount || item.amount <= 0) {
          errors.push('Amount must be greater than 0');
        }
        if (!item.category) {
          errors.push('Category is required');
        }
      }

      if (errors.length > 0) {
        invalid.push({ row: index + 2, data: item, errors });
      } else {
        valid.push(item);
      }
    });

    return { valid, invalid, duplicates };
  };

  // Handle export
  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await onExport();
      const csv = generateCSV(data, template.headers);

      // Create download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataType}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      alert(`Successfully exported ${data.length} ${dataType}!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setImporting(true);
    try {
      const content = await file.text();
      const data = parseCSV(content);
      const validated = validateData(data);

      setPreview(validated);
      setShowPreview(true);
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to read file. Please check the CSV format.');
    } finally {
      setImporting(false);
    }
  };

  // Handle import confirmation
  const handleConfirmImport = async () => {
    if (!preview || preview.valid.length === 0) return;

    setImporting(true);
    setImportProgress(0);

    try {
      // Import in batches
      const batchSize = 10;
      for (let i = 0; i < preview.valid.length; i += batchSize) {
        const batch = preview.valid.slice(i, i + batchSize);
        await onImport(batch);
        setImportProgress(Math.round(((i + batch.length) / preview.valid.length) * 100));
      }

      alert(`Successfully imported ${preview.valid.length} ${dataType}!`);
      setShowPreview(false);
      setPreview(null);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import data. Please try again.');
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    const csv = [template.headers.join(','), ...template.example].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = template.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Import/Export {dataType}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Import Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Import from CSV</h3>
            <p className="mt-1 text-sm text-gray-500">Upload a CSV file to import data</p>

            <div className="mt-4 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Choose File
              </label>

              <button
                onClick={handleDownloadTemplate}
                className="block w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
              >
                ↓ Download Template
              </button>
            </div>
          </div>
        </div>

        {/* Export Section */}
        <div className="border-2 border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Export to CSV</h3>
            <p className="mt-1 text-sm text-gray-500">Download your data as a CSV file</p>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
            >
              {exporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Import Preview Modal */}
      {showPreview && preview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h3 className="text-xl font-bold text-gray-900">Import Preview</h3>
            </div>

            {/* Content */}
            <div className="px-6 py-4 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-700">{preview.valid.length}</p>
                  <p className="text-sm text-green-600">Valid Entries</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-700">{preview.duplicates.length}</p>
                  <p className="text-sm text-yellow-600">Duplicates</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-700">{preview.invalid.length}</p>
                  <p className="text-sm text-red-600">Invalid Entries</p>
                </div>
              </div>

              {/* Invalid Entries */}
              {preview.invalid.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">❌ Invalid Entries (will be skipped)</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {preview.invalid.map((item) => (
                      <div key={item.row} className="text-sm text-red-800">
                        <strong>Row {item.row}:</strong> {item.errors.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicates */}
              {preview.duplicates.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Duplicate Entries (will be skipped)</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {preview.duplicates.map((item) => (
                      <div key={item.row} className="text-sm text-yellow-800">
                        <strong>Row {item.row}:</strong> Already exists in system
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Progress */}
              {importing && importProgress > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Importing...</span>
                    <span className="text-sm font-medium text-blue-900">{importProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${importProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreview(null);
                }}
                disabled={importing}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing || preview.valid.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                {importing
                  ? 'Importing...'
                  : `Import ${preview.valid.length} ${preview.valid.length === 1 ? 'Entry' : 'Entries'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
