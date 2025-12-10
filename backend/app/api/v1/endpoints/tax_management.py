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
from app.services.roth_conversion_service import (
    RothConversionService,
    BackdoorRothAnalysis,
    RothConversionEligibility,
    ConversionTaxImpact,
    RothConversionRecommendation
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


class RothConversionRequest(BaseModel):
    """Backdoor Roth conversion analysis request"""
    age: int = Field(ge=18, le=100, description="Current age")
    income: float = Field(gt=0, description="Modified Adjusted Gross Income (MAGI)")
    filing_status: str = Field(description="Tax filing status: single, married_joint, married_separate")
    traditional_ira_balance: float = Field(ge=0, description="Traditional IRA balance")
    traditional_ira_basis: float = Field(ge=0, description="Non-deductible contributions (basis)")
    roth_ira_balance: float = Field(ge=0, description="Current Roth IRA balance")
    retirement_age: int = Field(ge=50, le=80, description="Expected retirement age")
    current_marginal_rate: float = Field(ge=0, le=1, description="Current marginal tax rate")
    expected_retirement_rate: float = Field(ge=0, le=1, description="Expected retirement tax rate")
    state_tax_rate: float = Field(ge=0, le=0.15, default=0.05, description="State tax rate")
    current_year_contributions: float = Field(ge=0, default=0, description="IRA contributions this year")
    proposed_conversion_amount: Optional[float] = Field(None, description="Proposed conversion amount")


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


@router.post(
    "/roth-conversion/analyze",
    response_model=BackdoorRothAnalysis,
    summary="Analyze Roth conversion opportunity",
    description="Comprehensive backdoor Roth conversion analysis with eligibility, tax impact, and recommendations"
)
async def analyze_roth_conversion(request: RothConversionRequest):
    """
    Analyze Roth conversion opportunity (including Backdoor Roth).

    **REQ-TAX-007:** Roth conversion opportunity identification
    **Phase 3 Feature:** Backdoor Roth conversion automation

    ## Features
    - Eligibility check (income limits, pro-rata rule)
    - Tax impact calculation (federal + state)
    - Strategic recommendation with timing
    - Break-even analysis
    - Lifetime benefit estimation
    - Action steps and considerations

    ## Strategies Analyzed
    - **Traditional Conversion:** Traditional IRA → Roth IRA
    - **Backdoor Roth:** Non-deductible IRA → Roth IRA (high income)
    - **Mega Backdoor:** After-tax 401(k) → Roth (employer plan)
    - **Partial Conversion:** Convert portion to manage tax brackets

    ## Example Request
    ```json
    {
      "age": 35,
      "income": 175000,
      "filing_status": "married_joint",
      "traditional_ira_balance": 50000,
      "traditional_ira_basis": 7000,
      "roth_ira_balance": 25000,
      "retirement_age": 65,
      "current_marginal_rate": 0.24,
      "expected_retirement_rate": 0.22,
      "state_tax_rate": 0.05,
      "current_year_contributions": 0,
      "proposed_conversion_amount": null
    }
    ```

    ## Example Response
    ```json
    {
      "eligibility": {
        "is_eligible": true,
        "strategy": "backdoor",
        "max_conversion_amount": 7000,
        "income_limit_status": "within_limit",
        "pro_rata_rule_applies": true,
        "pro_rata_taxable_percentage": 86.0
      },
      "tax_impact": {
        "conversion_amount": 7000,
        "ordinary_income_tax": 1440,
        "state_tax": 350,
        "total_tax_due": 1790,
        "effective_tax_rate": 0.256
      },
      "recommendation": {
        "recommended": true,
        "strategy": "backdoor",
        "timing": "immediate",
        "recommended_amount": 7000,
        "estimated_tax": 1790,
        "break_even_years": 3.2,
        "lifetime_benefit": 18500
      }
    }
    ```

    ## Key Concepts

    ### Backdoor Roth
    Allows high-income earners to contribute to Roth IRA indirectly:
    1. Contribute to traditional IRA (non-deductible)
    2. Immediately convert to Roth IRA
    3. Pay taxes only on earnings between contribution and conversion

    ### Pro-Rata Rule
    If you have existing pre-tax IRA balances, conversions are taxed proportionally:
    - Total IRA: $100,000 (pre-tax: $93,000, basis: $7,000)
    - Convert: $7,000
    - Taxable: $7,000 × (93,000/100,000) = $6,510 (93%)

    ### Five-Year Rule
    Converted amounts become penalty-free:
    - After 5 years from January 1 of conversion year
    - AND age 59½ or qualified exception
    """
    try:
        service = RothConversionService()

        result = service.analyze_backdoor_roth(
            age=request.age,
            income=request.income,
            filing_status=request.filing_status,
            traditional_ira_balance=request.traditional_ira_balance,
            traditional_ira_basis=request.traditional_ira_basis,
            roth_ira_balance=request.roth_ira_balance,
            retirement_age=request.retirement_age,
            current_marginal_rate=request.current_marginal_rate,
            expected_retirement_rate=request.expected_retirement_rate,
            state_tax_rate=request.state_tax_rate,
            current_year_contributions=request.current_year_contributions,
            proposed_conversion_amount=request.proposed_conversion_amount,
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class TaxProjectionRequest(BaseModel):
    """Tax projection request"""
    income: float = Field(gt=0, description="Ordinary income (wages, interest, etc.)")
    capital_gains: float = Field(ge=0, default=0, description="Long-term capital gains")
    qualified_dividends: float = Field(ge=0, default=0, description="Qualified dividends")
    ordinary_dividends: float = Field(ge=0, default=0, description="Ordinary dividends")
    state: str = Field(description="State code (e.g., CA, NY)")
    filing_status: str = Field(description="single, married_joint, married_separate, head_of_household")
    deductions: float = Field(ge=0, default=0, description="Itemized deductions (0 for standard)")
    years: int = Field(ge=1, le=30, default=1, description="Number of years to project")


@router.post(
    "/tax-projection",
    summary="Calculate tax projection",
    description="Multi-year tax liability projection with federal and state taxes"
)
async def calculate_tax_projection(request: TaxProjectionRequest):
    """
    Calculate tax projection for current and future years.

    **REQ-TAX-010:** Estimate user tax liability
    **REQ-TAX-012:** Multi-year tax projections

    ## Features
    - Federal income tax calculation
    - State income tax calculation
    - Net Investment Income Tax (NIIT) 3.8%
    - Multi-year projections with inflation adjustment
    - Effective and marginal tax rates
    - Capital gains and qualified dividend treatment

    ## Example Request
    ```json
    {
      "income": 150000,
      "capital_gains": 25000,
      "qualified_dividends": 5000,
      "ordinary_dividends": 2000,
      "state": "CA",
      "filing_status": "married_joint",
      "deductions": 0,
      "years": 5
    }
    ```

    ## Example Response
    ```json
    {
      "projections": [
        {
          "year": 2025,
          "agi": 182000,
          "taxable_income": 152800,
          "federal_tax": 24500,
          "niit": 0,
          "state_tax": 20322,
          "total_tax": 44822,
          "effective_rate": 0.2463,
          "marginal_rate": 0.24
        }
      ],
      "filing_status": "married_joint",
      "state": "CA",
      "years": 5
    }
    ```

    ## Tax Brackets (2024)
    - Federal: 10%, 12%, 22%, 24%, 32%, 35%, 37%
    - Capital Gains: 0%, 15%, 20%
    - NIIT: 3.8% on investment income above threshold
    - State: Varies by state (0% to 13.3%)
    """
    try:
        service = TaxManagementService()

        result = service.calculate_tax_projection(
            income=request.income,
            capital_gains=request.capital_gains,
            qualified_dividends=request.qualified_dividends,
            ordinary_dividends=request.ordinary_dividends,
            state=request.state,
            filing_status=request.filing_status,
            deductions=request.deductions,
            years=request.years
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
            "Tax Reporting & Projections (REQ-TAX-010, 012)",
            "Backdoor Roth Conversion Analysis (REQ-TAX-007, Phase 3)"
        ],
        "export_formats": [
            "CSV (generic)",
            "JSON",
            "TurboTax (TXF)",
            "TaxACT",
            "H&R Block"
        ],
        "api_endpoints": 9,
        "state_tax_rates": 51,
        "optimization_strategies": 5
    }
