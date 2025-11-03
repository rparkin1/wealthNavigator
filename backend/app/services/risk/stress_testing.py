"""
Stress Testing Service
Scenario analysis and stress testing for portfolio risk assessment

REQ-RISK-003: Stress testing with historical and hypothetical scenarios
REQ-RISK-004: Monte Carlo simulation integration
"""

import numpy as np
from typing import Dict, List, Optional
from pydantic import BaseModel
from enum import Enum


class ScenarioType(str, Enum):
    """Types of stress test scenarios"""
    HISTORICAL = "historical"
    HYPOTHETICAL = "hypothetical"
    SENSITIVITY = "sensitivity"
    MONTE_CARLO = "monte_carlo"


class StressScenario(BaseModel):
    """Stress test scenario definition"""
    name: str
    description: str
    type: ScenarioType
    asset_shocks: Dict[str, float]  # {asset: % change}
    probability: Optional[float] = None  # Likelihood of scenario


class StressTestResult(BaseModel):
    """Result of stress testing"""
    scenario_name: str
    original_value: float
    stressed_value: float
    value_change: float
    pct_change: float
    asset_impacts: Dict[str, float]  # Impact by asset
    risk_metrics_change: Dict[str, float]  # How metrics change
    severity: str  # mild, moderate, severe, catastrophic


class StressTestingSuite(BaseModel):
    """Complete stress testing results"""
    portfolio_value: float
    scenarios_tested: int
    results: List[StressTestResult]
    worst_case_scenario: StressTestResult
    best_case_scenario: StressTestResult
    average_impact: float
    value_at_risk_stress: float  # VaR from stress tests


