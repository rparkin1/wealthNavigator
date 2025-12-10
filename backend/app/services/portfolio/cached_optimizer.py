"""
Cached Portfolio Optimizer
Wraps portfolio optimization with Redis caching for performance
"""

import hashlib
import json
from typing import Dict, List, Optional
from app.core.cache import cache, CacheKeys
from app.core.performance import track_performance
from app.services.portfolio.multi_level_optimizer import (
    MultiLevelOptimizer,
    HouseholdPortfolio,
    OptimizationResult
)
import logging

logger = logging.getLogger(__name__)


class CachedPortfolioOptimizer:
    """Portfolio optimizer with intelligent caching"""

    def __init__(self):
        self.optimizer = MultiLevelOptimizer()

    def _generate_cache_key(
        self,
        user_id: str,
        household: HouseholdPortfolio,
        asset_codes: List[str]
    ) -> str:
        """Generate unique cache key for optimization request"""
        # Create deterministic hash from request parameters
        request_data = {
            "user_id": user_id,
            "accounts": [
                {
                    "type": acc.type,
                    "balance": acc.balance,
                }
                for acc in household.accounts
            ],
            "goals": [
                {
                    "target_amount": goal.target_amount,
                    "years_to_goal": goal.years_to_goal,
                    "priority": goal.priority,
                    "risk_tolerance": goal.risk_tolerance,
                }
                for goal in household.goals
            ],
            "asset_codes": sorted(asset_codes),
        }

        request_json = json.dumps(request_data, sort_keys=True)
        request_hash = hashlib.md5(request_json.encode()).hexdigest()

        return f"portfolio_opt:user:{user_id}:hash:{request_hash}"

    @track_performance("portfolio_optimization_cached")
    async def optimize_household_cached(
        self,
        user_id: str,
        household: HouseholdPortfolio,
        asset_codes: List[str],
        correlation_matrix: Optional[Dict] = None,
        force_refresh: bool = False
    ) -> OptimizationResult:
        """
        Optimize household portfolio with caching

        Args:
            user_id: User ID for cache key
            household: Household portfolio data
            asset_codes: Asset classes to use
            correlation_matrix: Optional correlation matrix
            force_refresh: Skip cache and force recalculation

        Returns:
            OptimizationResult with allocation recommendations
        """
        # Generate cache key
        cache_key = self._generate_cache_key(user_id, household, asset_codes)

        # Try to get from cache unless force refresh
        if not force_refresh:
            cached_result = await cache.get(cache_key)
            if cached_result:
                logger.info(f"Cache HIT for portfolio optimization: {cache_key}")
                # Convert dict back to OptimizationResult
                return OptimizationResult(**cached_result)

        logger.info(f"Cache MISS for portfolio optimization: {cache_key}")

        # Perform optimization
        result = self.optimizer.optimize_household(
            household=household,
            asset_codes=asset_codes,
            correlation_matrix=correlation_matrix
        )

        # Cache the result (15 minutes TTL)
        result_dict = {
            "level": result.level,
            "total_value": result.total_value,
            "expected_return": result.expected_return,
            "expected_volatility": result.expected_volatility,
            "sharpe_ratio": result.sharpe_ratio,
            "goal_allocations": result.goal_allocations,
            "account_allocations": result.account_allocations,
            "household_allocation": result.household_allocation,
            "estimated_tax_drag": result.estimated_tax_drag,
            "asset_location_efficiency": result.asset_location_efficiency,
            "diversification_score": result.diversification_score,
            "rebalancing_needed": result.rebalancing_needed,
            "recommendations": result.recommendations,
        }

        await cache.set(
            cache_key,
            result_dict,
            expire=CacheKeys.PORTFOLIO_OPTIMIZATION_TTL
        )

        return result

    async def invalidate_user_optimization_cache(self, user_id: str):
        """Invalidate all optimization cache entries for a user"""
        pattern = f"portfolio_opt:user:{user_id}:*"
        deleted = await cache.delete_pattern(pattern)
        logger.info(f"Invalidated {deleted} portfolio optimization cache entries for user {user_id}")
        return deleted


# Global cached optimizer instance
cached_optimizer = CachedPortfolioOptimizer()
