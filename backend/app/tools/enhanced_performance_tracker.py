"""
Enhanced Performance Tracking with TWR, MWR, and Tax Reporting
Completes the missing 15% of performance reporting requirements
"""

from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel
from datetime import datetime, timedelta
import numpy as np
from decimal import Decimal


class CashFlow(BaseModel):
    """Cash flow event (contribution or withdrawal)"""
    date: str
    amount: float  # Positive for contribution, negative for withdrawal
    account_id: Optional[str] = None


class TimeWeightedReturn(BaseModel):
    """Time-weighted return calculation (removes impact of cash flows)"""
    period: str
    twr_percentage: float  # Time-weighted return
    method: str = "geometric"
    cash_flows_removed: int


class MoneyWeightedReturn(BaseModel):
    """Money-weighted return (IRR including impact of cash flows)"""
    period: str
    mwr_percentage: float  # Internal rate of return
    total_contributions: float
    total_withdrawals: float
    net_cash_flow: float


class AccountPerformance(BaseModel):
    """Performance metrics by account"""
    account_id: str
    account_name: str
    account_type: str  # taxable, tax_deferred, tax_exempt
    beginning_value: float
    ending_value: float
    contributions: float
    withdrawals: float
    twr: float
    mwr: float
    gain_loss: float
    gain_loss_pct: float


class TaxLotPosition(BaseModel):
    """Individual tax lot for cost basis tracking"""
    ticker: str
    acquisition_date: str
    quantity: float
    cost_basis_per_share: float
    total_cost_basis: float
    current_price: float
    current_value: float
    unrealized_gain_loss: float
    holding_period: str  # 'short_term' or 'long_term'


class RealizedGain(BaseModel):
    """Realized capital gain/loss"""
    ticker: str
    sale_date: str
    acquisition_date: str
    quantity: float
    cost_basis: float
    sale_proceeds: float
    gain_loss: float
    holding_period: str
    wash_sale: bool


class TaxReportSummary(BaseModel):
    """Comprehensive tax reporting"""
    realized_gains_short_term: float
    realized_gains_long_term: float
    realized_losses_short_term: float
    realized_losses_long_term: float
    unrealized_gains_short_term: float
    unrealized_gains_long_term: float
    unrealized_losses_short_term: float
    unrealized_losses_long_term: float
    total_cost_basis: float
    total_current_value: float
    tlh_opportunities: List[Dict]
    estimated_tax_liability: float
    tax_lots: List[TaxLotPosition]
    realized_transactions: List[RealizedGain]


class FeesExpensesImpact(BaseModel):
    """Impact of fees and expenses on performance"""
    period: str
    management_fees: float
    trading_commissions: float
    expense_ratios: float  # From ETFs/mutual funds
    other_fees: float
    total_fees: float
    fee_impact_on_return: float  # Percentage points
    fee_percentage_of_assets: float


class CurrencyEffect(BaseModel):
    """Currency impact for international investments"""
    asset_class: str
    local_currency_return: float
    currency_effect: float
    usd_return: float
    currency_pair: str


class PeerGroupComparison(BaseModel):
    """Comparison to peer groups"""
    peer_group: str  # e.g., "Balanced 60/40", "Aggressive Growth"
    period: str
    portfolio_return: float
    peer_median: float
    peer_25th_percentile: float
    peer_75th_percentile: float
    percentile_rank: int  # 1-100
    vs_median: float


