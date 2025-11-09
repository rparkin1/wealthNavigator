"""Add Plaid tables only

Revision ID: eae32684b4b7
Revises: add_sensitivity_vars
Create Date: 2025-11-08 21:47:05.367567

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eae32684b4b7'
down_revision: Union[str, Sequence[str], None] = 'add_sensitivity_vars'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
