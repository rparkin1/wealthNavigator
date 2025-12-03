"""add_option_future_security_types

Revision ID: 0e8225c25b5a
Revises: 1b977a40d060
Create Date: 2025-12-02 23:25:26.892034

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0e8225c25b5a'
down_revision: Union[str, Sequence[str], None] = '1b977a40d060'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add 'option' and 'future' values to the securitytype enum
    # Note: ALTER TYPE ADD VALUE cannot be executed inside a transaction block
    # in some PostgreSQL versions, but Alembic handles this automatically
    op.execute("ALTER TYPE securitytype ADD VALUE IF NOT EXISTS 'option'")
    op.execute("ALTER TYPE securitytype ADD VALUE IF NOT EXISTS 'future'")


def downgrade() -> None:
    """Downgrade schema."""
    # Note: PostgreSQL does not support removing enum values directly
    # You would need to recreate the enum type and update all references
    # For simplicity, we'll leave the enum values in place during downgrade
    pass