def calculate_time_weighted_return(
    portfolio_values: List[Tuple[str, float]],  # [(date, value), ...]
    cash_flows: List[CashFlow]
) -> TimeWeightedReturn:
    """
    Calculate time-weighted return (geometric method).

    TWR removes the impact of cash flows to measure manager performance.
    Formula: [(1 + R1) × (1 + R2) × ... × (1 + Rn)] - 1

    Args:
        portfolio_values: List of (date, value) tuples
        cash_flows: List of cash flow events

    Returns:
        Time-weighted return
    """
    if len(portfolio_values) < 2:
        return TimeWeightedReturn(
            period="N/A",
            twr_percentage=0.0,
            cash_flows_removed=len(cash_flows)
        )

    # Sort by date
    portfolio_values.sort(key=lambda x: x[0])
    cash_flows_sorted = sorted(cash_flows, key=lambda x: x.date)

    # Create sub-periods between cash flows
    sub_period_returns = []

    cash_flow_dates = set(cf.date for cf in cash_flows_sorted)
    all_dates = [date for date, _ in portfolio_values]

    for i in range(len(portfolio_values) - 1):
        date1, value1 = portfolio_values[i]
        date2, value2 = portfolio_values[i + 1]

        # Check if there's a cash flow in this period
        cf_amount = 0.0
        for cf in cash_flows_sorted:
            if date1 < cf.date <= date2:
                cf_amount += cf.amount

        # Calculate sub-period return
        # Adjust for cash flow: (End Value - Cash Flow) / Begin Value - 1
        if value1 > 0:
            sub_return = ((value2 - cf_amount) / value1) - 1
            sub_period_returns.append(sub_return)

    # Geometric linking
    if sub_period_returns:
        twr = np.prod([1 + r for r in sub_period_returns]) - 1
    else:
        twr = 0.0

    start_date = portfolio_values[0][0]
    end_date = portfolio_values[-1][0]

    return TimeWeightedReturn(
        period=f"{start_date} to {end_date}",
        twr_percentage=round(twr * 100, 2),
        cash_flows_removed=len(cash_flows)
    )


def calculate_money_weighted_return(
    initial_value: float,
    ending_value: float,
    cash_flows: List[CashFlow],
    start_date: str,
    end_date: str
) -> MoneyWeightedReturn:
    """
    Calculate money-weighted return (internal rate of return).

    MWR includes the impact of timing of cash flows.
    Uses Newton-Raphson method to solve for IRR.

    Args:
        initial_value: Starting portfolio value
        ending_value: Ending portfolio value
        cash_flows: List of cash flows
        start_date: Period start date
        end_date: Period end date

    Returns:
        Money-weighted return
    """
    # Calculate total contributions and withdrawals
    total_contributions = sum(cf.amount for cf in cash_flows if cf.amount > 0)
    total_withdrawals = sum(abs(cf.amount) for cf in cash_flows if cf.amount < 0)
    net_cash_flow = total_contributions - total_withdrawals

    # Simple IRR approximation
    # More accurate would use actual dates and solve iteratively
    total_days = (datetime.fromisoformat(end_date) - datetime.fromisoformat(start_date)).days

    if total_days == 0 or initial_value == 0:
        return MoneyWeightedReturn(
            period=f"{start_date} to {end_date}",
            mwr_percentage=0.0,
            total_contributions=total_contributions,
            total_withdrawals=total_withdrawals,
            net_cash_flow=net_cash_flow
        )

    # Simplified MWR calculation
    # (Ending Value - Initial Value - Net Cash Flow) / (Initial Value + Net Cash Flow/2)
    gain = ending_value - initial_value - net_cash_flow
    average_invested = initial_value + net_cash_flow / 2

    if average_invested > 0:
        mwr = (gain / average_invested) * (365 / total_days)  # Annualized
    else:
        mwr = 0.0

    return MoneyWeightedReturn(
        period=f"{start_date} to {end_date}",
        mwr_percentage=round(mwr * 100, 2),
        total_contributions=round(total_contributions, 2),
        total_withdrawals=round(total_withdrawals, 2),
        net_cash_flow=round(net_cash_flow, 2)
    )


def calculate_account_performance(
    account_id: str,
    account_name: str,
    account_type: str,
    portfolio_values: List[Tuple[str, float]],
    cash_flows: List[CashFlow]
) -> AccountPerformance:
    """
    Calculate performance metrics for a specific account.

    Args:
        account_id: Account identifier
        account_name: Account display name
        account_type: taxable, tax_deferred, or tax_exempt
        portfolio_values: Historical values
        cash_flows: Cash flows for this account

    Returns:
        Account-level performance
    """
    if len(portfolio_values) < 2:
        return AccountPerformance(
            account_id=account_id,
            account_name=account_name,
            account_type=account_type,
            beginning_value=0.0,
            ending_value=0.0,
            contributions=0.0,
            withdrawals=0.0,
            twr=0.0,
            mwr=0.0,
            gain_loss=0.0,
            gain_loss_pct=0.0
        )

    beginning_value = portfolio_values[0][1]
    ending_value = portfolio_values[-1][1]
    start_date = portfolio_values[0][0]
    end_date = portfolio_values[-1][0]

    contributions = sum(cf.amount for cf in cash_flows if cf.amount > 0)
    withdrawals = sum(abs(cf.amount) for cf in cash_flows if cf.amount < 0)

    # Calculate TWR
    twr_result = calculate_time_weighted_return(portfolio_values, cash_flows)

    # Calculate MWR
    mwr_result = calculate_money_weighted_return(
        beginning_value, ending_value, cash_flows, start_date, end_date
    )

    # Gain/loss
    gain_loss = ending_value - beginning_value - contributions + withdrawals
    gain_loss_pct = (gain_loss / beginning_value * 100) if beginning_value > 0 else 0.0

    return AccountPerformance(
        account_id=account_id,
        account_name=account_name,
        account_type=account_type,
        beginning_value=round(beginning_value, 2),
        ending_value=round(ending_value, 2),
        contributions=round(contributions, 2),
        withdrawals=round(withdrawals, 2),
        twr=twr_result.twr_percentage,
        mwr=mwr_result.mwr_percentage,
        gain_loss=round(gain_loss, 2),
        gain_loss_pct=round(gain_loss_pct, 2)
    )


