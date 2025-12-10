"""
ESG (Environmental, Social, Governance) Screening Service
Implements ethical investing screens and ESG portfolio construction

REQ-PORT-011: Constraint definition (ESG/ethical screening)
"""

from typing import Dict, List, Optional, Set
from pydantic import BaseModel
from enum import Enum

from app.services.portfolio.asset_class_library import AssetClass, ASSET_CLASS_LIBRARY


class ESGCriteria(str, Enum):
    """ESG screening criteria"""
    # Environmental
    CLIMATE_CHANGE = "climate_change"
    RENEWABLE_ENERGY = "renewable_energy"
    CARBON_EMISSIONS = "carbon_emissions"
    WATER_CONSERVATION = "water_conservation"
    POLLUTION_PREVENTION = "pollution_prevention"

    # Social
    HUMAN_RIGHTS = "human_rights"
    LABOR_STANDARDS = "labor_standards"
    DIVERSITY_INCLUSION = "diversity_inclusion"
    COMMUNITY_RELATIONS = "community_relations"

    # Governance
    BOARD_INDEPENDENCE = "board_independence"
    EXECUTIVE_COMPENSATION = "executive_compensation"
    SHAREHOLDER_RIGHTS = "shareholder_rights"
    ANTI_CORRUPTION = "anti_corruption"


class ExclusionCriteria(str, Enum):
    """Asset class exclusions"""
    FOSSIL_FUELS = "fossil_fuels"
    TOBACCO = "tobacco"
    ALCOHOL = "alcohol"
    GAMBLING = "gambling"
    WEAPONS = "weapons"
    NUCLEAR_POWER = "nuclear_power"
    ANIMAL_TESTING = "animal_testing"
    ADULT_ENTERTAINMENT = "adult_entertainment"


class ESGRating(str, Enum):
    """ESG rating levels"""
    LEADER = "leader"  # Top 20%
    AVERAGE = "average"  # Middle 60%
    LAGGARD = "laggard"  # Bottom 20%
    NOT_RATED = "not_rated"


class ESGProfile(BaseModel):
    """Asset class ESG profile"""
    asset_code: str
    esg_rating: ESGRating = ESGRating.NOT_RATED
    environmental_score: Optional[float] = None  # 0-100
    social_score: Optional[float] = None  # 0-100
    governance_score: Optional[float] = None  # 0-100
    overall_score: Optional[float] = None  # 0-100
    exclusions: List[ExclusionCriteria] = []
    positive_screens: List[ESGCriteria] = []
    controversies: List[str] = []


class ESGConstraints(BaseModel):
    """User-defined ESG constraints"""
    required_criteria: List[ESGCriteria] = []
    exclusions: List[ExclusionCriteria] = []
    minimum_esg_rating: ESGRating = ESGRating.AVERAGE
    minimum_overall_score: Optional[float] = None  # 0-100
    allow_not_rated: bool = True


class ESGScreeningResult(BaseModel):
    """ESG screening result"""
    eligible_assets: List[str]
    excluded_assets: Dict[str, str]  # {asset_code: reason}
    portfolio_esg_score: float
    recommendations: List[str]


