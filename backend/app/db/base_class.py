"""
Compatibility shim for SQLAlchemy Base import.

Models can import `Base` from `app.db.base_class` to match historical patterns,
but the actual Base class lives in `app.models.base`.
"""

from app.models.base import Base  # re-export for models expecting this path

