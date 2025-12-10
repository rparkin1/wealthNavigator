"""
Net Worth Schema Definitions

Pydantic schemas for net worth API requests and responses.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import date


class AssetsByClass(BaseModel):
    """Asset breakdown by class"""
    cash: float = Field(0.0, description="Cash and cash equivalents")
    stocks: float = Field(0.0, description="Stock holdings")
    bonds: float = Field(0.0, description="Bond holdings")
    realEstate: float = Field(0.0, description="Real estate value")
    other: float = Field(0.0, description="Other assets")


class NetWorthDataPoint(BaseModel):
    """Single net worth data point"""
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    totalNetWorth: float = Field(..., description="Total net worth (assets - liabilities)")
    totalAssets: float = Field(..., description="Total asset value")
    totalLiabilities: float = Field(..., description="Total liabilities")
    liquidNetWorth: Optional[float] = Field(None, description="Liquid net worth (excluding illiquid assets)")
    assetsByClass: Optional[AssetsByClass] = Field(None, description="Asset breakdown by class")

    class Config:
        json_schema_extra = {
            "example": {
                "date": "2024-01-15",
                "totalNetWorth": 500000,
                "totalAssets": 750000,
                "totalLiabilities": 250000,
                "liquidNetWorth": 400000,
                "assetsByClass": {
                    "cash": 50000,
                    "stocks": 200000,
                    "bonds": 100000,
                    "realEstate": 350000,
                    "other": 50000,
                }
            }
        }


class NetWorthSummary(BaseModel):
    """Net worth summary statistics"""
    currentNetWorth: float = Field(..., description="Current net worth")
    change: float = Field(..., description="Absolute change over period")
    changePercent: float = Field(..., description="Percentage change over period")
    annualizedReturn: float = Field(..., description="Annualized return percentage")
    volatility: float = Field(..., description="Annualized volatility (standard deviation)")
    sharpeRatio: float = Field(..., description="Sharpe ratio (risk-adjusted return)")
    maxDrawdown: float = Field(..., description="Maximum drawdown percentage")

    class Config:
        json_schema_extra = {
            "example": {
                "currentNetWorth": 500000,
                "change": 50000,
                "changePercent": 11.11,
                "annualizedReturn": 10.5,
                "volatility": 15.2,
                "sharpeRatio": 0.42,
                "maxDrawdown": -8.5,
            }
        }


class NetWorthHistoryResponse(BaseModel):
    """Response containing historical net worth data"""
    dataPoints: list[NetWorthDataPoint] = Field(..., description="Historical net worth data points")
    summary: NetWorthSummary = Field(..., description="Summary statistics")

    class Config:
        json_schema_extra = {
            "example": {
                "dataPoints": [
                    {
                        "date": "2024-01-01",
                        "totalNetWorth": 450000,
                        "totalAssets": 700000,
                        "totalLiabilities": 250000,
                    },
                    {
                        "date": "2024-06-01",
                        "totalNetWorth": 500000,
                        "totalAssets": 750000,
                        "totalLiabilities": 250000,
                    },
                ],
                "summary": {
                    "currentNetWorth": 500000,
                    "change": 50000,
                    "changePercent": 11.11,
                    "annualizedReturn": 10.5,
                    "volatility": 15.2,
                    "sharpeRatio": 0.42,
                    "maxDrawdown": -8.5,
                }
            }
        }
