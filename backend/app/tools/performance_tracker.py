"""
Historical Performance Tracking System
Track portfolio performance, benchmarks, and attribution analysis
"""

from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel
from datetime import datetime, timedelta
from enum import Enum
import numpy as np


class TimePeriod(str, Enum):
    """Time periods for performance analysis"""
    ONE_MONTH = "1M"
    THREE_MONTHS = "3M"
    SIX_MONTHS = "6M"
    YTD = "YTD"
    ONE_YEAR = "1Y"
    THREE_YEARS = "3Y"
    FIVE_YEARS = "5Y"
    TEN_YEARS = "10Y"
    INCEPTION = "Inception"


class PerformanceMetric(BaseModel):
    """Individual performance metric"""
    period: TimePeriod
    total_return: float  # Percentage
    annualized_return: float  # Percentage
    volatility: float  # Annual standard deviation
    sharpe_ratio: float
    sortino_ratio: float
    max_drawdown: float  # Percentage
    calmar_ratio: float  # Return / Max Drawdown


class BenchmarkComparison(BaseModel):
    """Comparison against benchmark"""
    period: TimePeriod
    portfolio_return: float
    benchmark_return: float
    excess_return: float  # Alpha
    information_ratio: float  # Excess return / tracking error
    tracking_error: float
    beta: float
    up_capture: float  # % of benchmark gains captured
    down_capture: float  # % of benchmark losses captured


class AttributionAnalysis(BaseModel):
    """Performance attribution by asset class"""
    asset_class: str
    contribution_to_return: float  # Percentage points
    weight: float
    asset_return: float
    selection_effect: float  # Return from asset selection
    allocation_effect: float  # Return from asset allocation


class PerformanceReport(BaseModel):
    """Comprehensive performance report"""
    portfolio_id: str
    as_of_date: str
    total_value: float
    total_return_ytd: float
    total_return_since_inception: float
    metrics_by_period: List[PerformanceMetric]
    benchmark_comparison: List[BenchmarkComparison]
    attribution: List[AttributionAnalysis]
    risk_metrics: Dict[str, float]
    notable_events: List[str]  # Significant portfolio events


class RiskMetrics(BaseModel):
    """Risk analysis metrics"""
    value_at_risk_95: float  # 95% VaR (daily)
    value_at_risk_99: float  # 99% VaR (daily)
    conditional_var_95: float  # Expected shortfall
    maximum_drawdown: float
    recovery_period_days: int
    correlation_to_market: float
    downside_deviation: float


def calculate_sharpe_ratio(
    returns: np.ndarray,
    risk_free_rate: float = 0.04
) -> float:
    """
    Calculate Sharpe ratio.

    (Mean return - Risk-free rate) / Standard deviation

    Args:
        returns: Array of returns
        risk_free_rate: Annual risk-free rate (default 4%)

    Returns:
        Sharpe ratio
    """
    if len(returns) == 0:
        return 0.0

    excess_return = np.mean(returns) - risk_free_rate / 252  # Daily risk-free rate
    std_dev = np.std(returns)

    if std_dev == 0:
        return 0.0

    # Annualize
    sharpe = (excess_return / std_dev) * np.sqrt(252)

    return round(sharpe, 2)


def calculate_sortino_ratio(
    returns: np.ndarray,
    risk_free_rate: float = 0.04,
    target_return: Optional[float] = None
) -> float:
    """
    Calculate Sortino ratio.

    Like Sharpe, but only penalizes downside volatility

    Args:
        returns: Array of returns
        risk_free_rate: Annual risk-free rate
        target_return: Target return (default = risk-free rate)

    Returns:
        Sortino ratio
    """
    if len(returns) == 0:
        return 0.0

    if target_return is None:
        target_return = risk_free_rate / 252

    excess_return = np.mean(returns) - target_return

    # Downside deviation (only negative returns)
    downside_returns = returns[returns < target_return]
    downside_dev = np.std(downside_returns) if len(downside_returns) > 0 else np.std(returns)

    if downside_dev == 0:
        return 0.0

    # Annualize
    sortino = (excess_return / downside_dev) * np.sqrt(252)

    return round(sortino, 2)


