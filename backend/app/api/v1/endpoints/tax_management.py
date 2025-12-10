"""
Tax Management API Endpoints
Comprehensive tax optimization including TLH, export, and muni bonds

REQ-TAX-006: TLH reporting
REQ-TAX-011: Tax software integration
REQ-TAX-014: Municipal bond optimization
"""

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field
from typing import List, Dict, Optional

from app.services.tax_management_service import (
    TaxManagementService,
    TLHReport,
    TaxExportFormat,
    TaxExportResult,
    MunicipalBondRecommendation
)

router = APIRouter(prefix="/tax-management", tags=["Tax Management"])


# ==================== Request/Response Models ====================

class TLHReportRequest(BaseModel):
    """TLH report request"""
    holdings: List[Dict] = Field(description="Current holdings")
    opportunities: List[Dict] = Field(description="Available TLH opportunities")
    executed_harvests: List[Dict] = Field(description="Harvests executed this year")
    tax_year: int = Field(description="Tax year for report")


class TaxExportRequest(BaseModel):
    """Tax export request"""
    transactions: List[Dict] = Field(description="Transactions to export")
    tax_year: int = Field(description="Tax year")
    format: str = Field("csv", description="Export format: csv, json, turbotax, taxact, hrblock")


class MunicipalBondRequest(BaseModel):
    """Municipal bond optimization request"""
    state: str = Field(description="State code (e.g., CA, NY)")
    federal_tax_rate: float = Field(ge=0, le=1, description="Federal marginal tax rate")
    annual_income: float = Field(gt=0, description="Annual income")
    in_state_yield: float = Field(ge=0, description="In-state muni bond yield")
    out_of_state_yield: float = Field(ge=0, description="Out-of-state muni bond yield")
    taxable_yield: float = Field(ge=0, description="Equivalent taxable bond yield")


class TaxAlphaRequest(BaseModel):
    """Tax alpha calculation request"""
    portfolio_value: float = Field(gt=0)
    asset_location_benefit: float = Field(ge=0, default=0)
    tlh_benefit: float = Field(ge=0, default=0)
    withdrawal_benefit: float = Field(ge=0, default=0)
    muni_benefit: float = Field(ge=0, default=0)


# ==================== Endpoints ====================

