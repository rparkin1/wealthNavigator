"""
Reserve Monitoring Service
Emergency fund and safety reserve monitoring and recommendations

REQ-RISK-012: Reserve monitoring and alerts
"""

from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime


class ReserveStatus(str):
    """Reserve status levels"""
    CRITICAL = "critical"  # < 1 month expenses
    LOW = "low"  # 1-3 months expenses
    ADEQUATE = "adequate"  # 3-6 months expenses
    STRONG = "strong"  # 6-12 months expenses
    EXCELLENT = "excellent"  # > 12 months expenses


class ReserveAlert(BaseModel):
    """Reserve monitoring alert"""
    severity: str  # critical, warning, info
    title: str
    message: str
    action_required: str
    priority: int  # 1 (highest) to 5 (lowest)


class ReserveRecommendation(BaseModel):
    """Reserve building recommendation"""
    action: str
    monthly_target: float
    time_to_goal: int  # months
    rationale: str
    impact: str


class ReserveMonitoringResult(BaseModel):
    """Complete reserve monitoring result"""
    # Current status
    current_reserves: float
    monthly_expenses: float
    months_coverage: float
    reserve_status: str

    # Target recommendations
    minimum_target: float  # 3 months
    recommended_target: float  # 6 months
    optimal_target: float  # 12 months

    # Gap analysis
    shortfall: float
    target_met: bool

    # Alerts and recommendations
    alerts: List[ReserveAlert]
    recommendations: List[ReserveRecommendation]

    # Trend analysis
    trend: str  # improving, stable, declining
    last_updated: str


