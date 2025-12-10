import pytest

from app.models.portfolio_db import Holding, SecurityType


def test_holding_security_type_normalized_to_enum():
    holding = Holding(
        account_id="account-1",
        ticker="QQQ",
        name="QQQ Option",
        security_type="OPTION",
        shares=1.0,
        cost_basis=100.0,
        current_value=110.0,
    )

    assert holding.security_type is SecurityType.OPTION
    assert holding.security_type.value == "option"


def test_holding_security_type_rejects_invalid_value():
    with pytest.raises(ValueError):
        Holding(
            account_id="account-1",
            ticker="XYZ",
            name="Invalid Security",
            security_type="crypto",
            shares=1.0,
            cost_basis=10.0,
            current_value=12.0,
        )
