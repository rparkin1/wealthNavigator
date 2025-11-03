/**
 * Tax Management Hook
 * State management for all tax optimization operations
 */

import { useState } from 'react';
import {
  generateTLHReport,
  exportTaxData,
  optimizeMunicipalBonds,
  calculateTaxAlpha,
  getStateTaxRates,
  TLHReport,
  TaxExportResult,
  MunicipalBondRecommendation,
  TaxAlphaResult,
  StateTaxRates,
} from '@/services/taxManagementApi';

// ==================== Types ====================

interface UseTaxManagementResult {
  // TLH Reporting
  tlhReport: TLHReport | null;
  loadingTLH: boolean;
  tlhError: string | null;
  generateTLHReportAction: (params: TLHReportParams) => Promise<void>;
  clearTLHReport: () => void;

  // Tax Export
  taxExport: TaxExportResult | null;
  loadingExport: boolean;
  exportError: string | null;
  exportTaxDataAction: (params: TaxExportParams) => Promise<void>;
  clearTaxExport: () => void;

  // Municipal Bonds
  muniRecommendation: MunicipalBondRecommendation | null;
  loadingMuni: boolean;
  muniError: string | null;
  optimizeMunicipalBondsAction: (params: MuniOptimizationParams) => Promise<void>;
  clearMuniRecommendation: () => void;

  // Tax Alpha
  taxAlpha: TaxAlphaResult | null;
  loadingAlpha: boolean;
  alphaError: string | null;
  calculateTaxAlphaAction: (params: TaxAlphaParams) => Promise<void>;
  clearTaxAlpha: () => void;

  // State Tax Rates
  stateTaxRates: StateTaxRates | null;
  loadingRates: boolean;
  ratesError: string | null;
  fetchStateTaxRates: () => Promise<void>;
}

export interface TLHReportParams {
  holdings: any[];
  opportunities: any[];
  executed_harvests: any[];
  tax_year: number;
}

export interface TaxExportParams {
  transactions: any[];
  tax_year: number;
  format: 'csv' | 'json' | 'turbotax' | 'taxact' | 'hrblock';
}

export interface MuniOptimizationParams {
  state: string;
  federal_tax_rate: number;
  annual_income: number;
  in_state_yield: number;
  out_of_state_yield: number;
  taxable_yield: number;
}

export interface TaxAlphaParams {
  portfolio_value: number;
  asset_location_benefit: number;
  tlh_benefit: number;
  withdrawal_benefit: number;
  muni_benefit: number;
}

// ==================== Hook ====================

export function useTaxManagement(): UseTaxManagementResult {
  // TLH Reporting State
  const [tlhReport, setTLHReport] = useState<TLHReport | null>(null);
  const [loadingTLH, setLoadingTLH] = useState(false);
  const [tlhError, setTLHError] = useState<string | null>(null);

  // Tax Export State
  const [taxExport, setTaxExport] = useState<TaxExportResult | null>(null);
  const [loadingExport, setLoadingExport] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Municipal Bonds State
  const [muniRecommendation, setMuniRecommendation] = useState<MunicipalBondRecommendation | null>(null);
  const [loadingMuni, setLoadingMuni] = useState(false);
  const [muniError, setMuniError] = useState<string | null>(null);

  // Tax Alpha State
  const [taxAlpha, setTaxAlpha] = useState<TaxAlphaResult | null>(null);
  const [loadingAlpha, setLoadingAlpha] = useState(false);
  const [alphaError, setAlphaError] = useState<string | null>(null);

  // State Tax Rates State
  const [stateTaxRates, setStateTaxRates] = useState<StateTaxRates | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  // ==================== Actions ====================

  /**
   * Generate TLH Report
   */
  const generateTLHReportAction = async (params: TLHReportParams) => {
    setLoadingTLH(true);
    setTLHError(null);

    try {
      const result = await generateTLHReport(params);
      setTLHReport(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate TLH report';
      setTLHError(errorMessage);
      console.error('TLH report error:', error);
    } finally {
      setLoadingTLH(false);
    }
  };

  /**
   * Export Tax Data
   */
  const exportTaxDataAction = async (params: TaxExportParams) => {
    setLoadingExport(true);
    setExportError(null);

    try {
      const result = await exportTaxData(params);
      setTaxExport(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export tax data';
      setExportError(errorMessage);
      console.error('Tax export error:', error);
    } finally {
      setLoadingExport(false);
    }
  };

  /**
   * Optimize Municipal Bonds
   */
  const optimizeMunicipalBondsAction = async (params: MuniOptimizationParams) => {
    setLoadingMuni(true);
    setMuniError(null);

    try {
      const result = await optimizeMunicipalBonds(params);
      setMuniRecommendation(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to optimize municipal bonds';
      setMuniError(errorMessage);
      console.error('Municipal bond optimization error:', error);
    } finally {
      setLoadingMuni(false);
    }
  };

  /**
   * Calculate Tax Alpha
   */
  const calculateTaxAlphaAction = async (params: TaxAlphaParams) => {
    setLoadingAlpha(true);
    setAlphaError(null);

    try {
      const result = await calculateTaxAlpha(params);
      setTaxAlpha(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to calculate tax alpha';
      setAlphaError(errorMessage);
      console.error('Tax alpha error:', error);
    } finally {
      setLoadingAlpha(false);
    }
  };

  /**
   * Fetch State Tax Rates
   */
  const fetchStateTaxRates = async () => {
    setLoadingRates(true);
    setRatesError(null);

    try {
      const result = await getStateTaxRates();
      setStateTaxRates(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch state tax rates';
      setRatesError(errorMessage);
      console.error('State tax rates error:', error);
    } finally {
      setLoadingRates(false);
    }
  };

  // ==================== Clear Functions ====================

  const clearTLHReport = () => {
    setTLHReport(null);
    setTLHError(null);
  };

  const clearTaxExport = () => {
    setTaxExport(null);
    setExportError(null);
  };

  const clearMuniRecommendation = () => {
    setMuniRecommendation(null);
    setMuniError(null);
  };

  const clearTaxAlpha = () => {
    setTaxAlpha(null);
    setAlphaError(null);
  };

  // ==================== Return ====================

  return {
    // TLH Reporting
    tlhReport,
    loadingTLH,
    tlhError,
    generateTLHReportAction,
    clearTLHReport,

    // Tax Export
    taxExport,
    loadingExport,
    exportError,
    exportTaxDataAction,
    clearTaxExport,

    // Municipal Bonds
    muniRecommendation,
    loadingMuni,
    muniError,
    optimizeMunicipalBondsAction,
    clearMuniRecommendation,

    // Tax Alpha
    taxAlpha,
    loadingAlpha,
    alphaError,
    calculateTaxAlphaAction,
    clearTaxAlpha,

    // State Tax Rates
    stateTaxRates,
    loadingRates,
    ratesError,
    fetchStateTaxRates,
  };
}
