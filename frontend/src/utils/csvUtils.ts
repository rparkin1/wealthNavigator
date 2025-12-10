/**
 * CSV Utility Functions
 *
 * Helpers for parsing, generating, and validating CSV data.
 */

export interface CSVParseOptions {
  delimiter?: string;
  skipEmptyLines?: boolean;
  trimValues?: boolean;
}

export interface CSVGenerateOptions {
  delimiter?: string;
  includeHeaders?: boolean;
  escapeValues?: boolean;
}

/**
 * Parse CSV content into array of objects
 */
export function parseCSV(
  content: string,
  options: CSVParseOptions = {}
): any[] {
  const {
    delimiter = ',',
    skipEmptyLines = true,
    trimValues = true,
  } = options;

  const lines = content.split('\n');
  if (lines.length < 2) return [];

  // Parse headers
  const headers = parseCSVLine(lines[0], delimiter).map(h =>
    trimValues ? h.trim() : h
  );

  const data: any[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Skip empty lines
    if (skipEmptyLines && !line.trim()) continue;

    const values = parseCSVLine(line, delimiter);
    const row: any = {};

    headers.forEach((header, index) => {
      const value = values[index] || '';
      row[header] = trimValues ? value.trim() : value;
    });

    data.push(row);
  }

  return data;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentValue += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of value
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  // Add last value
  values.push(currentValue);

  return values;
}

/**
 * Generate CSV content from array of objects
 */
export function generateCSV(
  data: any[],
  headers: string[],
  options: CSVGenerateOptions = {}
): string {
  const {
    delimiter = ',',
    includeHeaders = true,
    escapeValues = true,
  } = options;

  const lines: string[] = [];

  // Add header row
  if (includeHeaders) {
    lines.push(headers.join(delimiter));
  }

  // Add data rows
  data.forEach(item => {
    const values = headers.map(header => {
      const value = item[header];

      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }

      // Convert to string
      const stringValue = String(value);

      // Escape if needed
      if (escapeValues && shouldEscape(stringValue, delimiter)) {
        return escapeCSVValue(stringValue);
      }

      return stringValue;
    });

    lines.push(values.join(delimiter));
  });

  return lines.join('\n');
}

/**
 * Check if value needs escaping
 */
function shouldEscape(value: string, delimiter: string): boolean {
  return (
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  );
}

/**
 * Escape CSV value with quotes
 */
function escapeCSVValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Convert CSV value to appropriate JavaScript type
 */
export function convertCSVValue(value: string): any {
  const trimmed = value.trim();

  // Empty string
  if (trimmed === '') return null;

  // Null/undefined keywords
  if (trimmed === 'null' || trimmed === 'undefined') return null;

  // Boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Number
  if (!isNaN(Number(trimmed)) && trimmed !== '') {
    return Number(trimmed);
  }

  // String (remove quotes if present)
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"');
  }

  return trimmed;
}

/**
 * Validate CSV structure
 */
export interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
  columnCount: number;
}

export function validateCSV(
  content: string,
  requiredHeaders?: string[]
): CSVValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const lines = content.trim().split('\n');

  // Check if empty
  if (lines.length === 0) {
    errors.push('CSV file is empty');
    return {
      isValid: false,
      errors,
      warnings,
      rowCount: 0,
      columnCount: 0,
    };
  }

  // Parse headers
  const headers = parseCSVLine(lines[0], ',');
  const columnCount = headers.length;

  // Check required headers
  if (requiredHeaders) {
    const missingHeaders = requiredHeaders.filter(
      header => !headers.includes(header)
    );
    if (missingHeaders.length > 0) {
      errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
    }
  }

  // Check data rows
  let invalidRowCount = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue; // Skip empty lines

    const values = parseCSVLine(line, ',');
    if (values.length !== columnCount) {
      invalidRowCount++;
      warnings.push(
        `Row ${i + 1}: Expected ${columnCount} columns, found ${values.length}`
      );
    }
  }

  if (invalidRowCount > 5) {
    errors.push(
      `Too many rows with column count mismatch (${invalidRowCount} rows)`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    rowCount: lines.length - 1, // Exclude header
    columnCount,
  };
}

/**
 * Download CSV file
 */
export function downloadCSV(
  content: string,
  filename: string
): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Read file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Detect CSV delimiter
 */
export function detectDelimiter(content: string): string {
  const delimiters = [',', ';', '\t', '|'];
  const firstLine = content.split('\n')[0];

  const counts = delimiters.map(delimiter => ({
    delimiter,
    count: firstLine.split(delimiter).length,
  }));

  counts.sort((a, b) => b.count - a.count);

  return counts[0].delimiter;
}

/**
 * Format number for CSV export
 */
export function formatNumberForCSV(
  value: number,
  decimals: number = 2
): string {
  return value.toFixed(decimals);
}

/**
 * Format date for CSV export
 */
export function formatDateForCSV(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Batch process CSV data
 */
export async function batchProcessCSV<T>(
  data: any[],
  processor: (batch: any[]) => Promise<T[]>,
  batchSize: number = 10,
  onProgress?: (progress: number) => void
): Promise<T[]> {
  const results: T[] = [];
  const totalBatches = Math.ceil(data.length / batchSize);

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);

    // Report progress
    if (onProgress) {
      const currentBatch = Math.floor(i / batchSize) + 1;
      const progress = (currentBatch / totalBatches) * 100;
      onProgress(Math.round(progress));
    }
  }

  return results;
}