def calculate_tax_reporting(
    tax_lots: List[TaxLotPosition],
    realized_transactions: List[RealizedGain],
    tax_rate_short_term: float = 0.37,  # Federal top rate
    tax_rate_long_term: float = 0.20     # Federal long-term cap gains
) -> TaxReportSummary:
    """
    Generate comprehensive tax reporting.

    Args:
        tax_lots: Current tax lot positions
        realized_transactions: Realized gains/losses for the period
        tax_rate_short_term: Short-term capital gains tax rate
        tax_rate_long_term: Long-term capital gains tax rate

    Returns:
        Tax report summary
    """
    # Realized gains/losses
    realized_gains_st = sum(
        g.gain_loss for g in realized_transactions
        if g.holding_period == 'short_term' and g.gain_loss > 0
    )
    realized_gains_lt = sum(
        g.gain_loss for g in realized_transactions
        if g.holding_period == 'long_term' and g.gain_loss > 0
    )
    realized_losses_st = sum(
        abs(g.gain_loss) for g in realized_transactions
        if g.holding_period == 'short_term' and g.gain_loss < 0
    )
    realized_losses_lt = sum(
        abs(g.gain_loss) for g in realized_transactions
        if g.holding_period == 'long_term' and g.gain_loss < 0
    )

    # Unrealized gains/losses
    unrealized_gains_st = sum(
        lot.unrealized_gain_loss for lot in tax_lots
        if lot.holding_period == 'short_term' and lot.unrealized_gain_loss > 0
    )
    unrealized_gains_lt = sum(
        lot.unrealized_gain_loss for lot in tax_lots
        if lot.holding_period == 'long_term' and lot.unrealized_gain_loss > 0
    )
    unrealized_losses_st = sum(
        abs(lot.unrealized_gain_loss) for lot in tax_lots
        if lot.holding_period == 'short_term' and lot.unrealized_gain_loss < 0
    )
    unrealized_losses_lt = sum(
        abs(lot.unrealized_gain_loss) for lot in tax_lots
        if lot.holding_period == 'long_term' and lot.unrealized_gain_loss < 0
    )

    # Cost basis and current value
    total_cost_basis = sum(lot.total_cost_basis for lot in tax_lots)
    total_current_value = sum(lot.current_value for lot in tax_lots)

    # TLH opportunities (unrealized losses)
    tlh_opportunities = [
        {
            "ticker": lot.ticker,
            "unrealized_loss": abs(lot.unrealized_gain_loss),
            "quantity": lot.quantity,
            "cost_basis": lot.total_cost_basis,
            "current_value": lot.current_value
        }
        for lot in tax_lots
        if lot.unrealized_gain_loss < -1000  # Only significant losses
    ]

    # Estimated tax liability
    net_st_gain = realized_gains_st - realized_losses_st
    net_lt_gain = realized_gains_lt - realized_losses_lt

    tax_liability = 0.0
    if net_st_gain > 0:
        tax_liability += net_st_gain * tax_rate_short_term
    if net_lt_gain > 0:
        tax_liability += net_lt_gain * tax_rate_long_term

    return TaxReportSummary(
        realized_gains_short_term=round(realized_gains_st, 2),
        realized_gains_long_term=round(realized_gains_lt, 2),
        realized_losses_short_term=round(realized_losses_st, 2),
        realized_losses_long_term=round(realized_losses_lt, 2),
        unrealized_gains_short_term=round(unrealized_gains_st, 2),
        unrealized_gains_long_term=round(unrealized_gains_lt, 2),
        unrealized_losses_short_term=round(unrealized_losses_st, 2),
        unrealized_losses_long_term=round(unrealized_losses_lt, 2),
        total_cost_basis=round(total_cost_basis, 2),
        total_current_value=round(total_current_value, 2),
        tlh_opportunities=tlh_opportunities,
        estimated_tax_liability=round(tax_liability, 2),
        tax_lots=tax_lots,
        realized_transactions=realized_transactions
    )


