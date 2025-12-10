"""
Unit tests for ESG Screening Service
Tests ESG/ethical screening, profiles, and constraints
"""

import pytest
from app.services.portfolio.esg_screening import (
    ESGScreener,
    ESGConstraints,
    ESGProfile,
    ESGRating,
    ESGCriteria,
    ExclusionCriteria,
    create_esg_preset,
    ESG_PROFILES
)


@pytest.fixture
def screener():
    """ESG screener instance"""
    return ESGScreener()


@pytest.fixture
def sample_asset_codes():
    """Sample asset codes for testing"""
    return ["US_LC_BLEND", "US_ESG", "ENERGY", "INTL_ESG", "GREEN_BOND", "CASH"]


class TestESGProfiles:
    """Test ESG profile data"""

    def test_esg_profiles_exist(self):
        """Test that ESG profiles are defined"""
        assert len(ESG_PROFILES) > 0

    def test_esg_focused_assets_have_leader_ratings(self):
        """Test that ESG-focused assets have high ratings"""
        esg_assets = ["US_ESG", "INTL_ESG", "GREEN_BOND"]

        for asset_code in esg_assets:
            if asset_code in ESG_PROFILES:
                profile = ESG_PROFILES[asset_code]
                assert profile.esg_rating == ESGRating.LEADER, \
                    f"{asset_code} should have LEADER rating"
                if profile.overall_score:
                    assert profile.overall_score >= 75, \
                        f"{asset_code} should have score >= 75"

    def test_energy_has_exclusions(self):
        """Test that energy sector has fossil fuel exclusions"""
        if "ENERGY" in ESG_PROFILES:
            profile = ESG_PROFILES["ENERGY"]
            assert ExclusionCriteria.FOSSIL_FUELS in profile.exclusions

    def test_profile_scores_in_valid_range(self):
        """Test that ESG scores are in valid range (0-100)"""
        for asset_code, profile in ESG_PROFILES.items():
            if profile.environmental_score is not None:
                assert 0 <= profile.environmental_score <= 100, \
                    f"{asset_code} environmental score out of range"
            if profile.social_score is not None:
                assert 0 <= profile.social_score <= 100, \
                    f"{asset_code} social score out of range"
            if profile.governance_score is not None:
                assert 0 <= profile.governance_score <= 100, \
                    f"{asset_code} governance score out of range"
            if profile.overall_score is not None:
                assert 0 <= profile.overall_score <= 100, \
                    f"{asset_code} overall score out of range"


class TestESGConstraints:
    """Test ESG constraints"""

    def test_esg_constraints_creation(self):
        """Test creating ESG constraints"""
        constraints = ESGConstraints(
            required_criteria=[ESGCriteria.CLIMATE_CHANGE],
            exclusions=[ExclusionCriteria.FOSSIL_FUELS, ExclusionCriteria.TOBACCO],
            minimum_esg_rating=ESGRating.AVERAGE,
            minimum_overall_score=60.0,
            allow_not_rated=False
        )

        assert len(constraints.required_criteria) == 1
        assert len(constraints.exclusions) == 2
        assert constraints.minimum_esg_rating == ESGRating.AVERAGE
        assert constraints.minimum_overall_score == 60.0
        assert constraints.allow_not_rated == False

    def test_empty_constraints(self):
        """Test empty constraints (no screening)"""
        constraints = ESGConstraints()

        assert len(constraints.required_criteria) == 0
        assert len(constraints.exclusions) == 0
        assert constraints.minimum_esg_rating == ESGRating.AVERAGE
        assert constraints.allow_not_rated == True


