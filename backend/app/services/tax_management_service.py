"""
Tax Management Service
Comprehensive tax optimization including TLH reporting and tax export

REQ-TAX-006: TLH reporting
REQ-TAX-011: Tax software integration
REQ-TAX-014: Municipal bond optimization
"""

from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime
import csv
import io


class TLHReport(BaseModel):
    """Tax-loss harvesting report"""
    report_date: str
    tax_year: int
    total_losses_harvested: float
    total_tax_benefit: float
    opportunities_executed: int
    opportunities_available: int
    wash_sale_warnings: int
    estimated_annual_savings: float
    holdings_analyzed: int


class TaxExportFormat(str):
    """Supported tax export formats"""
    CSV = "csv"
    JSON = "json"
    TURBOTAX = "turbotax"
    TAXACT = "taxact"
    HRBLOCK = "hrblock"


class TaxExportRecord(BaseModel):
    """Individual tax export record"""
    date: str
    transaction_type: str  # buy, sell, dividend, interest
    security: str
    description: str
    quantity: float
    price: float
    amount: float
    cost_basis: Optional[float] = None
    gain_loss: Optional[float] = None
    term: Optional[str] = None  # short, long


class TaxExportResult(BaseModel):
    """Tax export result"""
    format: str
    tax_year: int
    records_count: int
    file_content: str
    filename: str
    export_date: str


class MunicipalBondRecommendation(BaseModel):
    """Municipal bond recommendation with state-specific optimization"""
    state: str
    federal_tax_rate: float
    state_tax_rate: float
    combined_tax_rate: float

    # Bond recommendations
    in_state_yield: float
    out_of_state_yield: float
    taxable_yield: float

    # Tax-equivalent yields
    in_state_tax_equivalent_yield: float
    out_of_state_tax_equivalent_yield: float

    # Recommendation
    recommended_allocation: str  # in_state, out_of_state, or taxable
    estimated_tax_savings: float
    reasoning: str


