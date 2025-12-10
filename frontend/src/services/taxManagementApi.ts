/**
 * Tax Management API Client
 * TypeScript client for all tax management endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1/tax-management';

// ==================== Types ====================

export interface TLHReport {
  report_date: string;
  tax_year: number;
  total_losses_harvested: number;
  total_tax_benefit: number;
  opportunities_executed: number;
  opportunities_available: number;
  wash_sale_warnings: number;
  estimated_annual_savings: number;
  holdings_analyzed: number;
}

export interface TaxExportResult {
  format: string;
  tax_year: number;
  records_count: number;
  file_content: string;
  filename: string;
  export_date: string;
}

export interface MunicipalBondRecommendation {
  state: string;
  federal_tax_rate: number;
  state_tax_rate: number;
  combined_tax_rate: number;
  in_state_yield: number;
  out_of_state_yield: number;
  taxable_yield: number;
  in_state_tax_equivalent_yield: number;
  out_of_state_tax_equivalent_yield: number;
  recommended_allocation: string;
  estimated_tax_savings: number;
  reasoning: string;
}

export interface TaxAlphaResult {
  annual_tax_savings: number;
  tax_alpha_percentage: number;
  asset_location_benefit: number;
  tlh_benefit: number;
  withdrawal_benefit: number;
  muni_benefit: number;
  cumulative_30_year: number;
  strategies_active: number;
}

export interface RothConversionEligibility {
  is_eligible: boolean;
  strategy: string;
  max_conversion_amount: number;
  income_limit_status: string;
  pro_rata_rule_applies: boolean;
  pro_rata_taxable_percentage: number;
  eligibility_notes: string[];
  warnings: string[];
}

export interface ConversionTaxImpact {
  conversion_amount: number;
  ordinary_income_tax: number;
  state_tax: number;
  total_tax_due: number;
  effective_tax_rate: number;
  marginal_rate_impact: boolean;
  next_bracket_threshold: number;
  recommended_max_conversion: number;
  tax_bracket_before: string;
  tax_bracket_after: string;
}

export interface RothConversionRecommendation {
  recommended: boolean;
  strategy: string;
  timing: string;
  recommended_amount: number;
  estimated_tax: number;
  break_even_years: number;
  lifetime_benefit: number;
  reasoning: string[];
  action_steps: string[];
  considerations: string[];
}

export interface BackdoorRothAnalysis {
  eligibility: RothConversionEligibility;
  tax_impact: ConversionTaxImpact;
  recommendation: RothConversionRecommendation;
  current_year_contribution_limit: number;
  remaining_contribution_room: number;
  five_year_rule_date: string | null;
}

export interface StateTaxRates {
  all_rates: Record<string, { rate: number; formatted: string }>;
  high_tax_states: Record<string, any>;
  medium_tax_states: Record<string, any>;
  low_tax_states: Record<string, any>;
  no_tax_states: Record<string, any>;
  last_updated: string;
}

// ==================== API Functions ====================

/**
 * Generate TLH report
 */
export async function generateTLHReport(params: {
  holdings: any[];
  opportunities: any[];
  executed_harvests: any[];
  tax_year: number;
}): Promise<TLHReport> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/tlh-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate TLH report');
  }

  return response.json();
}

/**
 * Export tax data
 */
export async function exportTaxData(params: {
  transactions: any[];
  tax_year: number;
  format: 'csv' | 'json' | 'turbotax' | 'taxact' | 'hrblock';
}): Promise<TaxExportResult> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to export tax data');
  }

  return response.json();
}

/**
 * Optimize municipal bond allocation
 */
export async function optimizeMunicipalBonds(params: {
  state: string;
  federal_tax_rate: number;
  annual_income: number;
  in_state_yield: number;
  out_of_state_yield: number;
  taxable_yield: number;
}): Promise<MunicipalBondRecommendation> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/municipal-bonds/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to optimize municipal bonds');
  }

  return response.json();
}