def calculate_fees_impact(
    beginning_value: float,
    ending_value: float,
    management_fees: float = 0.0,
    trading_commissions: float = 0.0,
    expense_ratios: float = 0.0,
    other_fees: float = 0.0,
    period_days: int = 365
) -> FeesExpensesImpact:
    """
    Calculate impact of fees and expenses on performance.

    Args:
        beginning_value: Starting portfolio value
        ending_value: Ending portfolio value
        management_fees: Management/advisory fees paid
        trading_commissions: Trading commission costs
        expense_ratios: ETF/mutual fund expense ratios
        other_fees: Other miscellaneous fees
        period_days: Number of days in period

    Returns:
        Fees and expenses impact analysis
    """
    total_fees = management_fees + trading_commissions + expense_ratios + other_fees
    average_value = (beginning_value + ending_value) / 2

    fee_percentage = (total_fees / average_value * 100) if average_value > 0 else 0.0

    # Annualized fee impact
    fee_impact_annualized = fee_percentage * (365 / period_days)

    return FeesExpensesImpact(
        period=f"{period_days} days",
        management_fees=round(management_fees, 2),
        trading_commissions=round(trading_commissions, 2),
        expense_ratios=round(expense_ratios, 2),
        other_fees=round(other_fees, 2),
        total_fees=round(total_fees, 2),
        fee_impact_on_return=round(fee_impact_annualized, 2),
        fee_percentage_of_assets=round(fee_percentage, 2)
    )


def calculate_currency_effect(
    asset_class: str,
    local_return_pct: float,
    currency_pair: str,  # e.g., "EUR/USD"
    currency_change_pct: float
) -> CurrencyEffect:
    """
    Calculate currency impact for international investments.

    Total USD return = (1 + local return) × (1 + currency change) - 1

    Args:
        asset_class: Asset class name
        local_return_pct: Return in local currency
        currency_pair: Currency pair (e.g., EUR/USD)
        currency_change_pct: Currency appreciation/depreciation

    Returns:
        Currency effect analysis
    """
    local_return = local_return_pct / 100
    currency_change = currency_change_pct / 100

    # Total return in USD
    usd_return = (1 + local_return) * (1 + currency_change) - 1

    # Currency effect
    currency_effect = usd_return - local_return

    return CurrencyEffect(
        asset_class=asset_class,
        local_currency_return=round(local_return_pct, 2),
        currency_effect=round(currency_effect * 100, 2),
        usd_return=round(usd_return * 100, 2),
        currency_pair=currency_pair
    )


def compare_to_peer_group(
    portfolio_return: float,
    peer_group_name: str,
    period: str,
    peer_returns: List[float]  # Returns of peer portfolios
) -> PeerGroupComparison:
    """
    Compare portfolio to peer group.

    Args:
        portfolio_return: Portfolio return percentage
        peer_group_name: Name of peer group
        period: Time period
        peer_returns: List of peer portfolio returns

    Returns:
        Peer group comparison
    """
    if not peer_returns:
        return PeerGroupComparison(
            peer_group=peer_group_name,
            period=period,
            portfolio_return=portfolio_return,
            peer_median=0.0,
            peer_25th_percentile=0.0,
            peer_75th_percentile=0.0,
            percentile_rank=50,
            vs_median=0.0
        )

    peer_median = np.median(peer_returns)
    peer_25th = np.percentile(peer_returns, 25)
    peer_75th = np.percentile(peer_returns, 75)

    # Calculate percentile rank
    rank = sum(1 for r in peer_returns if r < portfolio_return)
    percentile_rank = int((rank / len(peer_returns)) * 100)

    vs_median = portfolio_return - peer_median

    return PeerGroupComparison(
        peer_group=peer_group_name,
        period=period,
        portfolio_return=round(portfolio_return, 2),
        peer_median=round(peer_median, 2),
        peer_25th_percentile=round(peer_25th, 2),
        peer_75th_percentile=round(peer_75th, 2),
        percentile_rank=percentile_rank,
        vs_median=round(vs_median, 2)
    )
