"""Add account fields and holdings table

Revision ID: e55d97ed97f5
Revises: d75aea3a6632
Create Date: 2025-12-02 23:08:35.768763

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e55d97ed97f5'
down_revision: Union[str, Sequence[str], None] = 'd75aea3a6632'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add new columns to accounts table
    op.add_column('accounts', sa.Column('account_number', sa.String(255), nullable=True))
    op.add_column('accounts', sa.Column('balance', sa.Float(), nullable=False, server_default='0.0'))
    op.add_column('accounts', sa.Column('opened', sa.String(50), nullable=True))
    op.add_column('accounts', sa.Column('notes', sa.String(500), nullable=True))

    # Create holdings table
    op.create_table(
        'holdings',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('account_id', sa.String(36), sa.ForeignKey('accounts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('ticker', sa.String(20), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('security_type', sa.Enum('STOCK', 'ETF', 'MUTUAL_FUND', 'BOND', 'CASH', 'OTHER', name='securitytype'), nullable=False),
        sa.Column('shares', sa.Float(), nullable=False),
        sa.Column('cost_basis', sa.Float(), nullable=False),
        sa.Column('current_value', sa.Float(), nullable=False),
        sa.Column('purchase_date', sa.String(50), nullable=True),
        sa.Column('asset_class', sa.String(100), nullable=True),
        sa.Column('expense_ratio', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )

    # Create indexes for holdings
    op.create_index('ix_holdings_account_id', 'holdings', ['account_id'])
    op.create_index('ix_holdings_ticker', 'holdings', ['ticker'])
    op.create_index('ix_holdings_security_type', 'holdings', ['security_type'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop holdings table and indexes
    op.drop_index('ix_holdings_security_type', 'holdings')
    op.drop_index('ix_holdings_ticker', 'holdings')
    op.drop_index('ix_holdings_account_id', 'holdings')
    op.drop_table('holdings')

    # Drop SecurityType enum
    sa.Enum(name='securitytype').drop(op.get_bind(), checkfirst=True)

    # Remove new columns from accounts
    op.drop_column('accounts', 'notes')
    op.drop_column('accounts', 'opened')
    op.drop_column('accounts', 'balance')
    op.drop_column('accounts', 'account_number')
