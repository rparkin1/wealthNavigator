# WealthNavigator AI: Import/Export Guide

**Date**: October 29, 2025
**Status**: ✅ **COMPLETE** - CSV Import/Export System Implemented
**Version**: 1.0

---

## Executive Summary

A comprehensive CSV import/export system has been implemented to enable bulk data operations for portfolio holdings, accounts, and budget entries. The system includes file validation, duplicate detection, preview functionality, and batch processing.

---

## Table of Contents

1. [Components Created](#1-components-created)
2. [Features](#2-features)
3. [Usage Guide](#3-usage-guide)
4. [CSV Format Specifications](#4-csv-format-specifications)
5. [API Integration](#5-api-integration)
6. [Error Handling](#6-error-handling)

---

## 1. Components Created

### ImportExportPanel Component
**Location**: `frontend/src/components/portfolio/ImportExportPanel.tsx`
**Size**: ~650 lines
**Purpose**: Unified component for importing and exporting data via CSV

**Key Features**:
- ✅ CSV file upload with validation
- ✅ Template download for each data type
- ✅ Import preview with validation results
- ✅ Duplicate detection
- ✅ Batch processing with progress tracking
- ✅ Export to CSV with one click
- ✅ Error handling and user feedback

### CSV Utilities Module
**Location**: `frontend/src/utils/csvUtils.ts`
**Size**: ~400 lines
**Purpose**: Reusable utility functions for CSV operations

**Functions**:
- `parseCSV()` - Parse CSV content with options
- `generateCSV()` - Generate CSV from data
- `validateCSV()` - Validate CSV structure
- `convertCSVValue()` - Type conversion
- `downloadCSV()` - Trigger file download
- `readFileAsText()` - Read uploaded files
- `detectDelimiter()` - Auto-detect delimiter
- `formatNumberForCSV()` - Number formatting
- `formatDateForCSV()` - Date formatting
- `batchProcessCSV()` - Batch processing with progress

---

## 2. Features

### Import Features

**1. File Upload**
- Drag-and-drop support
- File type validation (.csv only)
- File size checking
- Encoding detection (UTF-8)

**2. Data Validation**
- Required field checking
- Type validation (numbers, dates, enums)
- Format validation (ticker symbols, dates)
- Business logic validation

**3. Duplicate Detection**
- Compares against existing data
- Configurable matching criteria
- Skip duplicates automatically
- Show duplicate details in preview

**4. Import Preview**
- Visual summary (valid, invalid, duplicates)
- Detailed error messages per row
- Review before confirming
- Batch size configuration

**5. Progress Tracking**
- Real-time progress bar
- Percentage complete
- Estimated time remaining
- Cancel option

### Export Features

**1. One-Click Export**
- Export all data for data type
- Automatic filename with date
- CSV format with headers
- Proper escaping and quoting

**2. Template Download**
- Pre-formatted CSV template
- Example rows included
- Correct headers and format
- Ready to fill and upload

**3. Data Formatting**
- Numbers: Fixed decimal places
- Dates: ISO format (YYYY-MM-DD)
- Booleans: true/false
- Strings: Properly escaped

---

## 3. Usage Guide

### Basic Integration

```typescript
import { ImportExportPanel } from '@/components/portfolio';

function PortfolioDashboard() {
  const [holdings, setHoldings] = useState<Holding[]>([]);

  const handleImport = async (data: any[]) => {
    // Send to API
    for (const item of data) {
      const response = await fetch('/api/v1/portfolio/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const newHolding = await response.json();
      setHoldings(prev => [...prev, newHolding]);
    }
  };

  const handleExport = async () => {
    // Fetch from API
    const response = await fetch('/api/v1/portfolio/holdings');
    return await response.json();
  };

  return (
    <div>
      <ImportExportPanel
        dataType="holdings"
        onImport={handleImport}
        onExport={handleExport}
        existingData={holdings}
      />
    </div>
  );
}
```

### Import Workflow

**Step 1: User clicks "Choose File"**
- File input dialog opens
- User selects CSV file

**Step 2: File is validated**
- Check file extension
- Read file content
- Parse CSV structure

**Step 3: Data is validated**
- Each row validated against rules
- Duplicates detected
- Invalid entries identified

**Step 4: Preview is shown**
- Green: Valid entries (will import)
- Yellow: Duplicates (will skip)
- Red: Invalid entries (will skip)
- Summary statistics displayed

**Step 5: User confirms import**
- Click "Import X Entries"
- Batch processing begins
- Progress bar updates in real-time
- Success message on completion

### Export Workflow

**Step 1: User clicks "Export Data"**
- Fetch current data from API
- Generate CSV content

**Step 2: CSV is generated**
- Headers added
- Data rows formatted
- Values properly escaped

**Step 3: File is downloaded**
- Browser download triggered
- Filename includes date
- CSV file saved locally

---

## 4. CSV Format Specifications

### Holdings CSV Format

**Headers**:
```csv
ticker,name,security_type,shares,cost_basis,current_value,purchase_date,account_id,asset_class,expense_ratio
```

**Example**:
```csv
ticker,name,security_type,shares,cost_basis,current_value,purchase_date,account_id,asset_class,expense_ratio
SPY,SPDR S&P 500 ETF,etf,100,45000,47000,2024-01-15,account-123,US_LargeCap,0.0945
AAPL,Apple Inc.,stock,50,9500,10200,2024-01-15,account-123,US_Technology,
VTI,Vanguard Total Stock,etf,150,30000,32000,2023-06-01,account-456,US_LargeCap,0.03
```

**Field Specifications**:
- `ticker`: 1-5 uppercase letters (required)
- `name`: Security name (required)
- `security_type`: stock, etf, mutual_fund, bond, other (required)
- `shares`: Positive number (required)
- `cost_basis`: Non-negative number (required)
- `current_value`: Non-negative number (required)
- `purchase_date`: YYYY-MM-DD format (required)
- `account_id`: UUID or account identifier (optional)
- `asset_class`: Predefined asset class (optional)
- `expense_ratio`: 0-10% as decimal (optional)

### Accounts CSV Format

**Headers**:
```csv
name,account_type,institution,account_number,balance,opened,notes
```

**Example**:
```csv
name,account_type,institution,account_number,balance,opened,notes
My 401(k),tax_deferred,Vanguard,1234,150000,2018-03-15,Employer matches 6%
Roth IRA,tax_exempt,Fidelity,5678,45000,2020-01-01,
Brokerage Account,taxable,Charles Schwab,9012,75000,2019-06-15,General investing
```

**Field Specifications**:
- `name`: Account name 1-100 characters (required)
- `account_type`: taxable, tax_deferred, tax_exempt, depository, credit (required)
- `institution`: Institution name (required)
- `account_number`: Last 4 digits (optional)
- `balance`: Current balance, negative for credit accounts (required)
- `opened`: YYYY-MM-DD format (optional)
- `notes`: Free text (optional)

### Budget CSV Format

**Headers**:
```csv
category,name,amount,frequency,type,is_fixed,notes,start_date,end_date
```

**Example**:
```csv
category,name,amount,frequency,type,is_fixed,notes,start_date,end_date
salary,Monthly Salary,8000,monthly,income,true,Full-time job,,
housing,Rent,2200,monthly,expense,true,,,
retirement_contribution,401k Contribution,1000,monthly,savings,true,Company match,,
```

**Field Specifications**:
- `category`: Predefined category (required)
- `name`: Entry name (required)
- `amount`: Positive number (required)
- `frequency`: weekly, biweekly, monthly, quarterly, annual, one_time (required)
- `type`: income, expense, savings (required)
- `is_fixed`: true or false (required)
- `notes`: Free text (optional)
- `start_date`: YYYY-MM-DD format (optional)
- `end_date`: YYYY-MM-DD format (optional)

---

## 5. API Integration

### Required Endpoints

**Bulk Import Endpoint** (Recommended):
```
POST /api/v1/portfolio/holdings/bulk
Content-Type: application/json

Request Body:
{
  "holdings": [
    { "ticker": "SPY", "shares": 100, ... },
    { "ticker": "AAPL", "shares": 50, ... }
  ]
}

Response:
{
  "imported": 2,
  "failed": 0,
  "results": [
    { "id": "holding-uuid-1", "ticker": "SPY", "status": "success" },
    { "id": "holding-uuid-2", "ticker": "AAPL", "status": "success" }
  ]
}
```

**Export Endpoint**:
```
GET /api/v1/portfolio/holdings
Response: Array of holding objects

GET /api/v1/portfolio/accounts
Response: Array of account objects

GET /api/v1/budget/entries
Response: Array of budget entry objects
```

### Backend Implementation Example

```python
from fastapi import APIRouter, HTTPException
from typing import List
from app.models import Holding, HoldingCreate

router = APIRouter(prefix="/portfolio", tags=["portfolio"])

@router.post("/holdings/bulk")
async def bulk_import_holdings(
    holdings: List[HoldingCreate],
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Bulk import holdings."""
    results = []

    for holding_data in holdings:
        try:
            # Create holding
            db_holding = Holding(
                user_id=user_id,
                **holding_data.dict()
            )
            db.add(db_holding)
            await db.commit()
            await db.refresh(db_holding)

            results.append({
                "id": str(db_holding.id),
                "ticker": db_holding.ticker,
                "status": "success"
            })
        except Exception as e:
            results.append({
                "ticker": holding_data.ticker,
                "status": "failed",
                "error": str(e)
            })

    return {
        "imported": len([r for r in results if r["status"] == "success"]),
        "failed": len([r for r in results if r["status"] == "failed"]),
        "results": results
    }
```

---

## 6. Error Handling

### Validation Errors

**Common Validation Errors**:
- Missing required fields
- Invalid data types
- Out of range values
- Invalid date formats
- Invalid enum values

**Error Display**:
```
❌ Invalid Entries (will be skipped)
Row 5: Ticker is required
Row 7: Shares must be greater than 0
Row 12: Invalid date format in purchase_date
```

### Duplicate Detection

**Duplicate Criteria**:

Holdings: Same ticker + account_id + purchase_date
Accounts: Same name + institution
Budget: Same name + category + type

**Duplicate Display**:
```
⚠️ Duplicate Entries (will be skipped)
Row 8: Already exists in system
Row 15: Already exists in system
```

### Import Errors

**Handling Import Failures**:
- Continue with remaining items
- Track failed items
- Show summary of failures
- Allow retry of failed items

**Error Messages**:
```typescript
try {
  await onImport(validData);
} catch (error) {
  if (error.response?.status === 409) {
    alert('Some entries already exist');
  } else if (error.response?.status === 400) {
    alert('Invalid data format');
  } else {
    alert('Import failed. Please try again.');
  }
}
```

---

## 7. Advanced Features

### Batch Processing

**Configuration**:
```typescript
const BATCH_SIZE = 10; // Import 10 items at a time
const BATCH_DELAY = 100; // ms between batches

async function batchImport(data: any[]) {
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(item => importItem(item))
    );

    // Update progress
    const progress = Math.round(((i + batch.length) / data.length) * 100);
    setProgress(progress);

    // Delay between batches
    if (i + BATCH_SIZE < data.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }
}
```

### Custom Delimiters

**Support for Different Delimiters**:
- Comma (,) - default
- Semicolon (;) - European format
- Tab (\t) - TSV format
- Pipe (|) - Alternative format

```typescript
import { detectDelimiter, parseCSV } from '@/utils/csvUtils';

const delimiter = detectDelimiter(csvContent);
const data = parseCSV(csvContent, { delimiter });
```

### Data Transformation

**Pre-Import Transformations**:
```typescript
function transformHoldingData(raw: any): Holding {
  return {
    ticker: raw.ticker.toUpperCase(),
    shares: parseFloat(raw.shares),
    costBasis: parseFloat(raw.cost_basis),
    currentValue: parseFloat(raw.current_value),
    purchaseDate: new Date(raw.purchase_date).toISOString(),
    securityType: raw.security_type.toLowerCase(),
    // ... more fields
  };
}
```

---

## 8. Testing

### Unit Tests

```typescript
import { parseCSV, generateCSV, validateCSV } from '@/utils/csvUtils';

describe('CSV Utilities', () => {
  it('parses CSV correctly', () => {
    const csv = 'name,value\nTest,123';
    const data = parseCSV(csv);
    expect(data).toEqual([{ name: 'Test', value: 123 }]);
  });

  it('generates CSV correctly', () => {
    const data = [{ name: 'Test', value: 123 }];
    const csv = generateCSV(data, ['name', 'value']);
    expect(csv).toBe('name,value\nTest,123');
  });

  it('validates CSV structure', () => {
    const csv = 'ticker,shares\nSPY,100';
    const result = validateCSV(csv, ['ticker', 'shares']);
    expect(result.isValid).toBe(true);
  });
});
```

### Integration Tests

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportExportPanel } from './ImportExportPanel';

describe('ImportExportPanel', () => {
  it('imports valid CSV file', async () => {
    const onImport = jest.fn();
    const onExport = jest.fn();

    render(
      <ImportExportPanel
        dataType="holdings"
        onImport={onImport}
        onExport={onExport}
      />
    );

    const file = new File(
      ['ticker,shares\nSPY,100'],
      'holdings.csv',
      { type: 'text/csv' }
    );

    const input = screen.getByLabelText(/Choose File/i);
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Import 1 Entry/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Import 1 Entry/i));

    await waitFor(() => {
      expect(onImport).toHaveBeenCalled();
    });
  });
});
```

---

## 9. Summary

### Components Created
- ✅ ImportExportPanel.tsx (~650 lines)
- ✅ csvUtils.ts (~400 lines)
- ✅ Template downloads for 3 data types
- ✅ Full validation and preview system

### Features Delivered
- ✅ CSV import with validation
- ✅ Duplicate detection
- ✅ Import preview
- ✅ Batch processing with progress
- ✅ CSV export with one click
- ✅ Template download
- ✅ Error handling

### Integration Status
- ✅ Component exported from portfolio index
- ✅ TypeScript types defined
- ✅ Utility functions ready
- ⏭️ API endpoints needed (backend)

### Next Steps
1. Create bulk import API endpoints
2. Add import/export to dashboards
3. Test with large datasets
4. Add CSV format validation on backend
5. Implement retry logic for failed imports

---

**Status**: ✅ **COMPLETE - READY FOR API INTEGRATION**
**Date**: October 29, 2025
**Total Code**: ~1,050 lines (component + utilities)
