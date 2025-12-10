"""
Performance Metrics API Endpoints
Provides real-time performance monitoring and metrics
"""

from fastapi import APIRouter, Depends
from typing import Dict
from datetime import datetime

from app.core.performance import performance_metrics, get_performance_report

router = APIRouter(prefix="/performance-metrics", tags=["Performance"])


@router.get("/stats", response_model=Dict)
async def get_performance_stats():
    """
    Get current performance statistics

    Returns:
    - Timing metrics for all tracked operations
    - Counter values
    - Uptime information
    """
    return performance_metrics.get_all_stats()


@router.get("/report", response_model=Dict)
async def get_performance_report_endpoint():
    """
    Get comprehensive performance report

    Returns:
    - Detailed performance metrics
    - Slow operation identification
    - Health status
    - Recommendations
    """
    return get_performance_report()


@router.get("/operation/{operation_name}", response_model=Dict)
async def get_operation_stats(operation_name: str):
    """
    Get statistics for a specific operation

    Path Parameters:
    - operation_name: Name of the operation to query

    Returns:
    - Count, mean, min, max, percentiles
    """
    stats = performance_metrics.get_stats(operation_name)
    if not stats:
        return {
            "operation": operation_name,
            "status": "no_data",
            "message": "No metrics recorded for this operation",
        }

    return {
        "operation": operation_name,
        "status": "available",
        "statistics": stats,
        "timestamp": datetime.now().isoformat(),
    }


@router.post("/reset")
async def reset_metrics():
    """
    Reset all performance metrics

    Note: This should typically only be used in development/testing
    """
    performance_metrics.reset()
    return {
        "status": "success",
        "message": "Performance metrics reset",
        "timestamp": datetime.now().isoformat(),
    }


@router.get("/health")
async def performance_health_check():
    """
    Check if performance is within acceptable thresholds

    Returns:
    - Health status
    - Warning about slow operations
    """
    report = get_performance_report()

    return {
        "status": report["health_status"],
        "slow_operations_count": len(report["slow_operations"]),
        "slow_operations": report["slow_operations"][:5],  # Top 5
        "uptime_seconds": report["uptime_seconds"],
        "timestamp": datetime.now().isoformat(),
    }
