"""add_net_worth_snapshots_table

Revision ID: 7860314cd705
Revises: 07097ce5947f
Create Date: 2025-12-21 22:38:19.009291

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7860314cd705'
down_revision: Union[str, Sequence[str], None] = '07097ce5947f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create net_worth_snapshots table
    op.create_table(
        'net_worth_snapshots',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('snapshot_date', sa.Date(), nullable=False),
        sa.Column('total_assets', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('total_liabilities', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('total_net_worth', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('liquid_net_worth', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('assets_by_class', sa.JSON(), nullable=False),
        sa.Column('num_accounts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('num_investment_accounts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('num_depository_accounts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('num_credit_accounts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('source', sa.String(50), nullable=False, server_default='plaid'),
        sa.Column('snapshot_metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Create indexes
    op.create_index('ix_net_worth_snapshots_user_id', 'net_worth_snapshots', ['user_id'])
    op.create_index('ix_net_worth_snapshots_snapshot_date', 'net_worth_snapshots', ['snapshot_date'])
    op.create_index('idx_user_date', 'net_worth_snapshots', ['user_id', 'snapshot_date'])

    # Create unique constraint
    op.create_unique_constraint('uq_user_snapshot_date', 'net_worth_snapshots', ['user_id', 'snapshot_date'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop table (cascade will handle indexes and constraints)
    op.drop_table('net_worth_snapshots')