def calculate_max_drawdown(cumulative_returns: np.ndarray) -> Tuple[float, int]:
    """
    Calculate maximum drawdown and recovery period.

    Args:
        cumulative_returns: Array of cumulative returns

    Returns:
        Tuple of (max_drawdown_pct, recovery_days)
    """
    if len(cumulative_returns) == 0:
        return 0.0, 0

    # Calculate running maximum
    running_max = np.maximum.accumulate(cumulative_returns)

    # Calculate drawdowns
    drawdowns = (cumulative_returns - running_max) / running_max

    # Find maximum drawdown
    max_dd = np.min(drawdowns)

    # Find recovery period (days from max DD to recovery)
    max_dd_idx = np.argmin(drawdowns)

    # Find next peak
    recovery_idx = max_dd_idx
    peak_value = running_max[max_dd_idx]

    for i in range(max_dd_idx + 1, len(cumulative_returns)):
        if cumulative_returns[i] >= peak_value:
            recovery_idx = i
            break

    recovery_days = recovery_idx - max_dd_idx

    return round(max_dd * 100, 2), recovery_days


def calculate_calmar_ratio(
    annualized_return: float,
    max_drawdown: float
) -> float:
    """
    Calculate Calmar ratio.

    Annualized return / Maximum drawdown

    Args:
        annualized_return: Annualized return (percentage)
        max_drawdown: Maximum drawdown (positive percentage)

    Returns:
        Calmar ratio
    """
    if max_drawdown == 0:
        return 0.0

    return round(annualized_return / max_drawdown, 2)


async def calculate_performance_metrics(
    returns: np.ndarray,
    period: TimePeriod,
    risk_free_rate: float = 0.04
) -> PerformanceMetric:
    """
    Calculate comprehensive performance metrics for a period.

    Args:
        returns: Array of daily returns
        period: Time period
        risk_free_rate: Annual risk-free rate

    Returns:
        Performance metrics
    """
    if len(returns) == 0:
        return PerformanceMetric(
            period=period,
            total_return=0.0,
            annualized_return=0.0,
            volatility=0.0,
            sharpe_ratio=0.0,
            sortino_ratio=0.0,
            max_drawdown=0.0,
            calmar_ratio=0.0
        )

    # Total return
    cumulative_returns = np.cumprod(1 + returns)
    total_return = (cumulative_returns[-1] - 1) * 100

    # Annualized return
    years = len(returns) / 252  # Trading days per year
    annualized_return = ((cumulative_returns[-1]) ** (1 / years) - 1) * 100 if years > 0 else total_return

    # Volatility (annualized)
    volatility = np.std(returns) * np.sqrt(252) * 100

    # Sharpe ratio
    sharpe = calculate_sharpe_ratio(returns, risk_free_rate)

    # Sortino ratio
    sortino = calculate_sortino_ratio(returns, risk_free_rate)

    # Max drawdown
    max_dd, _ = calculate_max_drawdown(cumulative_returns)

    # Calmar ratio
    calmar = calculate_calmar_ratio(annualized_return, abs(max_dd))

    return PerformanceMetric(
        period=period,
        total_return=round(total_return, 2),
        annualized_return=round(annualized_return, 2),
        volatility=round(volatility, 2),
        sharpe_ratio=sharpe,
        sortino_ratio=sortino,
        max_drawdown=max_dd,
        calmar_ratio=calmar
    )


async def compare_to_benchmark(
    portfolio_returns: np.ndarray,
    benchmark_returns: np.ndarray,
    period: TimePeriod
) -> BenchmarkComparison:
    """
    Compare portfolio performance to benchmark.

    Args:
        portfolio_returns: Portfolio daily returns
        benchmark_returns: Benchmark daily returns
        period: Time period

    Returns:
        Benchmark comparison metrics
    """
    if len(portfolio_returns) == 0 or len(benchmark_returns) == 0:
        return BenchmarkComparison(
            period=period,
            portfolio_return=0.0,
            benchmark_return=0.0,
            excess_return=0.0,
            information_ratio=0.0,
            tracking_error=0.0,
            beta=0.0,
            up_capture=0.0,
            down_capture=0.0
        )

    # Total returns
    portfolio_total = (np.prod(1 + portfolio_returns) - 1) * 100
    benchmark_total = (np.prod(1 + benchmark_returns) - 1) * 100

    # Excess return (alpha)
    excess_return = portfolio_total - benchmark_total

    # Tracking error
    tracking_error = np.std(portfolio_returns - benchmark_returns) * np.sqrt(252) * 100

    # Information ratio
    info_ratio = excess_return / tracking_error if tracking_error > 0 else 0.0

    # Beta
    covariance = np.cov(portfolio_returns, benchmark_returns)[0, 1]
    benchmark_variance = np.var(benchmark_returns)
    beta = covariance / benchmark_variance if benchmark_variance > 0 else 1.0

    # Up/down capture
    up_periods = benchmark_returns > 0
    down_periods = benchmark_returns < 0

    if np.sum(up_periods) > 0:
        up_capture = (np.mean(portfolio_returns[up_periods]) / np.mean(benchmark_returns[up_periods])) * 100
    else:
        up_capture = 100.0

    if np.sum(down_periods) > 0:
        down_capture = (np.mean(portfolio_returns[down_periods]) / np.mean(benchmark_returns[down_periods])) * 100
    else:
        down_capture = 100.0

    return BenchmarkComparison(
        period=period,
        portfolio_return=round(portfolio_total, 2),
        benchmark_return=round(benchmark_total, 2),
        excess_return=round(excess_return, 2),
        information_ratio=round(info_ratio, 2),
        tracking_error=round(tracking_error, 2),
        beta=round(beta, 2),
        up_capture=round(up_capture, 1),
        down_capture=round(down_capture, 1)
    )