class TaxManagementService:
    """Comprehensive tax management service"""

    # State income tax rates (2024-2025)
    STATE_TAX_RATES = {
        "CA": 0.133,  # California (top rate)
        "NY": 0.109,  # New York
        "NJ": 0.107,  # New Jersey
        "OR": 0.099,  # Oregon
        "MN": 0.098,  # Minnesota
        "DC": 0.095,  # District of Columbia
        "CT": 0.070,  # Connecticut
        "MA": 0.050,  # Massachusetts
        "GA": 0.0575, # Georgia
        "IL": 0.0495, # Illinois
        "PA": 0.0307, # Pennsylvania
        "TX": 0.000,  # Texas (no state income tax)
        "FL": 0.000,  # Florida
        "WA": 0.000,  # Washington
        "NV": 0.000,  # Nevada
        "TN": 0.000,  # Tennessee
        "WY": 0.000,  # Wyoming
        "SD": 0.000,  # South Dakota
        "AK": 0.000,  # Alaska
        "NH": 0.000,  # New Hampshire (dividends/interest only)
    }

    def generate_tlh_report(
        self,
        holdings: List[Dict],
        opportunities: List[Dict],
        executed_harvests: List[Dict],
        tax_year: int
    ) -> TLHReport:
        """
        Generate comprehensive TLH report.

        REQ-TAX-006: TLH reporting

        Args:
            holdings: Current holdings
            opportunities: Available TLH opportunities
            executed_harvests: Harvests executed this year
            tax_year: Tax year for report

        Returns:
            Comprehensive TLH report
        """
        # Calculate total losses harvested
        total_losses = sum(h.get("loss_amount", 0) for h in executed_harvests)

        # Estimate tax benefit (assume 24% fed + 5% state average)
        tax_benefit = total_losses * 0.29

        # Count wash sale warnings
        wash_sale_warnings = sum(
            1 for opp in opportunities
            if opp.get("wash_sale_risk", False)
        )

        # Estimate annual savings from executed harvests
        # Assume harvests can be repeated annually
        estimated_annual_savings = tax_benefit

        return TLHReport(
            report_date=datetime.now().isoformat(),
            tax_year=tax_year,
            total_losses_harvested=round(total_losses, 2),
            total_tax_benefit=round(tax_benefit, 2),
            opportunities_executed=len(executed_harvests),
            opportunities_available=len(opportunities),
            wash_sale_warnings=wash_sale_warnings,
            estimated_annual_savings=round(estimated_annual_savings, 2),
            holdings_analyzed=len(holdings)
        )

    def export_tax_data(
        self,
        transactions: List[Dict],
        tax_year: int,
        format: TaxExportFormat = TaxExportFormat.CSV
    ) -> TaxExportResult:
        """
        Export tax data for tax software integration.

        REQ-TAX-011: Tax software integration

        Args:
            transactions: List of transactions to export
            tax_year: Tax year
            format: Export format

        Returns:
            Tax export result with file content
        """
        # Convert transactions to export records
        records = []
        for txn in transactions:
            record = TaxExportRecord(
                date=txn.get("date", ""),
                transaction_type=txn.get("type", ""),
                security=txn.get("security", ""),
                description=txn.get("description", ""),
                quantity=txn.get("quantity", 0),
                price=txn.get("price", 0),
                amount=txn.get("amount", 0),
                cost_basis=txn.get("cost_basis"),
                gain_loss=txn.get("gain_loss"),
                term=txn.get("term")
            )
            records.append(record)

        # Generate export based on format
        if format == TaxExportFormat.CSV:
            file_content = self._export_to_csv(records)
            filename = f"tax_export_{tax_year}.csv"
        elif format == TaxExportFormat.JSON:
            file_content = self._export_to_json(records)
            filename = f"tax_export_{tax_year}.json"
        elif format == TaxExportFormat.TURBOTAX:
            file_content = self._export_to_turbotax(records)
            filename = f"turbotax_import_{tax_year}.txf"
        elif format == TaxExportFormat.TAXACT:
            file_content = self._export_to_taxact(records)
            filename = f"taxact_import_{tax_year}.csv"
        else:
            file_content = self._export_to_csv(records)
            filename = f"tax_export_{tax_year}.csv"

        return TaxExportResult(
            format=format,
            tax_year=tax_year,
            records_count=len(records),
            file_content=file_content,
            filename=filename,
            export_date=datetime.now().isoformat()
        )

    def _export_to_csv(self, records: List[TaxExportRecord]) -> str:
        """Export to generic CSV format"""
        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow([
            "Date", "Type", "Security", "Description", "Quantity",
            "Price", "Amount", "Cost Basis", "Gain/Loss", "Term"
        ])

        # Data
        for record in records:
            writer.writerow([
                record.date,
                record.transaction_type,
                record.security,
                record.description,
                record.quantity,
                record.price,
                record.amount,
                record.cost_basis or "",
                record.gain_loss or "",
                record.term or ""
            ])

        return output.getvalue()

    def _export_to_json(self, records: List[TaxExportRecord]) -> str:
        """Export to JSON format"""
        import json
        return json.dumps([r.dict() for r in records], indent=2)

    def _export_to_turbotax(self, records: List[TaxExportRecord]) -> str:
        """
        Export to TurboTax TXF format.
        Simplified version - production would use full TXF specification.
        """
        lines = []
        lines.append("V042")  # TXF version
        lines.append(f"D{datetime.now().strftime('%m/%d/%Y')}")  # Date
        lines.append("^")

        for record in records:
            if record.transaction_type in ["sell", "sale"]:
                # Form 8949 / Schedule D entry
                lines.append("TD")  # Transaction code
                lines.append(f"N{record.security}")  # Security name
                lines.append(f"D{record.date}")  # Date sold
                lines.append(f"${record.amount:.2f}")  # Proceeds
                if record.cost_basis:
                    lines.append(f"${record.cost_basis:.2f}")  # Cost basis
                if record.gain_loss:
                    lines.append(f"${record.gain_loss:.2f}")  # Gain/loss
                lines.append(f"{record.term or 'long'}")  # Term
                lines.append("^")

        return "\n".join(lines)

    def _export_to_taxact(self, records: List[TaxExportRecord]) -> str:
        """Export to TaxACT CSV format"""
        output = io.StringIO()
        writer = csv.writer(output)

        # TaxACT-specific header
        writer.writerow([
            "Description", "Date Acquired", "Date Sold", "Sales Price",
            "Cost Basis", "Gain/Loss", "Type"
        ])

        # Filter to sales only for TaxACT
        for record in records:
            if record.transaction_type in ["sell", "sale"]:
                writer.writerow([
                    f"{record.security} - {record.description}",
                    "",  # Date acquired (not always available)
                    record.date,
                    record.amount,
                    record.cost_basis or "",
                    record.gain_loss or "",
                    record.term or "long-term"
                ])

        return output.getvalue()

    def optimize_municipal_bonds(
        self,
        state: str,
        federal_tax_rate: float,
        annual_income: float,
        in_state_yield: float,
        out_of_state_yield: float,
        taxable_yield: float
    ) -> MunicipalBondRecommendation:
        """
        Optimize municipal bond allocation with state-specific considerations.

        REQ-TAX-014: Muni allocation with state-specific optimization

        Args:
            state: State code (e.g., "CA", "NY")
            federal_tax_rate: Federal marginal tax rate
            annual_income: Annual income
            in_state_yield: Current yield on in-state muni bonds
            out_of_state_yield: Current yield on out-of-state muni bonds
            taxable_yield: Current yield on equivalent taxable bonds

        Returns:
            Municipal bond recommendation with state-specific analysis
        """
        # Get state tax rate
        state_tax_rate = self.STATE_TAX_RATES.get(state.upper(), 0.05)

        # Calculate combined tax rate
        # Federal + State - (Federal × State) to account for state deduction
        combined_tax_rate = federal_tax_rate + state_tax_rate - (federal_tax_rate * state_tax_rate)

        # Calculate tax-equivalent yields
        # In-state munis are exempt from both federal and state tax
        in_state_tax_equiv = in_state_yield / (1 - combined_tax_rate)

        # Out-of-state munis are exempt from federal but not state
        effective_rate_out_of_state = federal_tax_rate + state_tax_rate - (federal_tax_rate * state_tax_rate)
        out_of_state_tax_equiv = out_of_state_yield / (1 - federal_tax_rate)

        # Determine best option
        options = {
            "in_state": in_state_tax_equiv,
            "out_of_state": out_of_state_tax_equiv,
            "taxable": taxable_yield
        }

        recommended = max(options, key=options.get)

        # Calculate estimated tax savings vs taxable
        if recommended == "in_state":
            tax_on_taxable = taxable_yield * combined_tax_rate
            tax_on_muni = 0
            tax_savings = tax_on_taxable - tax_on_muni
            reasoning = f"In-state municipal bonds provide the best after-tax return. " \
                       f"They are exempt from both federal and {state} state taxes. " \
                       f"Tax-equivalent yield of {in_state_tax_equiv:.2%} exceeds taxable yield of {taxable_yield:.2%}."

        elif recommended == "out_of_state":
            tax_on_taxable = taxable_yield * combined_tax_rate
            tax_on_muni = out_of_state_yield * state_tax_rate
            tax_savings = tax_on_taxable - tax_on_muni
            reasoning = f"Out-of-state municipal bonds provide the best after-tax return. " \
                       f"While subject to {state} state tax, federal tax exemption provides significant benefit. " \
                       f"Tax-equivalent yield of {out_of_state_tax_equiv:.2%} is attractive."

        else:  # taxable
            tax_savings = 0
            reasoning = f"Taxable bonds provide better absolute returns despite taxes. " \
                       f"Municipal bond yields ({in_state_yield:.2%} in-state, {out_of_state_yield:.2%} out-of-state) " \
                       f"do not compensate for tax benefit at current market rates."

        # Annual estimate based on $100,000 investment
        estimated_annual_savings = tax_savings * 100000

        return MunicipalBondRecommendation(
            state=state,
            federal_tax_rate=federal_tax_rate,
            state_tax_rate=state_tax_rate,
            combined_tax_rate=combined_tax_rate,
            in_state_yield=in_state_yield,
            out_of_state_yield=out_of_state_yield,
            taxable_yield=taxable_yield,
            in_state_tax_equivalent_yield=in_state_tax_equiv,
            out_of_state_tax_equivalent_yield=out_of_state_tax_equiv,
            recommended_allocation=recommended,
            estimated_tax_savings=round(estimated_annual_savings, 2),
            reasoning=reasoning
        )

    def calculate_tax_alpha(
        self,
        portfolio_value: float,
        asset_location_benefit: float,
        tlh_benefit: float,
        withdrawal_benefit: float,
        muni_benefit: float
    ) -> Dict:
        """
        Calculate total tax alpha from all tax optimization strategies.

        Args:
            portfolio_value: Total portfolio value
            asset_location_benefit: Annual benefit from asset location
            tlh_benefit: Annual benefit from tax-loss harvesting
            withdrawal_benefit: Annual benefit from withdrawal optimization
            muni_benefit: Annual benefit from muni bond optimization

        Returns:
            Tax alpha summary
        """
        total_benefit = (
            asset_location_benefit +
            tlh_benefit +
            withdrawal_benefit +
            muni_benefit
        )

        # Calculate as percentage of portfolio
        tax_alpha_pct = (total_benefit / portfolio_value) if portfolio_value > 0 else 0

        # 30-year projection
        years = 30
        cumulative_benefit = total_benefit * years  # Simplified

        return {
            "annual_tax_savings": round(total_benefit, 2),
            "tax_alpha_percentage": round(tax_alpha_pct * 100, 2),
            "asset_location_benefit": round(asset_location_benefit, 2),
            "tlh_benefit": round(tlh_benefit, 2),
            "withdrawal_benefit": round(withdrawal_benefit, 2),
            "muni_benefit": round(muni_benefit, 2),
            "cumulative_30_year": round(cumulative_benefit, 2),
            "strategies_active": sum([
                asset_location_benefit > 0,
                tlh_benefit > 0,
                withdrawal_benefit > 0,
                muni_benefit > 0
            ])
        }