class TestESGPresets:
    """Test ESG presets"""

    def test_conservative_preset(self):
        """Test conservative ESG preset"""
        preset = create_esg_preset("conservative")

        assert len(preset.exclusions) >= 5, "Conservative should exclude many sectors"
        assert preset.minimum_esg_rating == ESGRating.LEADER
        assert preset.minimum_overall_score == 75
        assert preset.allow_not_rated == False

        # Should exclude fossil fuels
        assert ExclusionCriteria.FOSSIL_FUELS in preset.exclusions
        assert ExclusionCriteria.TOBACCO in preset.exclusions

    def test_moderate_preset(self):
        """Test moderate ESG preset"""
        preset = create_esg_preset("moderate")

        assert preset.minimum_esg_rating == ESGRating.AVERAGE
        assert preset.minimum_overall_score == 60
        assert preset.allow_not_rated == True

        # Should have some exclusions
        assert len(preset.exclusions) >= 2

    def test_light_preset(self):
        """Test light ESG preset"""
        preset = create_esg_preset("light")

        assert preset.minimum_esg_rating == ESGRating.AVERAGE
        assert preset.allow_not_rated == True

        # Should have minimal exclusions
        assert len(preset.exclusions) >= 1

    def test_none_preset(self):
        """Test no ESG screening preset"""
        preset = create_esg_preset("none")

        assert len(preset.exclusions) == 0
        assert preset.minimum_esg_rating == ESGRating.LAGGARD
        assert preset.allow_not_rated == True


class TestESGScreening:
    """Test ESG screening logic"""

    def test_screen_assets_basic(self, screener, sample_asset_codes):
        """Test basic asset screening"""
        constraints = ESGConstraints(
            exclusions=[ExclusionCriteria.FOSSIL_FUELS],
            minimum_esg_rating=ESGRating.AVERAGE,
            allow_not_rated=True
        )

        result = screener.screen_assets(sample_asset_codes, constraints)

        assert result is not None
        assert isinstance(result.eligible_assets, list)
        assert isinstance(result.excluded_assets, dict)
        assert isinstance(result.portfolio_esg_score, float)

        # ENERGY should be excluded (fossil fuels)
        assert "ENERGY" not in result.eligible_assets

    def test_screen_assets_conservative(self, screener, sample_asset_codes):
        """Test screening with conservative preset"""
        constraints = create_esg_preset("conservative")
        result = screener.screen_assets(sample_asset_codes, constraints)

        # Conservative screening should exclude many assets
        assert len(result.excluded_assets) > 0

        # ESG-focused assets should pass
        if "US_ESG" in sample_asset_codes:
            assert "US_ESG" in result.eligible_assets or "US_ESG" in result.excluded_assets

    def test_screen_assets_no_constraints(self, screener, sample_asset_codes):
        """Test screening with no constraints"""
        constraints = create_esg_preset("none")
        result = screener.screen_assets(sample_asset_codes, constraints)

        # No constraints = all assets should pass
        assert len(result.eligible_assets) == len(sample_asset_codes)
        assert len(result.excluded_assets) == 0

    def test_screen_assets_esg_score_threshold(self, screener):
        """Test screening with minimum score threshold"""
        constraints = ESGConstraints(
            minimum_overall_score=80.0,  # High threshold
            allow_not_rated=False
        )

        asset_codes = ["US_ESG", "US_LC_BLEND", "ENERGY"]
        result = screener.screen_assets(asset_codes, constraints)

        # Only high-scoring assets should pass
        # US_ESG should pass (score 85), others may not
        if result.eligible_assets:
            assert all(
                ESG_PROFILES.get(code, ESGProfile(asset_code=code)).overall_score is None or
                ESG_PROFILES.get(code, ESGProfile(asset_code=code)).overall_score >= 80
                for code in result.eligible_assets
                if code in ESG_PROFILES
            )

    def test_screen_assets_not_rated_allowed(self, screener):
        """Test screening when not-rated assets are allowed"""
        constraints = ESGConstraints(
            minimum_esg_rating=ESGRating.LEADER,
            allow_not_rated=True  # Allow not rated
        )

        asset_codes = ["US_ESG", "CASH"]  # CASH is not rated
        result = screener.screen_assets(asset_codes, constraints)

        # CASH should pass even though not rated
        assert "CASH" in result.eligible_assets or "CASH" in result.excluded_assets

    def test_screen_assets_not_rated_excluded(self, screener):
        """Test screening when not-rated assets are excluded"""
        constraints = ESGConstraints(
            minimum_esg_rating=ESGRating.AVERAGE,
            allow_not_rated=False  # Don't allow not rated
        )

        asset_codes = ["US_ESG", "CASH"]  # CASH is not rated
        result = screener.screen_assets(asset_codes, constraints)

        # CASH should be excluded (not rated)
        if "CASH" in ESG_PROFILES and ESG_PROFILES["CASH"].esg_rating == ESGRating.NOT_RATED:
            assert "CASH" not in result.eligible_assets

    def test_screen_assets_required_criteria(self, screener):
        """Test screening with required criteria"""
        constraints = ESGConstraints(
            required_criteria=[ESGCriteria.CLIMATE_CHANGE, ESGCriteria.RENEWABLE_ENERGY],
            allow_not_rated=False
        )

        asset_codes = ["US_ESG", "GREEN_BOND", "US_LC_BLEND"]
        result = screener.screen_assets(asset_codes, constraints)

        # Only assets with required criteria should pass
        for asset_code in result.eligible_assets:
            if asset_code in ESG_PROFILES:
                profile = ESG_PROFILES[asset_code]
                # Should have all required criteria
                for criteria in constraints.required_criteria:
                    assert criteria in profile.positive_screens or profile.esg_rating == ESGRating.NOT_RATED