# ESG profiles for asset classes in library
# In production, this would come from MSCI ESG, Sustainalytics, or other data providers
ESG_PROFILES: Dict[str, ESGProfile] = {
    # ESG-specific funds (high ratings)
    "US_ESG": ESGProfile(
        asset_code="US_ESG",
        esg_rating=ESGRating.LEADER,
        environmental_score=85,
        social_score=82,
        governance_score=88,
        overall_score=85,
        positive_screens=[
            ESGCriteria.CLIMATE_CHANGE,
            ESGCriteria.RENEWABLE_ENERGY,
            ESGCriteria.DIVERSITY_INCLUSION,
            ESGCriteria.BOARD_INDEPENDENCE
        ]
    ),
    "INTL_ESG": ESGProfile(
        asset_code="INTL_ESG",
        esg_rating=ESGRating.LEADER,
        environmental_score=83,
        social_score=80,
        governance_score=85,
        overall_score=83,
        positive_screens=[
            ESGCriteria.CLIMATE_CHANGE,
            ESGCriteria.RENEWABLE_ENERGY,
            ESGCriteria.HUMAN_RIGHTS
        ]
    ),
    "GREEN_BOND": ESGProfile(
        asset_code="GREEN_BOND",
        esg_rating=ESGRating.LEADER,
        environmental_score=95,
        social_score=75,
        governance_score=80,
        overall_score=85,
        positive_screens=[
            ESGCriteria.CLIMATE_CHANGE,
            ESGCriteria.RENEWABLE_ENERGY,
            ESGCriteria.POLLUTION_PREVENTION
        ]
    ),

    # Broad market funds (average ratings)
    "US_LC_BLEND": ESGProfile(
        asset_code="US_LC_BLEND",
        esg_rating=ESGRating.AVERAGE,
        environmental_score=62,
        social_score=65,
        governance_score=70,
        overall_score=65
    ),
    "US_MC_BLEND": ESGProfile(
        asset_code="US_MC_BLEND",
        esg_rating=ESGRating.AVERAGE,
        environmental_score=60,
        social_score=62,
        governance_score=68,
        overall_score=63
    ),
    "INTL_DEV_BLEND": ESGProfile(
        asset_code="INTL_DEV_BLEND",
        esg_rating=ESGRating.AVERAGE,
        environmental_score=64,
        social_score=68,
        governance_score=72,
        overall_score=68
    ),

    # Energy / Fossil fuels (low environmental scores)
    "ENERGY": ESGProfile(
        asset_code="ENERGY",
        esg_rating=ESGRating.LAGGARD,
        environmental_score=35,
        social_score=55,
        governance_score=60,
        overall_score=45,
        exclusions=[ExclusionCriteria.FOSSIL_FUELS],
        controversies=["High carbon emissions", "Environmental damage risks"]
    ),

    # REITs (average, some environmental concerns)
    "US_REIT": ESGProfile(
        asset_code="US_REIT",
        esg_rating=ESGRating.AVERAGE,
        environmental_score=58,
        social_score=65,
        governance_score=68,
        overall_score=63
    ),

    # Bonds (generally average)
    "US_TREASURY_INTER": ESGProfile(
        asset_code="US_TREASURY_INTER",
        esg_rating=ESGRating.NOT_RATED,
        overall_score=None
    ),
    "US_CORP_IG": ESGProfile(
        asset_code="US_CORP_IG",
        esg_rating=ESGRating.AVERAGE,
        environmental_score=60,
        social_score=63,
        governance_score=70,
        overall_score=64
    ),

    # Emerging markets (lower governance scores)
    "EM_BLEND": ESGProfile(
        asset_code="EM_BLEND",
        esg_rating=ESGRating.AVERAGE,
        environmental_score=52,
        social_score=55,
        governance_score=58,
        overall_score=55,
        controversies=["Variable governance standards", "Labor rights concerns in some regions"]
    ),

    # Cash (not rated)
    "CASH": ESGProfile(
        asset_code="CASH",
        esg_rating=ESGRating.NOT_RATED,
        overall_score=None
    ),
}