class ReserveMonitoringService:
    """Service for monitoring emergency fund and safety reserves"""

    def monitor_reserves(
        self,
        current_reserves: float,
        monthly_expenses: float,
        monthly_income: float,
        has_dependents: bool = False,
        income_stability: str = "stable",  # stable, variable, uncertain
        job_security: str = "secure"  # secure, moderate, at_risk
    ) -> ReserveMonitoringResult:
        """
        Monitor emergency fund and safety reserves.

        Args:
            current_reserves: Current emergency fund balance
            monthly_expenses: Average monthly expenses
            monthly_income: Monthly income
            has_dependents: Whether user has dependents
            income_stability: Income stability level
            job_security: Job security assessment

        Returns:
            Complete reserve monitoring result with alerts and recommendations
        """
        # Calculate months of coverage
        months_coverage = current_reserves / monthly_expenses if monthly_expenses > 0 else 0

        # Determine targets based on risk factors
        targets = self._calculate_targets(
            monthly_expenses,
            has_dependents,
            income_stability,
            job_security
        )

        # Determine reserve status
        status = self._determine_status(months_coverage)

        # Calculate shortfall
        shortfall = max(0, targets["recommended"] - current_reserves)
        target_met = shortfall == 0

        # Generate alerts
        alerts = self._generate_alerts(
            months_coverage,
            shortfall,
            monthly_expenses,
            status,
            income_stability,
            job_security
        )

        # Generate recommendations
        recommendations = self._generate_recommendations(
            shortfall,
            monthly_income,
            monthly_expenses,
            targets,
            status
        )

        # Analyze trend (would need historical data in production)
        trend = "stable"  # Default

        return ReserveMonitoringResult(
            current_reserves=round(current_reserves, 2),
            monthly_expenses=round(monthly_expenses, 2),
            months_coverage=round(months_coverage, 2),
            reserve_status=status,
            minimum_target=round(targets["minimum"], 2),
            recommended_target=round(targets["recommended"], 2),
            optimal_target=round(targets["optimal"], 2),
            shortfall=round(shortfall, 2),
            target_met=target_met,
            alerts=alerts,
            recommendations=recommendations,
            trend=trend,
            last_updated=datetime.utcnow().isoformat()
        )

    def _calculate_targets(
        self,
        monthly_expenses: float,
        has_dependents: bool,
        income_stability: str,
        job_security: str
    ) -> Dict[str, float]:
        """Calculate reserve targets based on risk factors"""
        # Base targets
        minimum_months = 3
        recommended_months = 6
        optimal_months = 12

        # Adjust for dependents
        if has_dependents:
            minimum_months += 1
            recommended_months += 2
            optimal_months += 3

        # Adjust for income stability
        if income_stability == "variable":
            minimum_months += 1
            recommended_months += 2
        elif income_stability == "uncertain":
            minimum_months += 2
            recommended_months += 3
            optimal_months += 3

        # Adjust for job security
        if job_security == "moderate":
            minimum_months += 1
            recommended_months += 1
        elif job_security == "at_risk":
            minimum_months += 2
            recommended_months += 3
            optimal_months += 3

        return {
            "minimum": monthly_expenses * minimum_months,
            "recommended": monthly_expenses * recommended_months,
            "optimal": monthly_expenses * optimal_months
        }

    def _determine_status(self, months_coverage: float) -> str:
        """Determine reserve status from months of coverage"""
        if months_coverage < 1:
            return ReserveStatus.CRITICAL
        elif months_coverage < 3:
            return ReserveStatus.LOW
        elif months_coverage < 6:
            return ReserveStatus.ADEQUATE
        elif months_coverage < 12:
            return ReserveStatus.STRONG
        else:
            return ReserveStatus.EXCELLENT

    def _generate_alerts(
        self,
        months_coverage: float,
        shortfall: float,
        monthly_expenses: float,
        status: str,
        income_stability: str,
        job_security: str
    ) -> List[ReserveAlert]:
        """Generate reserve monitoring alerts"""
        alerts = []

        # Critical alerts (< 1 month)
        if months_coverage < 1:
            alerts.append(ReserveAlert(
                severity="critical",
                title="🚨 Critical Reserve Level",
                message=f"You have less than 1 month of expenses saved ({months_coverage:.1f} months). "
                        "This puts you at high risk in case of emergency.",
                action_required="Immediately prioritize building emergency fund. Reduce discretionary spending.",
                priority=1
            ))

        # Low reserve alerts (1-3 months)
        elif months_coverage < 3:
            alerts.append(ReserveAlert(
                severity="warning",
                title="⚠️ Low Reserve Level",
                message=f"You have {months_coverage:.1f} months of expenses saved. "
                        "Minimum recommended is 3 months.",
                action_required=f"Build reserves by ${shortfall:,.0f} to reach minimum target.",
                priority=2
            ))

        # Below recommended (3-6 months)
        elif months_coverage < 6:
            alerts.append(ReserveAlert(
                severity="info",
                title="💡 Below Recommended Reserve",
                message=f"You have {months_coverage:.1f} months of expenses saved. "
                        "Recommended target is 6 months.",
                action_required=f"Continue building reserves by ${shortfall:,.0f}.",
                priority=3
            ))

        # Income stability warnings
        if income_stability in ["variable", "uncertain"] and months_coverage < 6:
            alerts.append(ReserveAlert(
                severity="warning",
                title="⚠️ Variable Income Risk",
                message="With variable income, 6+ months of reserves is strongly recommended.",
                action_required="Prioritize building larger emergency fund due to income variability.",
                priority=2
            ))

        # Job security warnings
        if job_security == "at_risk" and months_coverage < 9:
            alerts.append(ReserveAlert(
                severity="warning",
                title="⚠️ Job Security Concern",
                message="Given job security concerns, 9+ months of reserves recommended.",
                action_required="Build larger safety net in case of job loss.",
                priority=2
            ))

        # Positive reinforcement
        if status == ReserveStatus.STRONG:
            alerts.append(ReserveAlert(
                severity="info",
                title="✅ Strong Reserve Position",
                message=f"You have {months_coverage:.1f} months of expenses saved. Well done!",
                action_required="Maintain current reserve level and focus on other financial goals.",
                priority=5
            ))
        elif status == ReserveStatus.EXCELLENT:
            alerts.append(ReserveAlert(
                severity="info",
                title="🎉 Excellent Reserve Position",
                message=f"You have {months_coverage:.1f} months of expenses saved. Excellent financial security!",
                action_required="Consider allocating excess reserves to investment goals.",
                priority=5
            ))

        return alerts

    def _generate_recommendations(
        self,
        shortfall: float,
        monthly_income: float,
        monthly_expenses: float,
        targets: Dict[str, float],
        status: str
    ) -> List[ReserveRecommendation]:
        """Generate reserve building recommendations"""
        recommendations = []

        if shortfall <= 0:
            # Reserves adequate - maintenance recommendation
            recommendations.append(ReserveRecommendation(
                action="Maintain Current Reserves",
                monthly_target=0,
                time_to_goal=0,
                rationale="Your emergency fund meets or exceeds recommended levels.",
                impact="Continue regular reviews to ensure reserves keep pace with expense changes."
            ))

            # If excellent reserves, suggest investment
            if status == ReserveStatus.EXCELLENT:
                excess = abs(shortfall)
                recommendations.append(ReserveRecommendation(
                    action="Consider Investing Excess Reserves",
                    monthly_target=0,
                    time_to_goal=0,
                    rationale=f"You have ${excess:,.0f} above optimal reserve level.",
                    impact="Invest excess in retirement or other long-term goals for higher returns."
                ))
        else:
            # Calculate savings recommendations at different rates
            disposable_income = monthly_income - monthly_expenses

            # Aggressive: 20% of income
            aggressive_rate = monthly_income * 0.20
            aggressive_months = int(shortfall / aggressive_rate) if aggressive_rate > 0 else 999

            if aggressive_months <= 24:  # Achievable in 2 years
                recommendations.append(ReserveRecommendation(
                    action="Aggressive Reserve Building",
                    monthly_target=round(aggressive_rate, 2),
                    time_to_goal=aggressive_months,
                    rationale=f"Save 20% of income (${aggressive_rate:,.0f}/month) to reach target in {aggressive_months} months.",
                    impact="Fastest path to financial security. May require significant lifestyle adjustments."
                ))

            # Moderate: 15% of income
            moderate_rate = monthly_income * 0.15
            moderate_months = int(shortfall / moderate_rate) if moderate_rate > 0 else 999

            if moderate_months <= 36:  # Achievable in 3 years
                recommendations.append(ReserveRecommendation(
                    action="Moderate Reserve Building",
                    monthly_target=round(moderate_rate, 2),
                    time_to_goal=moderate_months,
                    rationale=f"Save 15% of income (${moderate_rate:,.0f}/month) to reach target in {moderate_months} months.",
                    impact="Balanced approach with reasonable timeline and lifestyle impact."
                ))

            # Conservative: 10% of income
            conservative_rate = monthly_income * 0.10
            conservative_months = int(shortfall / conservative_rate) if conservative_rate > 0 else 999

            recommendations.append(ReserveRecommendation(
                action="Conservative Reserve Building",
                monthly_target=round(conservative_rate, 2),
                time_to_goal=conservative_months,
                rationale=f"Save 10% of income (${conservative_rate:,.0f}/month) to reach target in {conservative_months} months.",
                impact="Gradual approach with minimal lifestyle disruption."
            ))

            # Expense reduction strategy
            if disposable_income < conservative_rate:
                potential_cuts = monthly_expenses * 0.10  # 10% expense reduction
                recommendations.append(ReserveRecommendation(
                    action="Reduce Discretionary Spending",
                    monthly_target=round(potential_cuts, 2),
                    time_to_goal=int(shortfall / potential_cuts) if potential_cuts > 0 else 999,
                    rationale=f"Cut discretionary expenses by 10% (${potential_cuts:,.0f}/month) to free up savings.",
                    impact="Focus on non-essential spending: dining out, entertainment, subscriptions."
                ))

        return recommendations

    def calculate_reserve_adequacy_score(
        self,
        months_coverage: float,
        target_months: float = 6
    ) -> Dict:
        """
        Calculate reserve adequacy score (0-100).

        Args:
            months_coverage: Current months of expense coverage
            target_months: Target months (default 6)

        Returns:
            Score and rating
        """
        # Score out of 100
        score = min(100, (months_coverage / target_months) * 100)

        # Rating
        if score >= 100:
            rating = "Excellent"
        elif score >= 75:
            rating = "Good"
        elif score >= 50:
            rating = "Fair"
        elif score >= 25:
            rating = "Poor"
        else:
            rating = "Critical"

        return {
            "score": round(score, 1),
            "rating": rating,
            "months_coverage": round(months_coverage, 2),
            "target_months": target_months
        }

    def simulate_reserve_growth(
        self,
        current_reserves: float,
        monthly_contribution: float,
        target_amount: float,
        months_to_simulate: int = 36
    ) -> Dict:
        """
        Simulate reserve fund growth over time.

        Args:
            current_reserves: Starting balance
            monthly_contribution: Monthly savings
            target_amount: Target reserve amount
            months_to_simulate: Number of months to simulate

        Returns:
            Simulation results with monthly balances
        """
        balances = [current_reserves]
        months = [0]
        target_reached_month = None

        for month in range(1, months_to_simulate + 1):
            new_balance = balances[-1] + monthly_contribution
            balances.append(new_balance)
            months.append(month)

            if target_reached_month is None and new_balance >= target_amount:
                target_reached_month = month

        final_balance = balances[-1]

        return {
            "initial_balance": current_reserves,
            "final_balance": round(final_balance, 2),
            "monthly_contribution": monthly_contribution,
            "target_amount": target_amount,
            "target_reached_month": target_reached_month,
            "months_simulated": months_to_simulate,
            "projection": [
                {"month": m, "balance": round(b, 2)}
                for m, b in zip(months, balances)
            ]
        }
