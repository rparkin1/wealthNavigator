"""add_is_active_to_plaid_holdings

Revision ID: 07097ce5947f
Revises: 41a926b044b0
Create Date: 2025-12-21 22:31:10.447489

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '07097ce5947f'
down_revision: Union[str, Sequence[str], None] = '41a926b044b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add is_active column to plaid_holdings table
    op.add_column('plaid_holdings', sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))

    # Create index for efficient querying
    op.create_index('ix_plaid_holdings_user_active', 'plaid_holdings', ['user_id', 'is_active'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop index
    op.drop_index('ix_plaid_holdings_user_active', table_name='plaid_holdings')

    # Drop column
    op.drop_column('plaid_holdings', 'is_active')
