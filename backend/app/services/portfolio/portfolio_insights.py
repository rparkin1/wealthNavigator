"""
Portfolio Insights and Alerts Service
Provides ongoing portfolio monitoring, insights, and proactive alerts

REQ-PORT-012: Ongoing insights and proactive alerts
"""

from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
from enum import Enum

from app.services.portfolio.asset_class_library import ASSET_CLASS_LIBRARY


class AlertSeverity(str, Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertType(str, Enum):
    """Types of portfolio alerts"""
    REBALANCING_NEEDED = "rebalancing_needed"
    DRIFT_THRESHOLD = "drift_threshold"
    CONCENTRATION_RISK = "concentration_risk"
    UNDERPERFORMANCE = "underperformance"
    TAX_LOSS_OPPORTUNITY = "tax_loss_opportunity"
    HIGH_FEES = "high_fees"
    ESG_VIOLATION = "esg_violation"
    GOAL_OFF_TRACK = "goal_off_track"
    MARKET_VOLATILITY = "market_volatility"


class PortfolioAlert(BaseModel):
    """Portfolio alert"""
    id: str
    type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    recommendation: str
    created_at: datetime
    acknowledged: bool = False
    data: Dict = {}


class PortfolioInsight(BaseModel):
    """Portfolio insight"""
    category: str  # performance, risk, tax, diversification, esg
    title: str
    description: str
    impact: str  # positive, negative, neutral
    confidence: float  # 0.0-1.0
    data: Dict = {}


class PerformanceMetrics(BaseModel):
    """Performance metrics"""
    total_return_1m: Optional[float] = None
    total_return_3m: Optional[float] = None
    total_return_1y: Optional[float] = None
    total_return_ytd: Optional[float] = None
    volatility_1y: Optional[float] = None
    sharpe_ratio_1y: Optional[float] = None
    max_drawdown_1y: Optional[float] = None
    vs_benchmark_1y: Optional[float] = None  # Alpha


class PortfolioInsightsService:
    """Portfolio insights and alerts service"""

    def __init__(self):
        self.risk_free_rate = 0.04

    def generate_insights(
        self,
        portfolio_allocation: Dict[str, float],  # {asset_code: weight}
        performance_metrics: Optional[PerformanceMetrics] = None,
        goals: Optional[List[Dict]] = None
    ) -> List[PortfolioInsight]:
        """
        Generate portfolio insights.

        REQ-PORT-012: Ongoing insights

        Args:
            portfolio_allocation: Current portfolio allocation
            performance_metrics: Historical performance data
            goals: User's financial goals

        Returns:
            List of insights
        """
        insights = []

        # Diversification insights
        insights.extend(self._analyze_diversification(portfolio_allocation))

        # Risk insights
        insights.extend(self._analyze_risk(portfolio_allocation, performance_metrics))

        # Performance insights
        if performance_metrics:
            insights.extend(self._analyze_performance(performance_metrics))

        # Tax efficiency insights
        insights.extend(self._analyze_tax_efficiency(portfolio_allocation))

        # ESG insights
        insights.extend(self._analyze_esg(portfolio_allocation))

        # Goal alignment insights
        if goals:
            insights.extend(self._analyze_goal_alignment(portfolio_allocation, goals))

        return insights

    def generate_alerts(
        self,
        portfolio_allocation: Dict[str, float],
        target_allocation: Dict[str, float],
        performance_metrics: Optional[PerformanceMetrics] = None,
        holdings_detail: Optional[Dict] = None
    ) -> List[PortfolioAlert]:
        """
        Generate portfolio alerts.

        REQ-PORT-012: Proactive alerts

        Args:
            portfolio_allocation: Current allocation
            target_allocation: Target allocation
            performance_metrics: Performance data
            holdings_detail: Detailed holdings information

        Returns:
            List of alerts
        """
        alerts = []

        # Rebalancing alerts
        alerts.extend(self._check_rebalancing_alerts(
            portfolio_allocation,
            target_allocation
        ))

        # Concentration alerts
        alerts.extend(self._check_concentration_alerts(portfolio_allocation))

        # Performance alerts
        if performance_metrics:
            alerts.extend(self._check_performance_alerts(performance_metrics))

        # Fee alerts
        if holdings_detail:
            alerts.extend(self._check_fee_alerts(holdings_detail))

        # Tax loss harvesting alerts
        if holdings_detail:
            alerts.extend(self._check_tax_loss_alerts(holdings_detail))

        return alerts

    def _analyze_diversification(
        self,
        allocation: Dict[str, float]
    ) -> List[PortfolioInsight]:
        """Analyze portfolio diversification."""
        insights = []

        # Calculate Herfindahl-Hirschman Index
        hhi = sum(w ** 2 for w in allocation.values())
        n = len(allocation)
        max_hhi = 1.0
        min_hhi = 1.0 / n if n > 0 else 1.0

        diversification_score = 1.0 - (hhi - min_hhi) / (max_hhi - min_hhi) if max_hhi != min_hhi else 1.0

        if diversification_score >= 0.75:
            insights.append(PortfolioInsight(
                category="diversification",
                title="Well-Diversified Portfolio",
                description=f"Your portfolio is well-diversified across {n} asset classes with a diversification score of {diversification_score:.1%}.",
                impact="positive",
                confidence=0.9,
                data={"diversification_score": diversification_score, "num_assets": n}
            ))
        elif diversification_score < 0.50:
            # Find concentrated positions
            concentrated = {k: v for k, v in allocation.items() if v > 0.25}

            insights.append(PortfolioInsight(
                category="diversification",
                title="Concentration Risk Detected",
                description=f"Your portfolio has low diversification (score: {diversification_score:.1%}). "
                           f"{len(concentrated)} position(s) exceed 25% allocation.",
                impact="negative",
                confidence=0.85,
                data={"diversification_score": diversification_score, "concentrated_positions": concentrated}
            ))

        # Asset class coverage
        categories = set()
        for asset_code in allocation.keys():
            asset = ASSET_CLASS_LIBRARY.get(asset_code)
            if asset:
                categories.add(asset.category.value)

        if len(categories) >= 4:
            insights.append(PortfolioInsight(
                category="diversification",
                title="Good Asset Class Coverage",
                description=f"Portfolio spans {len(categories)} asset class categories: {', '.join(categories)}",
                impact="positive",
                confidence=0.8,
                data={"categories": list(categories)}
            ))

        return insights

    def _analyze_risk(
        self,
        allocation: Dict[str, float],
        performance: Optional[PerformanceMetrics]
    ) -> List[PortfolioInsight]:
        """Analyze portfolio risk."""
        insights = []

        # Calculate weighted volatility
        weighted_vol = 0.0
        for asset_code, weight in allocation.items():
            asset = ASSET_CLASS_LIBRARY.get(asset_code)
            if asset:
                weighted_vol += weight * asset.volatility

        if weighted_vol > 0.20:
            insights.append(PortfolioInsight(
                category="risk",
                title="High Portfolio Volatility",
                description=f"Expected volatility is {weighted_vol:.1%}, which is above average. "
                           f"Consider adding lower-volatility assets like bonds or cash.",
                impact="negative",
                confidence=0.75,
                data={"expected_volatility": weighted_vol}
            ))
        elif weighted_vol < 0.08:
            insights.append(PortfolioInsight(
                category="risk",
                title="Conservative Risk Profile",
                description=f"Expected volatility is {weighted_vol:.1%}, indicating a conservative portfolio. "
                           f"Returns may be limited.",
                impact="neutral",
                confidence=0.8,
                data={"expected_volatility": weighted_vol}
            ))

        # Sharpe ratio analysis
        if performance and performance.sharpe_ratio_1y:
            if performance.sharpe_ratio_1y > 1.0:
                insights.append(PortfolioInsight(
                    category="risk",
                    title="Excellent Risk-Adjusted Returns",
                    description=f"Sharpe ratio of {performance.sharpe_ratio_1y:.2f} indicates strong risk-adjusted performance.",
                    impact="positive",
                    confidence=0.9,
                    data={"sharpe_ratio": performance.sharpe_ratio_1y}
                ))
            elif performance.sharpe_ratio_1y < 0.5:
                insights.append(PortfolioInsight(
                    category="risk",
                    title="Poor Risk-Adjusted Returns",
                    description=f"Sharpe ratio of {performance.sharpe_ratio_1y:.2f} suggests risk is not being adequately compensated.",
                    impact="negative",
                    confidence=0.8,
                    data={"sharpe_ratio": performance.sharpe_ratio_1y}
                ))

        return insights

    def _analyze_performance(
        self,
        performance: PerformanceMetrics
    ) -> List[PortfolioInsight]:
        """Analyze portfolio performance."""
        insights = []

        # 1-year return analysis
        if performance.total_return_1y is not None:
            if performance.total_return_1y > 0.15:
                insights.append(PortfolioInsight(
                    category="performance",
                    title="Strong 1-Year Performance",
                    description=f"Portfolio returned {performance.total_return_1y:.1%} over the past year, outperforming typical returns.",
                    impact="positive",
                    confidence=0.85,
                    data={"return_1y": performance.total_return_1y}
                ))
            elif performance.total_return_1y < 0:
                insights.append(PortfolioInsight(
                    category="performance",
                    title="Negative 1-Year Returns",
                    description=f"Portfolio declined {abs(performance.total_return_1y):.1%} over the past year. "
                               f"Consider reviewing asset allocation.",
                    impact="negative",
                    confidence=0.8,
                    data={"return_1y": performance.total_return_1y}
                ))

        # Benchmark comparison
        if performance.vs_benchmark_1y is not None:
            if performance.vs_benchmark_1y > 0.02:
                insights.append(PortfolioInsight(
                    category="performance",
                    title="Outperforming Benchmark",
                    description=f"Portfolio is beating its benchmark by {performance.vs_benchmark_1y:.1%} annually.",
                    impact="positive",
                    confidence=0.9,
                    data={"alpha": performance.vs_benchmark_1y}
                ))
            elif performance.vs_benchmark_1y < -0.02:
                insights.append(PortfolioInsight(
                    category="performance",
                    title="Underperforming Benchmark",
                    description=f"Portfolio is trailing its benchmark by {abs(performance.vs_benchmark_1y):.1%}. "
                               f"Review fees and asset selection.",
                    impact="negative",
                    confidence=0.85,
                    data={"alpha": performance.vs_benchmark_1y}
                ))

        # Max drawdown
        if performance.max_drawdown_1y and performance.max_drawdown_1y < -0.20:
            insights.append(PortfolioInsight(
                category="risk",
                title="Significant Drawdown Experienced",
                description=f"Portfolio experienced a {abs(performance.max_drawdown_1y):.1%} drawdown. "
                           f"Consider adding downside protection.",
                impact="negative",
                confidence=0.75,
                data={"max_drawdown": performance.max_drawdown_1y}
            ))

        return insights

    def _analyze_tax_efficiency(
        self,
        allocation: Dict[str, float]
    ) -> List[PortfolioInsight]:
        """Analyze tax efficiency."""
        insights = []

        # Calculate weighted tax efficiency
        weighted_tax_eff = 0.0
        for asset_code, weight in allocation.items():
            asset = ASSET_CLASS_LIBRARY.get(asset_code)
            if asset:
                weighted_tax_eff += weight * asset.tax_efficiency

        if weighted_tax_eff < 0.65:
            insights.append(PortfolioInsight(
                category="tax",
                title="Low Tax Efficiency",
                description=f"Portfolio tax efficiency is {weighted_tax_eff:.1%}. "
                           f"Consider tax-loss harvesting and municipal bonds.",
                impact="negative",
                confidence=0.7,
                data={"tax_efficiency": weighted_tax_eff}
            ))
        elif weighted_tax_eff > 0.85:
            insights.append(PortfolioInsight(
                category="tax",
                title="High Tax Efficiency",
                description=f"Portfolio is tax-efficient at {weighted_tax_eff:.1%}. Good use of tax-advantaged assets.",
                impact="positive",
                confidence=0.75,
                data={"tax_efficiency": weighted_tax_eff}
            ))

        return insights

    def _analyze_esg(
        self,
        allocation: Dict[str, float]
    ) -> List[PortfolioInsight]:
        """Analyze ESG characteristics."""
        insights = []

        # Check for ESG-focused assets
        esg_assets = ["US_ESG", "INTL_ESG", "GREEN_BOND"]
        esg_weight = sum(allocation.get(asset, 0) for asset in esg_assets)

        if esg_weight > 0.25:
            insights.append(PortfolioInsight(
                category="esg",
                title="Strong ESG Focus",
                description=f"{esg_weight:.1%} of portfolio is in ESG-focused assets.",
                impact="positive",
                confidence=0.8,
                data={"esg_allocation": esg_weight}
            ))

        # Check for excluded sectors
        if "ENERGY" in allocation:
            insights.append(PortfolioInsight(
                category="esg",
                title="Fossil Fuel Exposure",
                description=f"Portfolio has {allocation['ENERGY']:.1%} exposure to energy sector. "
                           f"Consider ESG alternatives if this conflicts with values.",
                impact="neutral",
                confidence=0.7,
                data={"energy_allocation": allocation["ENERGY"]}
            ))

        return insights

    def _analyze_goal_alignment(
        self,
        allocation: Dict[str, float],
        goals: List[Dict]
    ) -> List[PortfolioInsight]:
        """Analyze alignment with financial goals."""
        insights = []

        # Calculate weighted expected return
        weighted_return = 0.0
        for asset_code, weight in allocation.items():
            asset = ASSET_CLASS_LIBRARY.get(asset_code)
            if asset:
                weighted_return += weight * asset.expected_return

        # Check against goal requirements
        for goal in goals:
            required_return = goal.get("required_return", 0.05)
            years_to_goal = goal.get("years_to_goal", 10)

            if weighted_return < required_return - 0.02:
                insights.append(PortfolioInsight(
                    category="goals",
                    title=f"Goal '{goal['name']}' May Be Underfunded",
                    description=f"Portfolio return ({weighted_return:.1%}) is below required return ({required_return:.1%}). "
                               f"Consider increasing contributions or risk level.",
                    impact="negative",
                    confidence=0.75,
                    data={"goal_name": goal["name"], "shortfall": required_return - weighted_return}
                ))
            elif years_to_goal < 3 and weighted_return > 0.07:
                insights.append(PortfolioInsight(
                    category="goals",
                    title=f"Goal '{goal['name']}' Has High Risk Near Target Date",
                    description=f"Goal is only {years_to_goal:.1f} years away but portfolio has {weighted_return:.1%} expected return. "
                               f"Consider de-risking.",
                    impact="negative",
                    confidence=0.8,
                    data={"goal_name": goal["name"], "years_to_goal": years_to_goal}
                ))

        return insights

    def _check_rebalancing_alerts(
        self,
        current: Dict[str, float],
        target: Dict[str, float],
        threshold: float = 0.05
    ) -> List[PortfolioAlert]:
        """Check for rebalancing alerts."""
        alerts = []

        max_drift = 0.0
        drifted_assets = []

        for asset_code in set(current.keys()) | set(target.keys()):
            current_weight = current.get(asset_code, 0)
            target_weight = target.get(asset_code, 0)
            drift = abs(current_weight - target_weight)

            if drift > threshold:
                drifted_assets.append((asset_code, drift))
                max_drift = max(max_drift, drift)

        if drifted_assets:
            severity = AlertSeverity.CRITICAL if max_drift > 0.10 else AlertSeverity.WARNING

            alerts.append(PortfolioAlert(
                id=f"rebal_{datetime.now().strftime('%Y%m%d')}",
                type=AlertType.DRIFT_THRESHOLD,
                severity=severity,
                title="Portfolio Rebalancing Needed",
                message=f"{len(drifted_assets)} asset(s) have drifted more than {threshold:.0%} from target allocation.",
                recommendation="Review and rebalance portfolio to restore target allocation. Use tax-loss harvesting if rebalancing in taxable accounts.",
                created_at=datetime.now(),
                data={"max_drift": max_drift, "drifted_assets": drifted_assets}
            ))

        return alerts

    def _check_concentration_alerts(
        self,
        allocation: Dict[str, float],
        threshold: float = 0.30
    ) -> List[PortfolioAlert]:
        """Check for concentration risk."""
        alerts = []

        concentrated = {k: v for k, v in allocation.items() if v > threshold}

        if concentrated:
            alerts.append(PortfolioAlert(
                id=f"conc_{datetime.now().strftime('%Y%m%d')}",
                type=AlertType.CONCENTRATION_RISK,
                severity=AlertSeverity.WARNING,
                title="Concentration Risk Detected",
                message=f"{len(concentrated)} position(s) exceed {threshold:.0%} of portfolio.",
                recommendation="Consider diversifying to reduce concentration risk. No single position should exceed 30% of portfolio.",
                created_at=datetime.now(),
                data={"concentrated_positions": concentrated}
            ))

        return alerts

    def _check_performance_alerts(
        self,
        performance: PerformanceMetrics
    ) -> List[PortfolioAlert]:
        """Check for performance alerts."""
        alerts = []

        # Underperformance alert
        if performance.vs_benchmark_1y and performance.vs_benchmark_1y < -0.05:
            alerts.append(PortfolioAlert(
                id=f"perf_{datetime.now().strftime('%Y%m%d')}",
                type=AlertType.UNDERPERFORMANCE,
                severity=AlertSeverity.WARNING,
                title="Significant Underperformance",
                message=f"Portfolio is underperforming benchmark by {abs(performance.vs_benchmark_1y):.1%}.",
                recommendation="Review asset allocation, fees, and individual holdings. Consider index funds for better performance.",
                created_at=datetime.now(),
                data={"underperformance": performance.vs_benchmark_1y}
            ))

        return alerts

    def _check_fee_alerts(
        self,
        holdings_detail: Dict
    ) -> List[PortfolioAlert]:
        """Check for high fee alerts."""
        alerts = []

        avg_expense_ratio = holdings_detail.get("average_expense_ratio", 0)

        if avg_expense_ratio > 0.01:  # 1%
            alerts.append(PortfolioAlert(
                id=f"fees_{datetime.now().strftime('%Y%m%d')}",
                type=AlertType.HIGH_FEES,
                severity=AlertSeverity.WARNING,
                title="High Portfolio Fees",
                message=f"Average expense ratio is {avg_expense_ratio:.2%}, which is above recommended 0.50%.",
                recommendation="Consider switching to lower-cost index funds. Over 30 years, a 1% fee difference can reduce returns by 25%.",
                created_at=datetime.now(),
                data={"expense_ratio": avg_expense_ratio}
            ))

        return alerts

    def _check_tax_loss_alerts(
        self,
        holdings_detail: Dict
    ) -> List[PortfolioAlert]:
        """Check for tax-loss harvesting opportunities."""
        alerts = []

        positions_with_losses = holdings_detail.get("positions_with_losses", [])

        if positions_with_losses:
            total_losses = sum(p.get("unrealized_loss", 0) for p in positions_with_losses)

            if total_losses < -1000:  # $1,000+ in losses
                alerts.append(PortfolioAlert(
                    id=f"tlh_{datetime.now().strftime('%Y%m%d')}",
                    type=AlertType.TAX_LOSS_OPPORTUNITY,
                    severity=AlertSeverity.INFO,
                    title="Tax-Loss Harvesting Opportunity",
                    message=f"${abs(total_losses):,.0f} in unrealized losses available for tax-loss harvesting.",
                    recommendation="Consider selling losing positions to offset capital gains. Reinvest in similar (but not substantially identical) securities to maintain exposure.",
                    created_at=datetime.now(),
                    data={"total_losses": total_losses, "num_positions": len(positions_with_losses)}
                ))

        return alerts