/**
 * Calculate tax alpha
 */
export async function calculateTaxAlpha(params: {
  portfolio_value: number;
  asset_location_benefit: number;
  tlh_benefit: number;
  withdrawal_benefit: number;
  muni_benefit: number;
}): Promise<TaxAlphaResult> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/tax-alpha`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to calculate tax alpha');
  }

  return response.json();
}

/**
 * Get state tax rates
 */
export async function getStateTaxRates(): Promise<StateTaxRates> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/state-tax-rates`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get state tax rates');
  }

  return response.json();
}

/**
 * Download tax export file
 */
export function downloadTaxExport(result: TaxExportResult): void {
  const blob = new Blob([result.file_content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// ==================== Helper Functions ====================

/**
 * Format currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Get export format display name
 */
export function getExportFormatName(format: string): string {
  const names: Record<string, string> = {
    csv: 'CSV (Generic)',
    json: 'JSON',
    turbotax: 'TurboTax (TXF)',
    taxact: 'TaxACT',
    hrblock: 'H&R Block',
  };
  return names[format] || format;
}

/**
 * Get state name from code
 */
export function getStateName(code: string): string {
  const states: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
    CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
    FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
    IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
    KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
    MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
    NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
    NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
    OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
    VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
    WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
  };
  return states[code.toUpperCase()] || code;
}

/**
 * Build example TLH report request
 */
export function buildExampleTLHRequest() {
  return {
    holdings: [
      { ticker: 'VTI', value: 50000, cost_basis: 48000 },
      { ticker: 'BND', value: 30000, cost_basis: 32000 },
    ],
    opportunities: [
      { ticker: 'BND', loss: 2000, wash_sale_risk: false },
    ],
    executed_harvests: [
      { ticker: 'BND', loss_amount: 2000, date: '2024-11-01' },
    ],
    tax_year: 2024,
  };
}

/**
 * Build example tax export request
 */
export function buildExampleExportRequest() {
  return {
    transactions: [
      {
        date: '2024-03-15',
        type: 'sell',
        security: 'VTI',
        description: 'Vanguard Total Stock Market ETF',
        quantity: 100,
        price: 220.50,
        amount: 22050,
        cost_basis: 21000,
        gain_loss: 1050,
        term: 'long',
      },
    ],
    tax_year: 2024,
    format: 'csv' as const,
  };
}

/**
 * Build example municipal bond request
 */
export function buildExampleMuniRequest() {
  return {
    state: 'CA',
    federal_tax_rate: 0.37,
    annual_income: 500000,
    in_state_yield: 0.035,
    out_of_state_yield: 0.038,
    taxable_yield: 0.045,
  };
}

/**
 * Analyze Roth conversion opportunity
 */
export async function analyzeRothConversion(params: {
  age: number;
  income: number;
  filing_status: 'single' | 'married_joint' | 'married_separate';
  traditional_ira_balance: number;
  traditional_ira_basis: number;
  roth_ira_balance: number;
  retirement_age: number;
  current_marginal_rate: number;
  expected_retirement_rate: number;
  state_tax_rate?: number;
  current_year_contributions?: number;
  proposed_conversion_amount?: number;
}): Promise<BackdoorRothAnalysis> {
  const response = await fetch(`${API_BASE_URL}${API_PREFIX}/roth-conversion/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to analyze Roth conversion');
  }

  return response.json();
}

/**
 * Build example Roth conversion request
 */
export function buildExampleRothConversionRequest() {
  return {
    age: 35,
    income: 175000,
    filing_status: 'married_joint' as const,
    traditional_ira_balance: 50000,
    traditional_ira_basis: 7000,
    roth_ira_balance: 25000,
    retirement_age: 65,
    current_marginal_rate: 0.24,
    expected_retirement_rate: 0.22,
    state_tax_rate: 0.05,
    current_year_contributions: 0,
    proposed_conversion_amount: undefined,
  };
}
