"""
API dependencies used across routers (auth, DB sessions).

Provides a minimal get_current_user for development and re-exports get_db.
"""

from typing import Optional
from fastapi import Header

# Re-export async DB dependency so routers can import from app.api.deps
from app.core.database import get_db  # noqa: F401


class CurrentUser:
  """Lightweight user object for dependency injection.

  In production, replace with real authentication and user lookup.
  """

  def __init__(self, id: str):
    self.id = id


async def get_current_user(x_user_id: Optional[str] = Header(default=None)) -> CurrentUser:
  """Return the current user based on request context.

  - Reads `X-User-Id` header when provided
  - Falls back to dev user ID that matches frontend default
  """
  user_id = x_user_id or "test-user-123"
  return CurrentUser(user_id)

