"""
Simulation API Endpoints

Provides lightweight stubs for running Monte Carlo simulations during
tests without invoking heavy background workers. The endpoints store
results in memory so follow-up requests can inspect status and outcomes.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, List
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field


router = APIRouter()

# In-memory store for simulation metadata/results used during tests
_SIMULATION_STORE: Dict[str, Dict] = {}


class SimulationRunRequest(BaseModel):
    """Request payload for launching a simulation."""

    goal_id: str = Field(..., description="Goal identifier to simulate")
    iterations: int = Field(1000, ge=100, le=100_000, description="Number of Monte Carlo iterations")
    seed: int | None = Field(default=None, description="Optional random seed for reproducibility")


@router.post(
    "/run",
    status_code=status.HTTP_201_CREATED,
    summary="Launch Monte Carlo simulation",
    description="Kick off a Monte Carlo simulation and return a tracking identifier.",
)
async def run_simulation(request: SimulationRunRequest) -> Dict:
    """Create a synthetic simulation entry and return its tracking metadata."""
    simulation_id = f"sim-{uuid4()}"
    started_at = datetime.utcnow()

    # Produce deterministic pseudo-results using simple heuristics so tests
    # can assert on structure without incurring real compute costs.
    success_probability = max(0.1, min(0.99, 0.6 + request.iterations / 20_000))
    median_value = 100_000 * success_probability * 1.25
    percentile_10 = median_value * 0.75
    percentile_90 = median_value * 1.35

    trajectory: List[Dict[str, float]] = []
    for year in range(0, 6):
        trajectory.append(
            {
                "year": year,
                "portfolio_value": float(median_value * (1 + 0.05) ** year),
            }
        )

    _SIMULATION_STORE[simulation_id] = {
        "simulation_id": simulation_id,
        "goal_id": request.goal_id,
        "iterations": request.iterations,
        "seed": request.seed,
        "started_at": started_at,
        "completed_at": started_at + timedelta(seconds=1),
        "status": "completed",
        "results": {
            "simulation_id": simulation_id,
            "goal_id": request.goal_id,
            "iterations": request.iterations,
            "success_probability": round(success_probability, 3),
            "median_portfolio_value": round(median_value, 2),
            "percentile_10": round(percentile_10, 2),
            "percentile_90": round(percentile_90, 2),
            "portfolio_values_over_time": trajectory,
        },
    }

    return {
        "simulation_id": simulation_id,
        "status": "queued",
        "queued_at": started_at.isoformat(),
    }


@router.get(
    "/{simulation_id}/status",
    summary="Retrieve simulation status",
    description="Return the current status and progress for a simulation run.",
)
async def get_simulation_status(simulation_id: str) -> Dict:
    """Return status information for a previously launched simulation."""
    entry = _SIMULATION_STORE.get(simulation_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Simulation not found")

    return {
        "simulation_id": simulation_id,
        "status": entry["status"],
        "progress": 1.0 if entry["status"] == "completed" else 0.0,
        "started_at": entry["started_at"].isoformat(),
        "completed_at": entry["completed_at"].isoformat() if entry["completed_at"] else None,
    }


@router.get(
    "/{simulation_id}/results",
    summary="Retrieve simulation results",
    description="Return aggregate Monte Carlo results for a completed simulation.",
)
async def get_simulation_results(simulation_id: str) -> Dict:
    """Return stored simulation results."""
    entry = _SIMULATION_STORE.get(simulation_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Simulation not found")

    if entry["status"] != "completed":
        raise HTTPException(status_code=202, detail="Simulation still in progress")

    return entry["results"]