class ESGScreener:
    """ESG screening service"""

    def __init__(self):
        self.esg_profiles = ESG_PROFILES

    def screen_assets(
        self,
        asset_codes: List[str],
        constraints: ESGConstraints
    ) -> ESGScreeningResult:
        """
        Screen asset classes based on ESG constraints.

        REQ-PORT-011: Constraint definition (ESG/ethical screening)

        Args:
            asset_codes: List of asset codes to screen
            constraints: ESG constraints to apply

        Returns:
            Screening result with eligible assets
        """
        eligible_assets = []
        excluded_assets = {}

        for asset_code in asset_codes:
            # Get ESG profile
            profile = self.esg_profiles.get(asset_code, ESGProfile(asset_code=asset_code))

            # Check if asset passes screening
            passes, reason = self._check_asset_eligibility(profile, constraints)

            if passes:
                eligible_assets.append(asset_code)
            else:
                excluded_assets[asset_code] = reason

        # Calculate portfolio ESG score
        portfolio_esg_score = self._calculate_portfolio_esg_score(eligible_assets)

        # Generate recommendations
        recommendations = self._generate_esg_recommendations(
            eligible_assets,
            excluded_assets,
            constraints
        )

        return ESGScreeningResult(
            eligible_assets=eligible_assets,
            excluded_assets=excluded_assets,
            portfolio_esg_score=portfolio_esg_score,
            recommendations=recommendations
        )

    def _check_asset_eligibility(
        self,
        profile: ESGProfile,
        constraints: ESGConstraints
    ) -> tuple[bool, str]:
        """
        Check if an asset passes ESG screening.

        Returns:
            (passes: bool, reason: str)
        """
        # Check exclusions
        for exclusion in constraints.exclusions:
            if exclusion in profile.exclusions:
                return False, f"Excluded: {exclusion.value}"

        # Check minimum ESG rating
        rating_order = {
            ESGRating.LEADER: 3,
            ESGRating.AVERAGE: 2,
            ESGRating.LAGGARD: 1,
            ESGRating.NOT_RATED: 0
        }

        required_rating = rating_order.get(constraints.minimum_esg_rating, 0)
        asset_rating = rating_order.get(profile.esg_rating, 0)

        if profile.esg_rating == ESGRating.NOT_RATED:
            if not constraints.allow_not_rated:
                return False, "Not rated (ratings required)"
        elif asset_rating < required_rating:
            return False, f"ESG rating {profile.esg_rating.value} below minimum {constraints.minimum_esg_rating.value}"

        # Check minimum overall score
        if constraints.minimum_overall_score is not None and profile.overall_score is not None:
            if profile.overall_score < constraints.minimum_overall_score:
                return False, f"ESG score {profile.overall_score} below minimum {constraints.minimum_overall_score}"

        # Check required criteria
        if constraints.required_criteria:
            for criteria in constraints.required_criteria:
                if criteria not in profile.positive_screens:
                    return False, f"Missing required criteria: {criteria.value}"

        return True, ""

    def _calculate_portfolio_esg_score(self, eligible_assets: List[str]) -> float:
        """Calculate weighted average ESG score for portfolio."""
        if not eligible_assets:
            return 0.0

        scores = []
        for asset_code in eligible_assets:
            profile = self.esg_profiles.get(asset_code)
            if profile and profile.overall_score is not None:
                scores.append(profile.overall_score)

        if not scores:
            return 0.0

        return sum(scores) / len(scores)

    def _generate_esg_recommendations(
        self,
        eligible_assets: List[str],
        excluded_assets: Dict[str, str],
        constraints: ESGConstraints
    ) -> List[str]:
        """Generate ESG recommendations."""
        recommendations = []

        if not eligible_assets:
            recommendations.append(
                "⚠️ No assets meet your ESG criteria. Consider relaxing constraints."
            )
            return recommendations

        if len(excluded_assets) > len(eligible_assets):
            recommendations.append(
                f"ℹ️ {len(excluded_assets)} assets excluded due to ESG criteria. "
                f"This may limit diversification."
            )

        # Check if high-ESG alternatives are available
        high_esg_assets = [
            asset for asset in eligible_assets
            if self.esg_profiles.get(asset, ESGProfile(asset_code=asset)).esg_rating == ESGRating.LEADER
        ]

        if high_esg_assets:
            recommendations.append(
                f"✅ {len(high_esg_assets)} leader-rated ESG assets available: {', '.join(high_esg_assets[:3])}"
            )

        # Suggest green bonds if not included
        if "GREEN_BOND" not in eligible_assets and "GREEN_BOND" not in excluded_assets:
            recommendations.append(
                "💚 Consider adding GREEN_BOND for high environmental impact"
            )

        # Check for controversies
        controversial_assets = [
            asset for asset in eligible_assets
            if self.esg_profiles.get(asset, ESGProfile(asset_code=asset)).controversies
        ]

        if controversial_assets:
            recommendations.append(
                f"⚠️ {len(controversial_assets)} assets have ESG controversies. "
                f"Review before investing: {', '.join(controversial_assets[:3])}"
            )

        if not recommendations:
            recommendations.append("✅ Portfolio meets all ESG criteria")

        return recommendations

    def get_asset_esg_details(self, asset_code: str) -> Optional[ESGProfile]:
        """Get detailed ESG profile for an asset."""
        return self.esg_profiles.get(asset_code)

    def compare_assets_esg(self, asset_codes: List[str]) -> Dict[str, any]:
        """Compare ESG profiles of multiple assets."""
        comparison = {
            "assets": [],
            "best_environmental": None,
            "best_social": None,
            "best_governance": None,
            "best_overall": None
        }

        best_env_score = 0
        best_soc_score = 0
        best_gov_score = 0
        best_overall_score = 0

        for asset_code in asset_codes:
            profile = self.esg_profiles.get(asset_code)
            if not profile:
                continue

            asset_info = {
                "code": asset_code,
                "rating": profile.esg_rating.value if profile.esg_rating else None,
                "environmental": profile.environmental_score,
                "social": profile.social_score,
                "governance": profile.governance_score,
                "overall": profile.overall_score,
                "exclusions": [e.value for e in profile.exclusions],
                "controversies": profile.controversies
            }
            comparison["assets"].append(asset_info)

            # Track best scores
            if profile.environmental_score and profile.environmental_score > best_env_score:
                best_env_score = profile.environmental_score
                comparison["best_environmental"] = asset_code

            if profile.social_score and profile.social_score > best_soc_score:
                best_soc_score = profile.social_score
                comparison["best_social"] = asset_code

            if profile.governance_score and profile.governance_score > best_gov_score:
                best_gov_score = profile.governance_score
                comparison["best_governance"] = asset_code

            if profile.overall_score and profile.overall_score > best_overall_score:
                best_overall_score = profile.overall_score
                comparison["best_overall"] = asset_code

        return comparison