async def calculate_attribution(
    asset_returns: Dict[str, np.ndarray],  # {asset_class: returns}
    asset_weights: Dict[str, float],  # {asset_class: weight}
    benchmark_weights: Optional[Dict[str, float]] = None
) -> List[AttributionAnalysis]:
    """
    Calculate performance attribution by asset class.

    Attribution analysis shows:
    - Allocation effect: return from over/underweighting asset classes
    - Selection effect: return from choosing specific securities

    Args:
        asset_returns: Returns by asset class
        asset_weights: Portfolio weights
        benchmark_weights: Benchmark weights (if comparing)

    Returns:
        Attribution analysis by asset class
    """
    attribution = []

    # Calculate total portfolio return
    portfolio_return = sum([
        asset_weights.get(asset, 0) * (np.prod(1 + returns) - 1)
        for asset, returns in asset_returns.items()
    ])

    for asset_class, returns in asset_returns.items():
        weight = asset_weights.get(asset_class, 0)
        asset_return = (np.prod(1 + returns) - 1) * 100

        # Contribution to total return
        contribution = weight * asset_return

        # Allocation effect (if benchmark provided)
        if benchmark_weights:
            benchmark_weight = benchmark_weights.get(asset_class, 0)
            weight_difference = weight - benchmark_weight
            allocation_effect = weight_difference * asset_return
        else:
            allocation_effect = 0.0

        # Selection effect (simplified - would need security-level data)
        selection_effect = 0.0

        attribution.append(AttributionAnalysis(
            asset_class=asset_class,
            contribution_to_return=round(contribution, 2),
            weight=round(weight, 4),
            asset_return=round(asset_return, 2),
            selection_effect=round(selection_effect, 2),
            allocation_effect=round(allocation_effect, 2)
        ))

    # Sort by contribution (highest first)
    attribution.sort(key=lambda x: abs(x.contribution_to_return), reverse=True)

    return attribution


async def calculate_risk_metrics(
    returns: np.ndarray,
    market_returns: Optional[np.ndarray] = None
) -> RiskMetrics:
    """
    Calculate comprehensive risk metrics.

    Args:
        returns: Portfolio daily returns
        market_returns: Market returns (for correlation)

    Returns:
        Risk metrics
    """
    if len(returns) == 0:
        return RiskMetrics(
            value_at_risk_95=0.0,
            value_at_risk_99=0.0,
            conditional_var_95=0.0,
            maximum_drawdown=0.0,
            recovery_period_days=0,
            correlation_to_market=0.0,
            downside_deviation=0.0
        )

    # Value at Risk (VaR)
    var_95 = np.percentile(returns, 5) * 100  # 95% confidence
    var_99 = np.percentile(returns, 1) * 100  # 99% confidence

    # Conditional VaR (expected shortfall)
    worst_5pct = returns[returns <= np.percentile(returns, 5)]
    cvar_95 = np.mean(worst_5pct) * 100 if len(worst_5pct) > 0 else var_95

    # Maximum drawdown
    cumulative_returns = np.cumprod(1 + returns)
    max_dd, recovery_days = calculate_max_drawdown(cumulative_returns)

    # Correlation to market
    if market_returns is not None and len(market_returns) > 0:
        correlation = np.corrcoef(returns, market_returns)[0, 1]
    else:
        correlation = 0.0

    # Downside deviation
    negative_returns = returns[returns < 0]
    downside_dev = np.std(negative_returns) * np.sqrt(252) * 100 if len(negative_returns) > 0 else 0.0

    return RiskMetrics(
        value_at_risk_95=round(var_95, 2),
        value_at_risk_99=round(var_99, 2),
        conditional_var_95=round(cvar_95, 2),
        maximum_drawdown=max_dd,
        recovery_period_days=recovery_days,
        correlation_to_market=round(correlation, 2),
        downside_deviation=round(downside_dev, 2)
    )