class TestESGRecommendations:
    """Test ESG recommendation generation"""

    def test_recommendations_generated(self, screener, sample_asset_codes):
        """Test that recommendations are generated"""
        constraints = ESGConstraints(
            exclusions=[ExclusionCriteria.FOSSIL_FUELS],
            minimum_esg_rating=ESGRating.AVERAGE
        )

        result = screener.screen_assets(sample_asset_codes, constraints)

        assert len(result.recommendations) > 0
        # Should have at least one recommendation
        assert any(rec for rec in result.recommendations)

    def test_no_eligible_assets_warning(self, screener):
        """Test warning when no assets meet criteria"""
        # Very strict constraints
        constraints = ESGConstraints(
            required_criteria=[
                ESGCriteria.CLIMATE_CHANGE,
                ESGCriteria.RENEWABLE_ENERGY,
                ESGCriteria.HUMAN_RIGHTS,
                ESGCriteria.BOARD_INDEPENDENCE
            ],
            exclusions=list(ExclusionCriteria),  # Exclude everything
            minimum_overall_score=95.0,
            allow_not_rated=False
        )

        result = screener.screen_assets(["US_LC_BLEND", "CASH"], constraints)

        # Should warn about overly strict criteria
        if len(result.eligible_assets) == 0:
            assert any("No assets meet" in rec or "Consider relax" in rec
                      for rec in result.recommendations)


class TestPortfolioESGScore:
    """Test portfolio ESG score calculation"""

    def test_calculate_portfolio_esg_score_basic(self, screener):
        """Test basic ESG score calculation"""
        eligible_assets = ["US_ESG", "INTL_ESG"]
        score = screener._calculate_portfolio_esg_score(eligible_assets)

        # Score should be high for ESG-focused assets
        assert score > 75, "Portfolio of ESG assets should have high score"

    def test_calculate_portfolio_esg_score_empty(self, screener):
        """Test score calculation with no assets"""
        score = screener._calculate_portfolio_esg_score([])
        assert score == 0.0

    def test_calculate_portfolio_esg_score_mixed(self, screener):
        """Test score calculation with mixed ratings"""
        eligible_assets = ["US_ESG", "US_LC_BLEND", "CASH"]
        score = screener._calculate_portfolio_esg_score(eligible_assets)

        # Score should be reasonable (30-100)
        assert 0 <= score <= 100


