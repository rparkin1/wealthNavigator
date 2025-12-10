"""
Diversification Analysis Service
Comprehensive portfolio diversification metrics and concentration risk identification

REQ-RISK-008: Diversification metrics
REQ-RISK-009: Concentration risk identification
REQ-RISK-010: Diversification recommendations
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel
from collections import defaultdict


class HoldingInfo(BaseModel):
    """Individual holding information"""
    symbol: str
    name: str
    value: float
    weight: float
    asset_class: str
    sector: Optional[str] = None
    industry: Optional[str] = None
    geography: Optional[str] = None  # US, International_Developed, Emerging_Markets, etc.
    manager: Optional[str] = None  # Fund manager or ETF provider


class DiversificationMetrics(BaseModel):
    """Comprehensive diversification metrics (REQ-RISK-008)"""
    # Holdings count
    total_holdings: int
    effective_holdings: float  # Effective number of securities (1/HHI)

    # Concentration metrics
    top_1_concentration: float  # % in largest holding
    top_5_concentration: float  # % in top 5 holdings
    top_10_concentration: float  # % in top 10 holdings
    herfindahl_index: float  # HHI (sum of squared weights)

    # Diversification by dimension
    asset_class_count: int
    sector_count: int
    industry_count: int
    geography_count: int
    manager_count: int

    # Effective diversification (1/HHI) by dimension
    effective_asset_classes: float
    effective_sectors: float
    effective_industries: float
    effective_geographies: float

    # Overall diversification score (0-100, higher = better)
    diversification_score: float
    diversification_level: str  # poor, fair, good, excellent


class ConcentrationRisk(BaseModel):
    """Concentration risk identification (REQ-RISK-009)"""
    risk_type: str  # security, sector, industry, geography, asset_class, manager
    risk_level: str  # low, medium, high, critical
    concentration_pct: float  # Percentage concentration
    details: str  # Description of the risk
    affected_holdings: List[str]  # List of symbols/names involved


class DiversificationRecommendation(BaseModel):
    """Diversification improvement recommendation (REQ-RISK-010)"""
    recommendation_type: str  # reallocation, addition, reduction
    priority: str  # high, medium, low
    description: str
    suggested_action: str
    expected_impact: str  # Impact on diversification score
    alternative_investments: List[str]  # Suggested alternatives


class DiversificationAnalysisResult(BaseModel):
    """Complete diversification analysis result"""
    portfolio_value: float
    metrics: DiversificationMetrics
    concentration_risks: List[ConcentrationRisk]
    recommendations: List[DiversificationRecommendation]

    # Breakdown by dimension
    asset_class_breakdown: Dict[str, float]
    sector_breakdown: Dict[str, float]
    industry_breakdown: Dict[str, float]
    geography_breakdown: Dict[str, float]
    manager_breakdown: Dict[str, float]

    # Top holdings
    top_10_holdings: List[HoldingInfo]


class DiversificationAnalysisService:
    """Service for analyzing portfolio diversification"""

    # Thresholds for concentration risk
    CRITICAL_SINGLE_HOLDING = 0.25  # 25% in one holding
    HIGH_SINGLE_HOLDING = 0.15  # 15% in one holding
    MEDIUM_SINGLE_HOLDING = 0.10  # 10% in one holding

    CRITICAL_TOP5 = 0.60  # 60% in top 5
    HIGH_TOP5 = 0.50  # 50% in top 5

    CRITICAL_SECTOR = 0.40  # 40% in one sector
    HIGH_SECTOR = 0.30  # 30% in one sector

    CRITICAL_GEOGRAPHY = 0.80  # 80% in one geography
    HIGH_GEOGRAPHY = 0.70  # 70% in one geography

    def analyze_diversification(
        self,
        portfolio_value: float,
        holdings: List[HoldingInfo]
    ) -> DiversificationAnalysisResult:
        """
        Perform comprehensive diversification analysis

        Args:
            portfolio_value: Total portfolio value
            holdings: List of individual holdings with details

        Returns:
            Complete diversification analysis with metrics, risks, and recommendations
        """
        # Calculate diversification metrics
        metrics = self._calculate_metrics(holdings)

        # Identify concentration risks
        concentration_risks = self._identify_concentration_risks(holdings)

        # Generate recommendations
        recommendations = self._generate_recommendations(
            metrics, concentration_risks, holdings
        )

        # Calculate breakdowns
        asset_class_breakdown = self._calculate_breakdown(holdings, 'asset_class')
        sector_breakdown = self._calculate_breakdown(holdings, 'sector')
        industry_breakdown = self._calculate_breakdown(holdings, 'industry')
        geography_breakdown = self._calculate_breakdown(holdings, 'geography')
        manager_breakdown = self._calculate_breakdown(holdings, 'manager')

        # Get top 10 holdings
        sorted_holdings = sorted(holdings, key=lambda h: h.weight, reverse=True)
        top_10_holdings = sorted_holdings[:10]

        return DiversificationAnalysisResult(
            portfolio_value=portfolio_value,
            metrics=metrics,
            concentration_risks=concentration_risks,
            recommendations=recommendations,
            asset_class_breakdown=asset_class_breakdown,
            sector_breakdown=sector_breakdown,
            industry_breakdown=industry_breakdown,
            geography_breakdown=geography_breakdown,
            manager_breakdown=manager_breakdown,
            top_10_holdings=top_10_holdings
        )

    def _calculate_metrics(self, holdings: List[HoldingInfo]) -> DiversificationMetrics:
        """Calculate comprehensive diversification metrics (REQ-RISK-008)"""
        # Sort by weight
        sorted_holdings = sorted(holdings, key=lambda h: h.weight, reverse=True)

        # Holdings count
        total_holdings = len(holdings)

        # Calculate HHI
        hhi = sum(h.weight ** 2 for h in holdings)
        effective_holdings = 1 / hhi if hhi > 0 else 0

        # Top N concentration
        top_1_concentration = sorted_holdings[0].weight if len(sorted_holdings) >= 1 else 0
        top_5_concentration = sum(h.weight for h in sorted_holdings[:5])
        top_10_concentration = sum(h.weight for h in sorted_holdings[:10])

        # Count unique dimensions
        asset_class_count = len(set(h.asset_class for h in holdings))
        sector_count = len(set(h.sector for h in holdings if h.sector))
        industry_count = len(set(h.industry for h in holdings if h.industry))
        geography_count = len(set(h.geography for h in holdings if h.geography))
        manager_count = len(set(h.manager for h in holdings if h.manager))

        # Effective diversification by dimension
        effective_asset_classes = self._calculate_effective_number(holdings, 'asset_class')
        effective_sectors = self._calculate_effective_number(holdings, 'sector')
        effective_industries = self._calculate_effective_number(holdings, 'industry')
        effective_geographies = self._calculate_effective_number(holdings, 'geography')

        # Overall diversification score (0-100)
        diversification_score = self._calculate_diversification_score(
            total_holdings,
            effective_holdings,
            top_10_concentration,
            effective_asset_classes,
            effective_sectors,
            effective_geographies
        )

        # Diversification level
        diversification_level = self._determine_diversification_level(diversification_score)

        return DiversificationMetrics(
            total_holdings=total_holdings,
            effective_holdings=round(effective_holdings, 2),
            top_1_concentration=round(top_1_concentration, 4),
            top_5_concentration=round(top_5_concentration, 4),
            top_10_concentration=round(top_10_concentration, 4),
            herfindahl_index=round(hhi, 4),
            asset_class_count=asset_class_count,
            sector_count=sector_count,
            industry_count=industry_count,
            geography_count=geography_count,
            manager_count=manager_count,
            effective_asset_classes=round(effective_asset_classes, 2),
            effective_sectors=round(effective_sectors, 2),
            effective_industries=round(effective_industries, 2),
            effective_geographies=round(effective_geographies, 2),
            diversification_score=round(diversification_score, 1),
            diversification_level=diversification_level
        )

    def _identify_concentration_risks(
        self, holdings: List[HoldingInfo]
    ) -> List[ConcentrationRisk]:
        """Identify concentration risks (REQ-RISK-009)"""
        risks = []

        # 1. Single security concentration
        for holding in holdings:
            if holding.weight >= self.CRITICAL_SINGLE_HOLDING:
                risks.append(ConcentrationRisk(
                    risk_type="security",
                    risk_level="critical",
                    concentration_pct=round(holding.weight, 4),
                    details=f"Critical concentration in {holding.name} ({holding.symbol})",
                    affected_holdings=[holding.symbol]
                ))
            elif holding.weight >= self.HIGH_SINGLE_HOLDING:
                risks.append(ConcentrationRisk(
                    risk_type="security",
                    risk_level="high",
                    concentration_pct=round(holding.weight, 4),
                    details=f"High concentration in {holding.name} ({holding.symbol})",
                    affected_holdings=[holding.symbol]
                ))
            elif holding.weight >= self.MEDIUM_SINGLE_HOLDING:
                risks.append(ConcentrationRisk(
                    risk_type="security",
                    risk_level="medium",
                    concentration_pct=round(holding.weight, 4),
                    details=f"Moderate concentration in {holding.name} ({holding.symbol})",
                    affected_holdings=[holding.symbol]
                ))

        # 2. Sector concentration
        sector_concentration = self._calculate_breakdown(holdings, 'sector')
        for sector, weight in sector_concentration.items():
            if weight >= self.CRITICAL_SECTOR:
                sector_holdings = [h.symbol for h in holdings if h.sector == sector]
                risks.append(ConcentrationRisk(
                    risk_type="sector",
                    risk_level="critical",
                    concentration_pct=round(weight, 4),
                    details=f"Critical sector concentration in {sector}",
                    affected_holdings=sector_holdings
                ))
            elif weight >= self.HIGH_SECTOR:
                sector_holdings = [h.symbol for h in holdings if h.sector == sector]
                risks.append(ConcentrationRisk(
                    risk_type="sector",
                    risk_level="high",
                    concentration_pct=round(weight, 4),
                    details=f"High sector concentration in {sector}",
                    affected_holdings=sector_holdings
                ))

        # 3. Industry concentration (similar to sector but more granular)
        industry_concentration = self._calculate_breakdown(holdings, 'industry')
        for industry, weight in industry_concentration.items():
            if weight >= self.CRITICAL_SECTOR:  # Same threshold as sector
                industry_holdings = [h.symbol for h in holdings if h.industry == industry]
                risks.append(ConcentrationRisk(
                    risk_type="industry",
                    risk_level="critical",
                    concentration_pct=round(weight, 4),
                    details=f"Critical industry concentration in {industry}",
                    affected_holdings=industry_holdings
                ))

        # 4. Geographic concentration
        geography_concentration = self._calculate_breakdown(holdings, 'geography')
        for geography, weight in geography_concentration.items():
            if weight >= self.CRITICAL_GEOGRAPHY:
                geo_holdings = [h.symbol for h in holdings if h.geography == geography]
                risks.append(ConcentrationRisk(
                    risk_type="geography",
                    risk_level="critical",
                    concentration_pct=round(weight, 4),
                    details=f"Critical geographic concentration in {geography}",
                    affected_holdings=geo_holdings
                ))
            elif weight >= self.HIGH_GEOGRAPHY:
                geo_holdings = [h.symbol for h in holdings if h.geography == geography]
                risks.append(ConcentrationRisk(
                    risk_type="geography",
                    risk_level="high",
                    concentration_pct=round(weight, 4),
                    details=f"High geographic concentration in {geography}",
                    affected_holdings=geo_holdings
                ))

        # 5. Asset class concentration
        asset_class_concentration = self._calculate_breakdown(holdings, 'asset_class')
        for asset_class, weight in asset_class_concentration.items():
            if weight >= 0.85:  # 85% in one asset class
                ac_holdings = [h.symbol for h in holdings if h.asset_class == asset_class]
                risks.append(ConcentrationRisk(
                    risk_type="asset_class",
                    risk_level="high",
                    concentration_pct=round(weight, 4),
                    details=f"High asset class concentration in {asset_class}",
                    affected_holdings=ac_holdings
                ))

        # 6. Manager/fund concentration
        manager_concentration = self._calculate_breakdown(holdings, 'manager')
        for manager, weight in manager_concentration.items():
            if weight >= 0.40:  # 40% with one manager
                mgr_holdings = [h.symbol for h in holdings if h.manager == manager]
                risks.append(ConcentrationRisk(
                    risk_type="manager",
                    risk_level="high",
                    concentration_pct=round(weight, 4),
                    details=f"High manager concentration with {manager}",
                    affected_holdings=mgr_holdings
                ))

        # Sort by severity and concentration
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        risks.sort(key=lambda r: (severity_order.get(r.risk_level, 4), -r.concentration_pct))

        return risks

    def _generate_recommendations(
        self,
        metrics: DiversificationMetrics,
        risks: List[ConcentrationRisk],
        holdings: List[HoldingInfo]
    ) -> List[DiversificationRecommendation]:
        """Generate diversification improvement recommendations (REQ-RISK-010)"""
        recommendations = []

        # 1. Address critical and high concentration risks
        critical_risks = [r for r in risks if r.risk_level in ["critical", "high"]]

        for risk in critical_risks:
            if risk.risk_type == "security":
                recommendations.append(DiversificationRecommendation(
                    recommendation_type="reduction",
                    priority="high",
                    description=f"Reduce concentration in {risk.affected_holdings[0]}",
                    suggested_action=f"Reduce position from {risk.concentration_pct:.1%} to below 10%",
                    expected_impact="Improve security diversification by reducing single-holding risk",
                    alternative_investments=[
                        "Broad market index ETF (VTI, ITOT)",
                        "Sector-specific ETFs to maintain exposure while diversifying"
                    ]
                ))

            elif risk.risk_type == "sector":
                recommendations.append(DiversificationRecommendation(
                    recommendation_type="reallocation",
                    priority="high",
                    description=f"Reduce sector concentration in {risk.details.split('in ')[1]}",
                    suggested_action=f"Reallocate from {risk.concentration_pct:.1%} to below 25%",
                    expected_impact="Improve sector diversification and reduce sector-specific risk",
                    alternative_investments=[
                        "Underweight sectors (identify from sector breakdown)",
                        "Broad market ETFs for balanced sector exposure"
                    ]
                ))

            elif risk.risk_type == "geography":
                recommendations.append(DiversificationRecommendation(
                    recommendation_type="addition",
                    priority="high",
                    description="Increase international diversification",
                    suggested_action=f"Add international exposure (currently {risk.concentration_pct:.1%} domestic)",
                    expected_impact="Reduce geographic concentration and currency risk",
                    alternative_investments=[
                        "International developed markets (VEA, IEFA)",
                        "Emerging markets (VWO, IEMG)",
                        "Global real estate (VNQI)"
                    ]
                ))

        # 2. General diversification improvements
        if metrics.total_holdings < 10:
            recommendations.append(DiversificationRecommendation(
                recommendation_type="addition",
                priority="medium",
                description="Increase number of holdings for better diversification",
                suggested_action=f"Add holdings (currently {metrics.total_holdings}, target: 15-30)",
                expected_impact="Improve effective diversification and reduce idiosyncratic risk",
                alternative_investments=[
                    "Broad market ETFs (instant diversification)",
                    "Target-date funds",
                    "Multi-asset class funds"
                ]
            ))

        if metrics.effective_asset_classes < 3:
            recommendations.append(DiversificationRecommendation(
                recommendation_type="addition",
                priority="medium",
                description="Diversify across more asset classes",
                suggested_action="Add uncorrelated asset classes (bonds, REITs, commodities)",
                expected_impact="Reduce portfolio volatility through low-correlation assets",
                alternative_investments=[
                    "Investment-grade bonds (BND, AGG)",
                    "REITs (VNQ, SCHH)",
                    "Commodities (DBC, GSG)",
                    "International bonds (BNDX)"
                ]
            ))

        if metrics.effective_sectors < 5 and metrics.sector_count > 0:
            recommendations.append(DiversificationRecommendation(
                recommendation_type="reallocation",
                priority="medium",
                description="Balance sector allocation",
                suggested_action="Increase exposure to underweight sectors",
                expected_impact="Reduce sector-specific risk and capture broader market returns",
                alternative_investments=[
                    "Sector ETFs for underweight sectors",
                    "Broad market ETFs for automatic sector balance"
                ]
            ))

        # 3. Positive reinforcement if well-diversified
        if metrics.diversification_score >= 75 and len(critical_risks) == 0:
            recommendations.append(DiversificationRecommendation(
                recommendation_type="reallocation",
                priority="low",
                description="Portfolio is well-diversified - maintain current strategy",
                suggested_action="Continue monitoring and rebalancing quarterly",
                expected_impact="Maintain strong diversification profile",
                alternative_investments=[]
            ))

        return recommendations

    def _calculate_breakdown(
        self, holdings: List[HoldingInfo], attribute: str
    ) -> Dict[str, float]:
        """Calculate weight breakdown by attribute"""
        breakdown = defaultdict(float)
        for holding in holdings:
            value = getattr(holding, attribute, None)
            if value:
                breakdown[value] += holding.weight
        return dict(breakdown)

    def _calculate_effective_number(
        self, holdings: List[HoldingInfo], attribute: str
    ) -> float:
        """Calculate effective number of categories (1/HHI) for an attribute"""
        breakdown = self._calculate_breakdown(holdings, attribute)
        if not breakdown:
            return 0.0
        hhi = sum(weight ** 2 for weight in breakdown.values())
        return 1 / hhi if hhi > 0 else 0.0

    def _calculate_diversification_score(
        self,
        total_holdings: int,
        effective_holdings: float,
        top_10_concentration: float,
        effective_asset_classes: float,
        effective_sectors: float,
        effective_geographies: float
    ) -> float:
        """Calculate overall diversification score (0-100)"""
        # Component scores

        # Holdings score (0-30 points)
        holdings_score = min(30, (effective_holdings / 20) * 30)  # Target: 20+ effective holdings

        # Concentration score (0-25 points) - inverse of top 10 concentration
        concentration_score = max(0, (1 - top_10_concentration) * 25)

        # Asset class score (0-20 points)
        asset_class_score = min(20, (effective_asset_classes / 5) * 20)  # Target: 5+ asset classes

        # Sector score (0-15 points)
        sector_score = min(15, (effective_sectors / 8) * 15)  # Target: 8+ sectors

        # Geography score (0-10 points)
        geography_score = min(10, (effective_geographies / 3) * 10)  # Target: 3+ geographies

        total_score = (
            holdings_score +
            concentration_score +
            asset_class_score +
            sector_score +
            geography_score
        )

        return min(100, max(0, total_score))

    def _determine_diversification_level(self, score: float) -> str:
        """Determine diversification level from score"""
        if score >= 80:
            return "excellent"
        elif score >= 60:
            return "good"
        elif score >= 40:
            return "fair"
        else:
            return "poor"