async def generate_performance_report(
    portfolio_id: str,
    historical_values: Dict[str, float],  # {date: value}
    asset_class_returns: Dict[str, Dict[str, float]],  # {asset_class: {date: return}}
    asset_weights: Dict[str, float],
    benchmark_returns: Optional[Dict[str, float]] = None,
    benchmark_weights: Optional[Dict[str, float]] = None
) -> PerformanceReport:
    """
    Generate comprehensive performance report.

    Args:
        portfolio_id: Portfolio identifier
        historical_values: Historical portfolio values
        asset_class_returns: Returns by asset class
        asset_weights: Current asset weights
        benchmark_returns: Benchmark returns (optional)
        benchmark_weights: Benchmark weights (optional)

    Returns:
        Complete performance report
    """
    # Convert to arrays and calculate returns
    dates = sorted(historical_values.keys())
    values = np.array([historical_values[d] for d in dates])
    returns = np.diff(values) / values[:-1]

    # Calculate metrics for different periods
    periods = [TimePeriod.ONE_MONTH, TimePeriod.THREE_MONTHS, TimePeriod.YTD, TimePeriod.ONE_YEAR]
    metrics_by_period = []

    for period in periods:
        # Get appropriate subset of returns
        if period == TimePeriod.ONE_MONTH:
            period_returns = returns[-21:]  # ~21 trading days
        elif period == TimePeriod.THREE_MONTHS:
            period_returns = returns[-63:]
        elif period == TimePeriod.ONE_YEAR:
            period_returns = returns[-252:]
        else:  # YTD
            period_returns = returns  # Simplified

        metrics = await calculate_performance_metrics(period_returns, period)
        metrics_by_period.append(metrics)

    # Benchmark comparison
    benchmark_comparison = []
    if benchmark_returns:
        benchmark_dates = sorted(benchmark_returns.keys())
        benchmark_vals = np.array([benchmark_returns[d] for d in benchmark_dates])
        benchmark_rets = np.diff(benchmark_vals) / benchmark_vals[:-1]

        for period in periods:
            # Get matching periods
            if period == TimePeriod.ONE_MONTH:
                p_rets = returns[-21:]
                b_rets = benchmark_rets[-21:]
            elif period == TimePeriod.THREE_MONTHS:
                p_rets = returns[-63:]
                b_rets = benchmark_rets[-63:]
            elif period == TimePeriod.ONE_YEAR:
                p_rets = returns[-252:]
                b_rets = benchmark_rets[-252:]
            else:
                p_rets = returns
                b_rets = benchmark_rets

            comparison = await compare_to_benchmark(p_rets, b_rets, period)
            benchmark_comparison.append(comparison)

    # Attribution analysis
    asset_returns_arrays = {
        asset: np.array(list(rets.values()))
        for asset, rets in asset_class_returns.items()
    }
    attribution = await calculate_attribution(asset_returns_arrays, asset_weights, benchmark_weights)

    # Risk metrics
    risk_metrics = await calculate_risk_metrics(returns)

    # Calculate key statistics
    total_return_ytd = ((values[-1] / values[0]) - 1) * 100 if len(values) > 0 else 0.0
    total_return_inception = total_return_ytd  # Simplified

    # Notable events (simplified - would be populated from actual events)
    notable_events = []
    if abs(total_return_ytd) > 20:
        notable_events.append(f"Portfolio has {'gained' if total_return_ytd > 0 else 'lost'} {abs(total_return_ytd):.1f}% YTD")

    return PerformanceReport(
        portfolio_id=portfolio_id,
        as_of_date=dates[-1] if dates else datetime.now().isoformat(),
        total_value=values[-1] if len(values) > 0 else 0.0,
        total_return_ytd=round(total_return_ytd, 2),
        total_return_since_inception=round(total_return_inception, 2),
        metrics_by_period=metrics_by_period,
        benchmark_comparison=benchmark_comparison,
        attribution=attribution,
        risk_metrics={
            "var_95": risk_metrics.value_at_risk_95,
            "var_99": risk_metrics.value_at_risk_99,
            "max_drawdown": risk_metrics.maximum_drawdown,
            "correlation": risk_metrics.correlation_to_market
        },
        notable_events=notable_events
    )
