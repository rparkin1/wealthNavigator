"""
Redis Caching Service
Provides caching utilities for frequently accessed data
"""

import json
from typing import Optional, Any, Callable
from functools import wraps
import redis.asyncio as redis
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class CacheService:
    """Redis cache service for application data"""

    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self._connected = False

    async def connect(self):
        """Connect to Redis"""
        try:
            self.redis_client = await redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
            )
            await self.redis_client.ping()
            self._connected = True
            logger.info("Successfully connected to Redis")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self._connected = False

    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.close()
            self._connected = False
            logger.info("Disconnected from Redis")

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self._connected or not self.redis_client:
            return None

        try:
            value = await self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None

    async def set(
        self, key: str, value: Any, expire: Optional[int] = None
    ) -> bool:
        """Set value in cache with optional expiration (seconds)"""
        if not self._connected or not self.redis_client:
            return False

        try:
            serialized = json.dumps(value)
            if expire:
                await self.redis_client.setex(key, expire, serialized)
            else:
                await self.redis_client.set(key, serialized)
            return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self._connected or not self.redis_client:
            return False

        try:
            await self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        if not self._connected or not self.redis_client:
            return 0

        try:
            keys = []
            async for key in self.redis_client.scan_iter(match=pattern):
                keys.append(key)

            if keys:
                return await self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {e}")
            return 0

    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        if not self._connected or not self.redis_client:
            return False

        try:
            return await self.redis_client.exists(key) > 0
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {e}")
            return False


# Global cache instance
cache = CacheService()


def cached(
    key_prefix: str,
    expire: int = 300,
    key_builder: Optional[Callable] = None,
):
    """
    Caching decorator for async functions

    Args:
        key_prefix: Prefix for cache key
        expire: Expiration time in seconds (default: 5 minutes)
        key_builder: Optional function to build cache key from arguments
    """

    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Build cache key
            if key_builder:
                cache_key = f"{key_prefix}:{key_builder(*args, **kwargs)}"
            else:
                # Default: use function name and arguments
                args_key = "_".join(str(arg) for arg in args)
                kwargs_key = "_".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
                cache_key = f"{key_prefix}:{func.__name__}:{args_key}:{kwargs_key}"

            # Try to get from cache
            cached_value = await cache.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_value

            # Execute function
            logger.debug(f"Cache miss: {cache_key}")
            result = await func(*args, **kwargs)

            # Store in cache
            await cache.set(cache_key, result, expire=expire)

            return result

        return wrapper

    return decorator


# Cache key patterns and TTLs
class CacheKeys:
    """Cache key patterns and TTL configurations"""

    # User portfolios (5 minutes)
    PORTFOLIO = "portfolio:user:{user_id}"
    PORTFOLIO_TTL = 300

    # Goal calculations (15 minutes)
    GOAL = "goal:{goal_id}"
    GOAL_TTL = 900

    # Monte Carlo results (1 day)
    SIMULATION = "simulation:{simulation_id}"
    SIMULATION_TTL = 86400

    # Market data (1 hour)
    MARKET_DATA = "market:symbol:{symbol}"
    MARKET_DATA_TTL = 3600

    # User data (10 minutes)
    USER = "user:{user_id}"
    USER_TTL = 600

    # Thread data (5 minutes)
    THREAD = "thread:{thread_id}"
    THREAD_TTL = 300

    # Analysis results (30 minutes)
    ANALYSIS = "analysis:{analysis_id}"
    ANALYSIS_TTL = 1800

    # Portfolio optimization results (15 minutes)
    PORTFOLIO_OPTIMIZATION = "portfolio_opt:user:{user_id}:{hash}"
    PORTFOLIO_OPTIMIZATION_TTL = 900

    # Risk calculations (10 minutes)
    RISK_METRICS = "risk:portfolio:{portfolio_id}"
    RISK_METRICS_TTL = 600

    # Tax calculations (20 minutes)
    TAX_CALCULATION = "tax:user:{user_id}:year:{year}"
    TAX_CALCULATION_TTL = 1200

    # Diversification analysis (10 minutes)
    DIVERSIFICATION = "diversification:portfolio:{portfolio_id}"
    DIVERSIFICATION_TTL = 600


async def invalidate_user_cache(user_id: str):
    """Invalidate all cache entries for a user"""
    patterns = [
        f"portfolio:user:{user_id}:*",
        f"user:{user_id}",
        f"thread:*:user:{user_id}",
    ]

    for pattern in patterns:
        deleted = await cache.delete_pattern(pattern)
        logger.info(f"Invalidated {deleted} cache entries for pattern: {pattern}")


async def invalidate_goal_cache(goal_id: str):
    """Invalidate all cache entries for a goal"""
    await cache.delete(f"goal:{goal_id}")
    await cache.delete_pattern(f"simulation:*:goal:{goal_id}")
    logger.info(f"Invalidated cache for goal: {goal_id}")