class StressTestingService:
    """Service for portfolio stress testing and scenario analysis"""

    # Historical scenario presets
    HISTORICAL_SCENARIOS = {
        "2008_financial_crisis": StressScenario(
            name="2008 Financial Crisis",
            description="Global financial crisis scenario",
            type=ScenarioType.HISTORICAL,
            asset_shocks={
                "US_LC_BLEND": -0.37,
                "US_MC_BLEND": -0.36,
                "US_SC_BLEND": -0.31,
                "INTL_DEV_BLEND": -0.43,
                "EM_BLEND": -0.53,
                "US_TREASURY_INTER": 0.05,
                "US_CORP_IG": -0.05,
                "US_REIT": -0.38,
                "GOLD": 0.05,
                "COMMODITY_BROAD": -0.36
            },
            probability=0.01  # 1% annual probability
        ),
        "2020_covid_crash": StressScenario(
            name="COVID-19 Market Crash",
            description="March 2020 pandemic shock",
            type=ScenarioType.HISTORICAL,
            asset_shocks={
                "US_LC_BLEND": -0.34,
                "US_MC_BLEND": -0.42,
                "US_SC_BLEND": -0.45,
                "INTL_DEV_BLEND": -0.32,
                "EM_BLEND": -0.38,
                "US_TREASURY_INTER": 0.08,
                "US_CORP_IG": -0.10,
                "US_REIT": -0.28,
                "GOLD": 0.05,
                "COMMODITY_BROAD": -0.30
            },
            probability=0.02  # 2% annual probability
        ),
        "2000_dot_com_bubble": StressScenario(
            name="Dot-Com Bubble Burst",
            description="Tech bubble collapse 2000-2002",
            type=ScenarioType.HISTORICAL,
            asset_shocks={
                "US_LC_BLEND": -0.49,
                "US_LC_GROWTH": -0.62,
                "US_MC_BLEND": -0.14,
                "US_SC_BLEND": -0.07,
                "INTL_DEV_BLEND": -0.45,
                "US_TREASURY_INTER": 0.15,
                "US_CORP_IG": 0.08,
                "GOLD": 0.12
            },
            probability=0.015
        ),
        "1987_black_monday": StressScenario(
            name="1987 Black Monday",
            description="Largest single-day stock market crash",
            type=ScenarioType.HISTORICAL,
            asset_shocks={
                "US_LC_BLEND": -0.22,
                "US_MC_BLEND": -0.20,
                "US_SC_BLEND": -0.18,
                "INTL_DEV_BLEND": -0.25,
                "US_TREASURY_INTER": 0.03,
                "US_CORP_IG": -0.02
            },
            probability=0.005
        ),
        "rising_rates": StressScenario(
            name="Rapid Interest Rate Rise",
            description="Fed aggressively raises rates",
            type=ScenarioType.HYPOTHETICAL,
            asset_shocks={
                "US_LC_BLEND": -0.10,
                "US_MC_BLEND": -0.12,
                "US_SC_BLEND": -0.15,
                "INTL_DEV_BLEND": -0.08,
                "EM_BLEND": -0.18,
                "US_TREASURY_SHORT": -0.02,
                "US_TREASURY_INTER": -0.10,
                "US_TREASURY_LONG": -0.20,
                "US_CORP_IG": -0.15,
                "US_CORP_HY": -0.25,
                "US_REIT": -0.20,
                "GOLD": 0.10
            },
            probability=0.10
        ),
        "recession": StressScenario(
            name="Economic Recession",
            description="Standard recession scenario",
            type=ScenarioType.HYPOTHETICAL,
            asset_shocks={
                "US_LC_BLEND": -0.20,
                "US_MC_BLEND": -0.25,
                "US_SC_BLEND": -0.30,
                "INTL_DEV_BLEND": -0.22,
                "EM_BLEND": -0.28,
                "US_TREASURY_INTER": 0.08,
                "US_CORP_IG": -0.05,
                "US_CORP_HY": -0.15,
                "US_REIT": -0.18,
                "COMMODITY_BROAD": -0.15
            },
            probability=0.15
        ),
        "stagflation": StressScenario(
            name="Stagflation",
            description="High inflation + low growth",
            type=ScenarioType.HYPOTHETICAL,
            asset_shocks={
                "US_LC_BLEND": -0.15,
                "US_MC_BLEND": -0.18,
                "US_SC_BLEND": -0.20,
                "INTL_DEV_BLEND": -0.12,
                "US_TREASURY_INTER": -0.08,
                "US_TREASURY_LONG": -0.15,
                "TIPS": 0.05,
                "GOLD": 0.25,
                "COMMODITY_BROAD": 0.15,
                "US_REIT": -0.10
            },
            probability=0.08
        )
    }

    def run_stress_test_suite(
        self,
        portfolio_value: float,
        allocation: Dict[str, float],  # {asset: weight}
        scenarios: Optional[List[str]] = None,  # Scenario names to test
        include_all_presets: bool = True
    ) -> StressTestingSuite:
        """
        Run comprehensive stress test suite

        Args:
            portfolio_value: Current portfolio value
            allocation: Asset allocation weights
            scenarios: Specific scenarios to test (if None, uses all)
            include_all_presets: Include all preset scenarios

        Returns:
            Complete stress testing results
        """
        results = []

        # Determine which scenarios to test
        if scenarios:
            scenarios_to_test = [
                self.HISTORICAL_SCENARIOS[name]
                for name in scenarios
                if name in self.HISTORICAL_SCENARIOS
            ]
        elif include_all_presets:
            scenarios_to_test = list(self.HISTORICAL_SCENARIOS.values())
        else:
            # Default: test most common scenarios
            default_scenarios = [
                "2008_financial_crisis",
                "2020_covid_crash",
                "rising_rates",
                "recession"
            ]
            scenarios_to_test = [
                self.HISTORICAL_SCENARIOS[name] for name in default_scenarios
            ]

        # Run each scenario
        for scenario in scenarios_to_test:
            result = self.run_single_scenario(portfolio_value, allocation, scenario)
            results.append(result)

        # Find worst and best cases
        worst_case = min(results, key=lambda r: r.value_change)
        best_case = max(results, key=lambda r: r.value_change)

        # Calculate average impact
        avg_impact = np.mean([r.value_change for r in results])

        # Calculate stress VaR (worst 5% of scenarios)
        sorted_changes = sorted([r.value_change for r in results])
        var_index = max(0, int(len(sorted_changes) * 0.05) - 1)
        value_at_risk_stress = abs(sorted_changes[var_index])

        return StressTestingSuite(
            portfolio_value=portfolio_value,
            scenarios_tested=len(results),
            results=results,
            worst_case_scenario=worst_case,
            best_case_scenario=best_case,
            average_impact=round(avg_impact, 2),
            value_at_risk_stress=round(value_at_risk_stress, 2)
        )

    def run_single_scenario(
        self,
        portfolio_value: float,
        allocation: Dict[str, float],
        scenario: StressScenario
    ) -> StressTestResult:
        """
        Run single stress test scenario

        Args:
            portfolio_value: Current portfolio value
            allocation: Asset allocation weights
            scenario: Scenario to test

        Returns:
            Stress test result
        """
        # Calculate impact on each asset
        asset_impacts = {}
        total_impact = 0.0

        for asset, weight in allocation.items():
            # Get shock for this asset
            shock = scenario.asset_shocks.get(asset, 0.0)

            # Calculate dollar impact
            asset_value = portfolio_value * weight
            asset_impact = asset_value * shock

            asset_impacts[asset] = round(asset_impact, 2)
            total_impact += asset_impact

        # Calculate stressed portfolio value
        stressed_value = portfolio_value + total_impact
        pct_change = (total_impact / portfolio_value) if portfolio_value > 0 else 0

        # Determine severity
        severity = self._determine_severity(pct_change)

        # Risk metrics changes (simplified)
        risk_metrics_change = {
            "volatility_change": abs(pct_change) * 0.5,  # Volatility increases
            "sharpe_change": pct_change * 2.0,  # Sharpe deteriorates
            "max_drawdown": abs(pct_change)
        }

        return StressTestResult(
            scenario_name=scenario.name,
            original_value=round(portfolio_value, 2),
            stressed_value=round(stressed_value, 2),
            value_change=round(total_impact, 2),
            pct_change=round(pct_change, 4),
            asset_impacts=asset_impacts,
            risk_metrics_change=risk_metrics_change,
            severity=severity
        )

    def create_custom_scenario(
        self,
        name: str,
        description: str,
        asset_shocks: Dict[str, float],
        scenario_type: ScenarioType = ScenarioType.HYPOTHETICAL
    ) -> StressScenario:
        """
        Create custom stress test scenario

        Args:
            name: Scenario name
            description: Scenario description
            asset_shocks: Asset-specific shocks {asset: % change}
            scenario_type: Type of scenario

        Returns:
            Custom stress scenario
        """
        return StressScenario(
            name=name,
            description=description,
            type=scenario_type,
            asset_shocks=asset_shocks
        )

    def run_sensitivity_analysis(
        self,
        portfolio_value: float,
        allocation: Dict[str, float],
        asset: str,
        shock_range: List[float]  # e.g., [-0.30, -0.20, -0.10, 0, 0.10, 0.20, 0.30]
    ) -> List[StressTestResult]:
        """
        Run sensitivity analysis on single asset

        Args:
            portfolio_value: Current portfolio value
            allocation: Asset allocation weights
            asset: Asset to shock
            shock_range: Range of shocks to test

        Returns:
            List of stress test results for each shock level
        """
        results = []

        for shock in shock_range:
            scenario = StressScenario(
                name=f"{asset} {shock:+.1%} Shock",
                description=f"Sensitivity test: {asset} moves {shock:+.1%}",
                type=ScenarioType.SENSITIVITY,
                asset_shocks={asset: shock}
            )

            result = self.run_single_scenario(portfolio_value, allocation, scenario)
            results.append(result)

        return results

    def run_monte_carlo_stress(
        self,
        portfolio_value: float,
        allocation: Dict[str, float],
        asset_volatilities: Dict[str, float],
        n_simulations: int = 10000,
        confidence_level: float = 0.05
    ) -> Dict:
        """
        Run Monte Carlo stress testing

        Args:
            portfolio_value: Current portfolio value
            allocation: Asset allocation weights
            asset_volatilities: Volatility for each asset
            n_simulations: Number of Monte Carlo simulations
            confidence_level: Confidence level for VaR (default 5% = 95% VaR)

        Returns:
            Monte Carlo stress test results
        """
        # Generate random returns for each asset
        simulated_values = []

        for _ in range(n_simulations):
            portfolio_return = 0.0

            for asset, weight in allocation.items():
                # Get volatility for this asset
                vol = asset_volatilities.get(asset, 0.15)  # Default 15%

                # Generate random return (normal distribution)
                asset_return = np.random.normal(0, vol / np.sqrt(252))  # Daily
                portfolio_return += weight * asset_return

            simulated_value = portfolio_value * (1 + portfolio_return)
            simulated_values.append(simulated_value)

        simulated_values = np.array(simulated_values)

        # Calculate statistics
        mean_value = float(np.mean(simulated_values))
        median_value = float(np.median(simulated_values))
        std_value = float(np.std(simulated_values))

        # VaR at confidence level
        var_value = float(np.percentile(simulated_values, confidence_level * 100))
        var_loss = portfolio_value - var_value

        # CVaR (expected value below VaR)
        tail_values = simulated_values[simulated_values <= var_value]
        cvar_value = float(np.mean(tail_values)) if len(tail_values) > 0 else var_value
        cvar_loss = portfolio_value - cvar_value

        # Worst case
        worst_case = float(np.min(simulated_values))
        worst_loss = portfolio_value - worst_case

        return {
            "simulations": n_simulations,
            "mean_value": round(mean_value, 2),
            "median_value": round(median_value, 2),
            "std_deviation": round(std_value, 2),
            "var_value": round(var_value, 2),
            "var_loss": round(var_loss, 2),
            "cvar_value": round(cvar_value, 2),
            "cvar_loss": round(cvar_loss, 2),
            "worst_case_value": round(worst_case, 2),
            "worst_loss": round(worst_loss, 2),
            "confidence_level": confidence_level
        }

    def _determine_severity(self, pct_change: float) -> str:
        """Determine severity level from percentage change"""
        abs_change = abs(pct_change)

        if abs_change < 0.05:
            return "mild"
        elif abs_change < 0.15:
            return "moderate"
        elif abs_change < 0.30:
            return "severe"
        else:
            return "catastrophic"
