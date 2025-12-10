"""Add lowercase securitytype values

Revision ID: 9c0f8e9fa5a5
Revises: 0e8225c25b5a
Create Date: 2025-12-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "9c0f8e9fa5a5"
down_revision: Union[str, Sequence[str], None] = "0e8225c25b5a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Allow mixed-case security type inputs by adding lowercase enum values."""
    values_to_add = [
        "stock",
        "etf",
        "mutual_fund",
        "bond",
        "cash",
        "other",
        "option",
        "future",
        "OPTION",
        "FUTURE",
    ]

    for value in values_to_add:
        op.execute(f"ALTER TYPE securitytype ADD VALUE IF NOT EXISTS '{value}'")


def downgrade() -> None:
    """Enum values cannot be removed safely; no-op on downgrade."""
    pass