@router.post(
    "/tlh-report",
    response_model=TLHReport,
    summary="Generate TLH report",
    description="Generate comprehensive tax-loss harvesting report for the year"
)
async def generate_tlh_report(request: TLHReportRequest):
    """
    Generate tax-loss harvesting report.

    **REQ-TAX-006:** TLH reporting

    ## Features
    - Total losses harvested
    - Tax benefit estimation
    - Opportunities analysis
    - Wash sale warnings
    - Annual savings projection

    ## Example Request
    ```json
    {
      "holdings": [
        {"ticker": "VTI", "value": 50000, "cost_basis": 48000},
        {"ticker": "BND", "value": 30000, "cost_basis": 32000}
      ],
      "opportunities": [
        {"ticker": "BND", "loss": 2000, "wash_sale_risk": false}
      ],
      "executed_harvests": [
        {"ticker": "BND", "loss_amount": 2000, "date": "2024-11-01"}
      ],
      "tax_year": 2024
    }
    ```

    ## Example Response
    ```json
    {
      "report_date": "2024-11-02T10:30:00Z",
      "tax_year": 2024,
      "total_losses_harvested": 2000,
      "total_tax_benefit": 580,
      "opportunities_executed": 1,
      "opportunities_available": 0,
      "wash_sale_warnings": 0,
      "estimated_annual_savings": 580,
      "holdings_analyzed": 2
    }
    ```
    """
    try:
        service = TaxManagementService()

        result = service.generate_tlh_report(
            holdings=request.holdings,
            opportunities=request.opportunities,
            executed_harvests=request.executed_harvests,
            tax_year=request.tax_year
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/export",
    response_model=TaxExportResult,
    summary="Export tax data",
    description="Export transactions for tax software integration"
)
async def export_tax_data(request: TaxExportRequest):
    """
    Export tax data for tax software.

    **REQ-TAX-011:** Tax software integration

    ## Supported Formats
    - **csv**: Generic CSV format
    - **json**: JSON format
    - **turbotax**: TurboTax TXF format
    - **taxact**: TaxACT CSV format
    - **hrblock**: H&R Block CSV format

    ## Example Request
    ```json
    {
      "transactions": [
        {
          "date": "2024-03-15",
          "type": "sell",
          "security": "VTI",
          "description": "Vanguard Total Stock Market ETF",
          "quantity": 100,
          "price": 220.50,
          "amount": 22050,
          "cost_basis": 21000,
          "gain_loss": 1050,
          "term": "long"
        }
      ],
      "tax_year": 2024,
      "format": "turbotax"
    }
    ```

    ## Example Response
    ```json
    {
      "format": "turbotax",
      "tax_year": 2024,
      "records_count": 1,
      "file_content": "V042\\nD11/02/2024\\n^\\nTD\\n...",
      "filename": "turbotax_import_2024.txf",
      "export_date": "2024-11-02T10:30:00Z"
    }
    ```

    ## Usage
    1. Call this endpoint with your transactions
    2. Save `file_content` to `filename`
    3. Import file into tax software
    """
    try:
        service = TaxManagementService()

        result = service.export_tax_data(
            transactions=request.transactions,
            tax_year=request.tax_year,
            format=request.format
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/export/{export_id}/download",
    summary="Download tax export file",
    description="Download tax export file as attachment"
)
async def download_tax_export(export_id: str):
    """
    Download tax export file.

    Returns file as downloadable attachment.
    """
    # In production, would retrieve from database/storage
    # For now, return example
    return Response(
        content="Sample tax export file content",
        media_type="text/plain",
        headers={
            "Content-Disposition": f"attachment; filename=tax_export_{export_id}.csv"
        }
    )


@router.post(
    "/municipal-bonds/optimize",
    response_model=MunicipalBondRecommendation,
    summary="Optimize municipal bond allocation",
    description="Optimize muni bond allocation with state-specific tax analysis"
)
async def optimize_municipal_bonds(request: MunicipalBondRequest):
    """
    Optimize municipal bond allocation with state-specific analysis.

    **REQ-TAX-014:** Muni allocation with state-specific optimization

    ## Features
    - State-specific tax rate analysis
    - Tax-equivalent yield calculations
    - In-state vs out-of-state comparison
    - Taxable vs tax-free comparison
    - Optimal allocation recommendation

    ## Example Request
    ```json
    {
      "state": "CA",
      "federal_tax_rate": 0.37,
      "annual_income": 500000,
      "in_state_yield": 0.035,
      "out_of_state_yield": 0.038,
      "taxable_yield": 0.045
    }
    ```

    ## Example Response
    ```json
    {
      "state": "CA",
      "federal_tax_rate": 0.37,
      "state_tax_rate": 0.133,
      "combined_tax_rate": 0.454,
      "in_state_yield": 0.035,
      "out_of_state_yield": 0.038,
      "taxable_yield": 0.045,
      "in_state_tax_equivalent_yield": 0.064,
      "out_of_state_tax_equivalent_yield": 0.060,
      "recommended_allocation": "in_state",
      "estimated_tax_savings": 2900,
      "reasoning": "In-state municipal bonds provide the best after-tax return..."
    }
    ```

    ## State Tax Rates
    - High-tax states: CA (13.3%), NY (10.9%), NJ (10.7%)
    - No-tax states: TX, FL, WA, NV, TN, WY, SD, AK, NH
    - See `/tax-management/state-tax-rates` for full list
    """
    try:
        service = TaxManagementService()

        result = service.optimize_municipal_bonds(
            state=request.state,
            federal_tax_rate=request.federal_tax_rate,
            annual_income=request.annual_income,
            in_state_yield=request.in_state_yield,
            out_of_state_yield=request.out_of_state_yield,
            taxable_yield=request.taxable_yield
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/state-tax-rates",
    summary="Get state tax rates",
    description="Get current state income tax rates"
)
async def get_state_tax_rates():
    """
    Get state income tax rates.

    Returns current state income tax rates for all US states.
    """
    service = TaxManagementService()

    rates = {
        state: {"rate": rate, "formatted": f"{rate * 100:.2f}%"}
        for state, rate in service.STATE_TAX_RATES.items()
    }

    # Add categories
    high_tax = {k: v for k, v in rates.items() if service.STATE_TAX_RATES[k] > 0.09}
    medium_tax = {k: v for k, v in rates.items() if 0.05 < service.STATE_TAX_RATES[k] <= 0.09}
    low_tax = {k: v for k, v in rates.items() if 0 < service.STATE_TAX_RATES[k] <= 0.05}
    no_tax = {k: v for k, v in rates.items() if service.STATE_TAX_RATES[k] == 0}

    return {
        "all_rates": rates,
        "high_tax_states": high_tax,
        "medium_tax_states": medium_tax,
        "low_tax_states": low_tax,
        "no_tax_states": no_tax,
        "last_updated": "2024-2025"
    }


