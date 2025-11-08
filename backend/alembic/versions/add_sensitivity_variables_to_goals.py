"""add sensitivity assumption columns to goals

Revision ID: add_sensitivity_vars
Revises: portfolio_opt_001
Create Date: 2025-11-02 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_sensitivity_vars'
down_revision: Union[str, None] = 'portfolio_opt_001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add sensitivity assumption columns required by analyzer endpoints."""
    op.add_column(
        'goals',
        sa.Column(
            'expected_return_stocks',
            sa.Float(),
            nullable=False,
            server_default='0.07',
        ),
    )
    op.add_column(
        'goals',
        sa.Column(
            'expected_return_bonds',
            sa.Float(),
            nullable=False,
            server_default='0.04',
        ),
    )
    op.add_column(
        'goals',
        sa.Column(
            'inflation_rate',
            sa.Float(),
            nullable=False,
            server_default='0.025',
        ),
    )
    op.add_column(
        'goals',
        sa.Column(
            'retirement_age',
            sa.Integer(),
            nullable=False,
            server_default='65',
        ),
    )
    op.add_column(
        'goals',
        sa.Column(
            'life_expectancy',
            sa.Integer(),
            nullable=False,
            server_default='90',
        ),
    )


def downgrade() -> None:
    """Remove sensitivity assumption columns."""
    op.drop_column('goals', 'life_expectancy')
    op.drop_column('goals', 'retirement_age')
    op.drop_column('goals', 'inflation_rate')
    op.drop_column('goals', 'expected_return_bonds')
    op.drop_column('goals', 'expected_return_stocks')
