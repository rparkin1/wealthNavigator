"""increase_ticker_column_size

Revision ID: 1b977a40d060
Revises: e55d97ed97f5
Create Date: 2025-12-02 23:22:25.062474

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1b977a40d060'
down_revision: Union[str, Sequence[str], None] = 'e55d97ed97f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Increase ticker column size from 20 to 100 characters
    op.alter_column('holdings', 'ticker',
                   existing_type=sa.String(20),
                   type_=sa.String(100),
                   existing_nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Revert ticker column size back to 20 characters
    op.alter_column('holdings', 'ticker',
                   existing_type=sa.String(100),
                   type_=sa.String(20),
                   existing_nullable=False)