def create_esg_preset(preset_name: str) -> ESGConstraints:
    """
    Create predefined ESG constraint presets.

    Args:
        preset_name: Preset name (conservative, moderate, aggressive, custom)

    Returns:
        ESG constraints
    """
    presets = {
        "conservative": ESGConstraints(
            exclusions=[
                ExclusionCriteria.FOSSIL_FUELS,
                ExclusionCriteria.TOBACCO,
                ExclusionCriteria.WEAPONS,
                ExclusionCriteria.GAMBLING,
                ExclusionCriteria.ADULT_ENTERTAINMENT
            ],
            minimum_esg_rating=ESGRating.LEADER,
            minimum_overall_score=75,
            allow_not_rated=False
        ),
        "moderate": ESGConstraints(
            exclusions=[
                ExclusionCriteria.TOBACCO,
                ExclusionCriteria.WEAPONS
            ],
            minimum_esg_rating=ESGRating.AVERAGE,
            minimum_overall_score=60,
            allow_not_rated=True
        ),
        "light": ESGConstraints(
            exclusions=[ExclusionCriteria.TOBACCO],
            minimum_esg_rating=ESGRating.AVERAGE,
            allow_not_rated=True
        ),
        "none": ESGConstraints(
            exclusions=[],
            minimum_esg_rating=ESGRating.LAGGARD,
            allow_not_rated=True
        )
    }

    return presets.get(preset_name.lower(), presets["none"])


# Example usage and testing
if __name__ == "__main__":
    screener = ESGScreener()

    # Test conservative screening
    all_assets = list(ASSET_CLASS_LIBRARY.keys())[:20]  # First 20 assets

    print("ESG Screening Example\n")
    print(f"Testing {len(all_assets)} assets with CONSERVATIVE ESG constraints\n")

    constraints = create_esg_preset("conservative")
    result = screener.screen_assets(all_assets, constraints)

    print(f"✅ Eligible Assets: {len(result.eligible_assets)}")
    for asset in result.eligible_assets[:5]:
        print(f"   - {asset}")

    print(f"\n❌ Excluded Assets: {len(result.excluded_assets)}")
    for asset, reason in list(result.excluded_assets.items())[:5]:
        print(f"   - {asset}: {reason}")

    print(f"\n📊 Portfolio ESG Score: {result.portfolio_esg_score:.1f}/100")

    print("\n💡 Recommendations:")
    for rec in result.recommendations:
        print(f"   {rec}")
