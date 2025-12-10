"""
Performance Monitoring and Metrics Collection
Tracks application performance and provides insights
"""

import time
import logging
from typing import Dict, Optional, List
from datetime import datetime
from functools import wraps
from contextlib import asynccontextmanager
import asyncio

logger = logging.getLogger(__name__)


class PerformanceMetrics:
    """Track and store performance metrics"""

    def __init__(self):
        self.metrics: Dict[str, List[float]] = {}
        self.counters: Dict[str, int] = {}
        self.last_reset = datetime.now()

    def record_timing(self, operation: str, duration: float):
        """Record operation timing"""
        if operation not in self.metrics:
            self.metrics[operation] = []
        self.metrics[operation].append(duration)

        # Keep only last 1000 measurements
        if len(self.metrics[operation]) > 1000:
            self.metrics[operation] = self.metrics[operation][-1000:]

    def increment_counter(self, name: str, value: int = 1):
        """Increment a counter"""
        self.counters[name] = self.counters.get(name, 0) + value

    def get_stats(self, operation: str) -> Optional[Dict]:
        """Get statistics for an operation"""
        if operation not in self.metrics or not self.metrics[operation]:
            return None

        timings = self.metrics[operation]
        return {
            "count": len(timings),
            "mean": sum(timings) / len(timings),
            "min": min(timings),
            "max": max(timings),
            "p50": sorted(timings)[len(timings) // 2],
            "p95": sorted(timings)[int(len(timings) * 0.95)],
            "p99": sorted(timings)[int(len(timings) * 0.99)],
        }

    def get_all_stats(self) -> Dict:
        """Get all performance statistics"""
        return {
            "metrics": {op: self.get_stats(op) for op in self.metrics},
            "counters": self.counters.copy(),
            "uptime_seconds": (datetime.now() - self.last_reset).total_seconds(),
        }

    def reset(self):
        """Reset all metrics"""
        self.metrics.clear()
        self.counters.clear()
        self.last_reset = datetime.now()


# Global metrics instance
performance_metrics = PerformanceMetrics()


def track_performance(operation_name: str):
    """
    Decorator to track function performance

    Args:
        operation_name: Name of the operation to track
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                performance_metrics.record_timing(operation_name, duration)
                if duration > 1.0:  # Log slow operations
                    logger.warning(
                        f"Slow operation: {operation_name} took {duration:.2f}s"
                    )

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                performance_metrics.record_timing(operation_name, duration)
                if duration > 1.0:  # Log slow operations
                    logger.warning(
                        f"Slow operation: {operation_name} took {duration:.2f}s"
                    )

        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

    return decorator


@asynccontextmanager
async def track_operation(operation_name: str):
    """
    Context manager to track operation performance

    Usage:
        async with track_operation("expensive_calculation"):
            result = await expensive_function()
    """
    start_time = time.time()
    try:
        yield
    finally:
        duration = time.time() - start_time
        performance_metrics.record_timing(operation_name, duration)
        if duration > 1.0:
            logger.warning(f"Slow operation: {operation_name} took {duration:.2f}s")


class PerformanceWarnings:
    """Track and alert on performance issues"""

    THRESHOLDS = {
        "monte_carlo": 30.0,  # 30 seconds max
        "portfolio_optimization": 5.0,  # 5 seconds max
        "dashboard_load": 1.0,  # 1 second max
        "api_request": 2.0,  # 2 seconds max
        "database_query": 0.5,  # 500ms max
        "cache_operation": 0.1,  # 100ms max
    }

    @classmethod
    def check_threshold(cls, operation: str, duration: float) -> bool:
        """Check if operation exceeded threshold"""
        threshold = cls.THRESHOLDS.get(operation)
        if threshold and duration > threshold:
            logger.warning(
                f"Performance threshold exceeded: {operation} took {duration:.2f}s "
                f"(threshold: {threshold}s)"
            )
            return True
        return False


def get_performance_report() -> Dict:
    """Generate comprehensive performance report"""
    stats = performance_metrics.get_all_stats()

    # Identify slow operations
    slow_operations = []
    for operation, metrics in stats.get("metrics", {}).items():
        if metrics and metrics.get("p95", 0) > 1.0:
            slow_operations.append({
                "operation": operation,
                "p95_seconds": metrics["p95"],
                "max_seconds": metrics["max"],
            })

    return {
        "timestamp": datetime.now().isoformat(),
        "uptime_seconds": stats.get("uptime_seconds", 0),
        "total_operations": sum(
            m.get("count", 0) for m in stats.get("metrics", {}).values()
        ),
        "metrics": stats.get("metrics", {}),
        "counters": stats.get("counters", {}),
        "slow_operations": sorted(
            slow_operations, key=lambda x: x["p95_seconds"], reverse=True
        ),
        "health_status": "healthy" if not slow_operations else "degraded",
    }