@router.post(
    "/tax-alpha",
    summary="Calculate tax alpha",
    description="Calculate total tax alpha from all optimization strategies"
)
async def calculate_tax_alpha(request: TaxAlphaRequest):
    """
    Calculate total tax alpha.

    Tax alpha is the additional return generated through tax optimization strategies.

    ## Strategies Included
    - Asset location optimization
    - Tax-loss harvesting
    - Withdrawal optimization
    - Municipal bond optimization

    ## Example Request
    ```json
    {
      "portfolio_value": 1000000,
      "asset_location_benefit": 2500,
      "tlh_benefit": 1800,
      "withdrawal_benefit": 1200,
      "muni_benefit": 900
    }
    ```

    ## Example Response
    ```json
    {
      "annual_tax_savings": 6400,
      "tax_alpha_percentage": 0.64,
      "asset_location_benefit": 2500,
      "tlh_benefit": 1800,
      "withdrawal_benefit": 1200,
      "muni_benefit": 900,
      "cumulative_30_year": 192000,
      "strategies_active": 4
    }
    ```
    """
    try:
        service = TaxManagementService()

        result = service.calculate_tax_alpha(
            portfolio_value=request.portfolio_value,
            asset_location_benefit=request.asset_location_benefit,
            tlh_benefit=request.tlh_benefit,
            withdrawal_benefit=request.withdrawal_benefit,
            muni_benefit=request.muni_benefit
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/health",
    summary="Health check",
    description="Check tax management service health"
)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Tax Management API",
        "endpoints": 7,
        "features": [
            "TLH Reporting",
            "Tax Export (5 formats)",
            "Municipal Bond Optimization",
            "Tax Alpha Calculation"
        ]
    }


@router.get(
    "/summary",
    summary="Service summary",
    description="Get service capabilities summary"
)
async def service_summary():
    """Service summary endpoint"""
    return {
        "name": "Tax Management Service",
        "version": "1.0.0",
        "features": [
            "Tax-Loss Harvesting Reporting (REQ-TAX-006)",
            "Tax Software Integration (REQ-TAX-011)",
            "Municipal Bond Optimization (REQ-TAX-014)",
            "Asset Location Optimization (REQ-TAX-001-003)",
            "Withdrawal Strategy Optimization (REQ-TAX-007-009)",
            "Tax Reporting (REQ-TAX-010, 012)"
        ],
        "export_formats": [
            "CSV (generic)",
            "JSON",
            "TurboTax (TXF)",
            "TaxACT",
            "H&R Block"
        ],
        "api_endpoints": 7,
        "state_tax_rates": 50,
        "optimization_strategies": 4
    }