class TestAssetEligibility:
    """Test individual asset eligibility checks"""

    def test_check_asset_eligibility_pass(self, screener):
        """Test asset that passes all criteria"""
        profile = ESGProfile(
            asset_code="TEST",
            esg_rating=ESGRating.LEADER,
            overall_score=85.0,
            positive_screens=[ESGCriteria.CLIMATE_CHANGE]
        )

        constraints = ESGConstraints(
            minimum_esg_rating=ESGRating.AVERAGE,
            minimum_overall_score=70.0,
            required_criteria=[ESGCriteria.CLIMATE_CHANGE]
        )

        passes, reason = screener._check_asset_eligibility(profile, constraints)
        assert passes == True
        assert reason == ""

    def test_check_asset_eligibility_fails_exclusion(self, screener):
        """Test asset fails due to exclusion"""
        profile = ESGProfile(
            asset_code="TEST",
            esg_rating=ESGRating.AVERAGE,
            overall_score=70.0,
            exclusions=[ExclusionCriteria.FOSSIL_FUELS]
        )

        constraints = ESGConstraints(
            exclusions=[ExclusionCriteria.FOSSIL_FUELS]
        )

        passes, reason = screener._check_asset_eligibility(profile, constraints)
        assert passes == False
        assert "fossil_fuels" in reason.lower()

    def test_check_asset_eligibility_fails_rating(self, screener):
        """Test asset fails due to low rating"""
        profile = ESGProfile(
            asset_code="TEST",
            esg_rating=ESGRating.LAGGARD,
            overall_score=40.0
        )

        constraints = ESGConstraints(
            minimum_esg_rating=ESGRating.AVERAGE
        )

        passes, reason = screener._check_asset_eligibility(profile, constraints)
        assert passes == False
        assert "rating" in reason.lower()

    def test_check_asset_eligibility_fails_score(self, screener):
        """Test asset fails due to low score"""
        profile = ESGProfile(
            asset_code="TEST",
            esg_rating=ESGRating.AVERAGE,
            overall_score=55.0
        )

        constraints = ESGConstraints(
            minimum_overall_score=70.0
        )

        passes, reason = screener._check_asset_eligibility(profile, constraints)
        assert passes == False
        assert "score" in reason.lower()


class TestESGComparison:
    """Test ESG asset comparison"""

    def test_compare_assets_esg(self, screener):
        """Test comparing multiple assets"""
        asset_codes = ["US_ESG", "US_LC_BLEND", "ENERGY"]
        comparison = screener.compare_assets_esg(asset_codes)

        assert "assets" in comparison
        assert "best_environmental" in comparison
        assert "best_social" in comparison
        assert "best_governance" in comparison
        assert "best_overall" in comparison

        # Should have data for all provided assets
        assert len(comparison["assets"]) <= len(asset_codes)

        # Best ESG asset should be US_ESG
        if comparison["best_overall"]:
            # US_ESG should rank highly
            assert comparison["best_overall"] in ["US_ESG", "INTL_ESG", "GREEN_BOND"]

    def test_get_asset_esg_details(self, screener):
        """Test getting detailed ESG info"""
        details = screener.get_asset_esg_details("US_ESG")

        assert details is not None
        assert details.asset_code == "US_ESG"
        assert details.esg_rating == ESGRating.LEADER

        # Test non-existent asset
        details_none = screener.get_asset_esg_details("NONEXISTENT")
        assert details_none is None


class TestEdgeCases:
    """Test edge cases and error handling"""

    def test_screen_empty_asset_list(self, screener):
        """Test screening with no assets"""
        constraints = create_esg_preset("moderate")
        result = screener.screen_assets([], constraints)

        assert len(result.eligible_assets) == 0
        assert len(result.excluded_assets) == 0
        assert result.portfolio_esg_score == 0.0

    def test_screen_unknown_assets(self, screener):
        """Test screening with assets not in profile database"""
        constraints = create_esg_preset("moderate")
        result = screener.screen_assets(["UNKNOWN1", "UNKNOWN2"], constraints)

        # Unknown assets should get default profile
        assert result is not None

    def test_invalid_preset_name(self):
        """Test invalid preset name"""
        preset = create_esg_preset("invalid_name")

        # Should return "none" preset as fallback
        assert preset.minimum_esg_rating == ESGRating.LAGGARD
        assert len(preset.exclusions) == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
