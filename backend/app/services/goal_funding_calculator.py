"""
Goal Funding Calculator Service

Implements REQ-GOAL-007: Goal funding and allocation calculations
- Present value of future cash flows
- Required monthly/annual savings
- Lump sum investments needed
- Probability of success
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from scipy import optimize


class GoalFundingCalculator:
    """Calculator for goal funding requirements and success probability."""

    @classmethod
    def calculate_funding_requirements(
        cls,
        target_amount: float,
        current_amount: float,
        years_to_goal: float,
        expected_return: float = 0.07,
        inflation_rate: float = 0.03
    ) -> Dict:
        """
        Calculate comprehensive funding requirements for a goal.

        Args:
            target_amount: Goal target amount in today's dollars
            current_amount: Current amount saved toward goal
            years_to_goal: Years until goal target date
            expected_return: Expected annual return on investments
            inflation_rate: Expected annual inflation rate

        Returns:
            Funding requirements including monthly savings, lump sum, etc.

        REQ-GOAL-007: Calculate funding requirements for each goal
        """
        # Adjust target for inflation
        real_return = (1 + expected_return) / (1 + inflation_rate) - 1
        inflation_adjusted_target = target_amount * ((1 + inflation_rate) ** years_to_goal)

        # Future value of current amount
        fv_current = current_amount * ((1 + expected_return) ** years_to_goal)

        # Remaining amount needed
        remaining_need = max(0, inflation_adjusted_target - fv_current)

        # Calculate required monthly savings
        months = years_to_goal * 12
        monthly_return = expected_return / 12

        if months > 0 and monthly_return > 0:
            # PMT = FV * r / [(1 + r)^n - 1]
            required_monthly = remaining_need * monthly_return / (
                ((1 + monthly_return) ** months) - 1
            )
        elif months > 0:
            # No growth case
            required_monthly = remaining_need / months
        else:
            required_monthly = remaining_need

        # Calculate required annual savings
        if years_to_goal > 0 and expected_return > 0:
            required_annual = remaining_need * expected_return / (
                ((1 + expected_return) ** years_to_goal) - 1
            )
        elif years_to_goal > 0:
            required_annual = remaining_need / years_to_goal
        else:
            required_annual = remaining_need

        # Calculate lump sum needed today
        if years_to_goal > 0:
            lump_sum_needed = remaining_need / ((1 + expected_return) ** years_to_goal)
        else:
            lump_sum_needed = remaining_need

        # Calculate present value of future cash flows
        pv_future_contributions = cls._calculate_pv_contributions(
            required_monthly,
            years_to_goal,
            expected_return
        )

        # Total funding requirement
        total_required = current_amount + pv_future_contributions

        # Funding progress percentage
        funding_percentage = (current_amount / total_required * 100) if total_required > 0 else 0

        return {
            "target_amount": target_amount,
            "inflation_adjusted_target": round(inflation_adjusted_target, 2),
            "current_amount": current_amount,
            "future_value_current": round(fv_current, 2),
            "remaining_need": round(remaining_need, 2),
            "required_monthly_savings": round(required_monthly, 2),
            "required_annual_savings": round(required_annual, 2),
            "lump_sum_needed_today": round(lump_sum_needed, 2),
            "present_value_future_contributions": round(pv_future_contributions, 2),
            "total_funding_required": round(total_required, 2),
            "funding_percentage": round(funding_percentage, 2),
            "years_to_goal": years_to_goal,
            "expected_return": expected_return,
            "inflation_rate": inflation_rate,
            "real_return": round(real_return, 4)
        }

    @classmethod
    def calculate_success_probability(
        cls,
        target_amount: float,
        current_amount: float,
        monthly_contribution: float,
        years_to_goal: float,
        expected_return: float = 0.07,
        return_volatility: float = 0.15,
        iterations: int = 5000
    ) -> Dict:
        """
        Calculate probability of successfully achieving goal using Monte Carlo simulation.

        Args:
            target_amount: Goal target amount
            current_amount: Current savings
            monthly_contribution: Monthly contribution
            years_to_goal: Years to goal
            expected_return: Expected annual return
            return_volatility: Annual return standard deviation
            iterations: Number of Monte Carlo iterations

        Returns:
            Success probability and distribution statistics

        REQ-GOAL-007: Probability of success given current resources
        """
        if years_to_goal <= 0:
            # Goal is now - simple comparison
            return {
                "success_probability": 1.0 if current_amount >= target_amount else 0.0,
                "median_outcome": current_amount,
                "percentile_10": current_amount,
                "percentile_25": current_amount,
                "percentile_75": current_amount,
                "percentile_90": current_amount,
                "shortfall_risk": 0.0 if current_amount >= target_amount else 1.0,
                "expected_value": current_amount
            }

        months = int(years_to_goal * 12)
        monthly_return = expected_return / 12
        monthly_volatility = return_volatility / np.sqrt(12)

        # Run Monte Carlo simulation
        final_values = []

        for _ in range(iterations):
            portfolio_value = current_amount

            for month in range(months):
                # Generate random return for this month
                random_return = np.random.normal(monthly_return, monthly_volatility)

                # Update portfolio value
                portfolio_value = portfolio_value * (1 + random_return) + monthly_contribution

            final_values.append(portfolio_value)

        final_values = np.array(final_values)

        # Calculate statistics
        success_count = np.sum(final_values >= target_amount)
        success_probability = success_count / iterations

        return {
            "success_probability": round(success_probability, 4),
            "median_outcome": round(np.median(final_values), 2),
            "percentile_10": round(np.percentile(final_values, 10), 2),
            "percentile_25": round(np.percentile(final_values, 25), 2),
            "percentile_75": round(np.percentile(final_values, 75), 2),
            "percentile_90": round(np.percentile(final_values, 90), 2),
            "expected_value": round(np.mean(final_values), 2),
            "standard_deviation": round(np.std(final_values), 2),
            "shortfall_risk": round(1 - success_probability, 4),
            "median_shortfall": round(
                np.median([target_amount - v for v in final_values if v < target_amount]),
                2
            ) if success_probability < 1.0 else 0.0,
            "target_amount": target_amount,
            "iterations": iterations
        }

    @classmethod
    def calculate_required_savings_for_probability(
        cls,
        target_amount: float,
        current_amount: float,
        years_to_goal: float,
        target_probability: float = 0.90,
        expected_return: float = 0.07,
        return_volatility: float = 0.15
    ) -> Dict:
        """
        Calculate required monthly savings to achieve target success probability.

        Args:
            target_amount: Goal target
            current_amount: Current savings
            years_to_goal: Years to goal
            target_probability: Desired success probability (e.g., 0.90 for 90%)
            expected_return: Expected return
            return_volatility: Return volatility

        Returns:
            Required monthly savings to hit probability target

        REQ-GOAL-007: Required savings to achieve desired probability
        """
        if years_to_goal <= 0:
            shortfall = max(0, target_amount - current_amount)
            return {
                "required_monthly_savings": shortfall,
                "target_probability": target_probability,
                "estimated_success_probability": 1.0 if shortfall == 0 else 0.0,
                "years_to_goal": 0
            }

        # Use binary search to find required monthly contribution
        def success_prob_for_contribution(monthly_contrib):
            result = cls.calculate_success_probability(
                target_amount=target_amount,
                current_amount=current_amount,
                monthly_contribution=monthly_contrib,
                years_to_goal=years_to_goal,
                expected_return=expected_return,
                return_volatility=return_volatility,
                iterations=1000  # Faster for optimization
            )
            return result["success_probability"]

        # Start with simple calculation as initial guess
        months = years_to_goal * 12
        monthly_rate = expected_return / 12
        fv_current = current_amount * ((1 + monthly_rate) ** months)
        remaining = target_amount - fv_current

        if remaining > 0 and monthly_rate > 0:
            initial_guess = remaining * monthly_rate / (((1 + monthly_rate) ** months) - 1)
        else:
            initial_guess = max(0, remaining / months)

        # Binary search for required contribution
        low, high = 0, initial_guess * 3
        tolerance = 10  # $10 tolerance

        while high - low > tolerance:
            mid = (low + high) / 2
            prob = success_prob_for_contribution(mid)

            if prob < target_probability:
                low = mid
            else:
                high = mid

        required_monthly = (low + high) / 2

        # Verify with full simulation
        final_result = cls.calculate_success_probability(
            target_amount=target_amount,
            current_amount=current_amount,
            monthly_contribution=required_monthly,
            years_to_goal=years_to_goal,
            expected_return=expected_return,
            return_volatility=return_volatility,
            iterations=5000
        )

        return {
            "required_monthly_savings": round(required_monthly, 2),
            "required_annual_savings": round(required_monthly * 12, 2),
            "target_probability": target_probability,
            "estimated_success_probability": final_result["success_probability"],
            "median_outcome": final_result["median_outcome"],
            "years_to_goal": years_to_goal,
            "total_contributions": round(required_monthly * months, 2),
            "contribution_percentage": round(
                (required_monthly * months) / target_amount * 100, 2
            )
        }

    @classmethod
    def optimize_contribution_timeline(
        cls,
        target_amount: float,
        current_amount: float,
        years_to_goal: float,
        max_monthly_contribution: float,
        expected_return: float = 0.07
    ) -> Dict:
        """
        Optimize contribution timeline given maximum monthly budget.

        Args:
            target_amount: Goal target
            current_amount: Current savings
            years_to_goal: Initial years to goal
            max_monthly_contribution: Maximum affordable monthly contribution
            expected_return: Expected return

        Returns:
            Optimized timeline and contribution strategy

        REQ-GOAL-007: Optimize given resource constraints
        """
        # Calculate if goal is achievable with max contribution
        months = years_to_goal * 12
        monthly_rate = expected_return / 12

        fv_current = current_amount * ((1 + monthly_rate) ** months)
        fv_contributions = max_monthly_contribution * (
            ((1 + monthly_rate) ** months - 1) / monthly_rate
        ) if monthly_rate > 0 else max_monthly_contribution * months

        projected_value = fv_current + fv_contributions

        if projected_value >= target_amount:
            # Goal achievable - optimize to reduce contributions
            required_monthly = cls.calculate_funding_requirements(
                target_amount=target_amount,
                current_amount=current_amount,
                years_to_goal=years_to_goal,
                expected_return=expected_return
            )["required_monthly_savings"]

            return {
                "status": "achievable",
                "optimal_monthly_contribution": round(min(required_monthly, max_monthly_contribution), 2),
                "years_to_goal": years_to_goal,
                "projected_value": round(projected_value, 2),
                "surplus": round(projected_value - target_amount, 2),
                "recommendation": "Goal achievable with lower contributions"
            }
        else:
            # Need to extend timeline
            # Calculate required years with max contribution
            if max_monthly_contribution == 0:
                # Only relying on growth of current amount
                if current_amount > 0 and expected_return > 0:
                    required_years = np.log(target_amount / current_amount) / np.log(1 + expected_return)
                else:
                    required_years = float('inf')
            else:
                # Binary search for required years
                def portfolio_value_at_years(years):
                    months_calc = years * 12
                    fv_curr = current_amount * ((1 + monthly_rate) ** months_calc)
                    fv_contrib = max_monthly_contribution * (
                        ((1 + monthly_rate) ** months_calc - 1) / monthly_rate
                    ) if monthly_rate > 0 else max_monthly_contribution * months_calc
                    return fv_curr + fv_contrib

                # Binary search
                low, high = years_to_goal, years_to_goal * 3
                while high - low > 0.1:  # 0.1 year tolerance
                    mid = (low + high) / 2
                    pv = portfolio_value_at_years(mid)
                    if pv < target_amount:
                        low = mid
                    else:
                        high = mid

                required_years = (low + high) / 2

            shortfall = target_amount - projected_value

            return {
                "status": "timeline_extension_needed",
                "optimal_monthly_contribution": round(max_monthly_contribution, 2),
                "original_years": years_to_goal,
                "required_years": round(required_years, 2),
                "additional_years": round(required_years - years_to_goal, 2),
                "projected_value_original_timeline": round(projected_value, 2),
                "shortfall": round(shortfall, 2),
                "recommendation": f"Extend timeline by {round(required_years - years_to_goal, 1)} years or increase monthly contribution"
            }

    @classmethod
    def calculate_catch_up_strategy(
        cls,
        target_amount: float,
        current_amount: float,
        years_remaining: float,
        years_behind_schedule: float,
        expected_return: float = 0.07
    ) -> Dict:
        """
        Calculate catch-up strategy for goals that are behind schedule.

        Args:
            target_amount: Goal target
            current_amount: Current savings
            years_remaining: Years remaining to goal
            years_behind_schedule: How many years behind
            expected_return: Expected return

        Returns:
            Catch-up strategy with required contributions

        REQ-GOAL-007: Catch-up calculations for underperforming goals
        """
        # Calculate where we should be
        original_timeline = years_remaining + years_behind_schedule
        expected_progress = years_behind_schedule / original_timeline

        # Expected amount at this point (linear approximation)
        expected_current = target_amount * expected_progress

        # Actual shortfall
        shortfall = expected_current - current_amount

        # Calculate original required monthly
        original_required = cls.calculate_funding_requirements(
            target_amount=target_amount,
            current_amount=0,
            years_to_goal=original_timeline,
            expected_return=expected_return
        )["required_monthly_savings"]

        # Calculate catch-up required monthly
        catchup_required = cls.calculate_funding_requirements(
            target_amount=target_amount,
            current_amount=current_amount,
            years_to_goal=years_remaining,
            expected_return=expected_return
        )["required_monthly_savings"]

        # Additional monthly needed
        additional_monthly = catchup_required - original_required

        return {
            "years_behind_schedule": years_behind_schedule,
            "years_remaining": years_remaining,
            "expected_current_amount": round(expected_current, 2),
            "actual_current_amount": current_amount,
            "shortfall": round(shortfall, 2),
            "original_required_monthly": round(original_required, 2),
            "catchup_required_monthly": round(catchup_required, 2),
            "additional_monthly_needed": round(additional_monthly, 2),
            "catch_up_percentage": round((additional_monthly / original_required * 100), 2) if original_required > 0 else 0,
            "feasibility": "high" if additional_monthly < original_required * 0.5 else
                         "medium" if additional_monthly < original_required else "challenging",
            "recommendation": cls._get_catchup_recommendation(additional_monthly, original_required)
        }

    @classmethod
    def _calculate_pv_contributions(
        cls,
        monthly_contribution: float,
        years: float,
        annual_return: float
    ) -> float:
        """Calculate present value of future monthly contributions."""
        if years <= 0:
            return 0

        months = years * 12
        monthly_rate = annual_return / 12

        if monthly_rate == 0:
            return monthly_contribution * months

        # PV of annuity: PMT * [1 - (1 + r)^-n] / r
        pv = monthly_contribution * (1 - (1 + monthly_rate) ** (-months)) / monthly_rate
        return pv

    @classmethod
    def _get_catchup_recommendation(cls, additional_monthly: float, original_monthly: float) -> str:
        """Get recommendation for catch-up strategy."""
        if additional_monthly < original_monthly * 0.25:
            return "Small increase needed - catch-up is very feasible"
        elif additional_monthly < original_monthly * 0.5:
            return "Moderate increase needed - catch-up is feasible with some adjustment"
        elif additional_monthly < original_monthly:
            return "Significant increase needed - consider extending timeline or reducing target"
        else:
            return "Major increase needed - timeline extension or target reduction strongly recommended"
