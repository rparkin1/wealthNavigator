"""add_plaid_investment_transactions

Revision ID: 41a926b044b0
Revises: 9c0f8e9fa5a5
Create Date: 2025-12-06 00:41:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '41a926b044b0'
down_revision: Union[str, Sequence[str], None] = '9c0f8e9fa5a5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add plaid_investment_transactions table."""
    op.create_table('plaid_investment_transactions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('account_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('investment_transaction_id', sa.String(length=255), nullable=False),
        sa.Column('security_id', sa.String(length=255), nullable=True),
        sa.Column('ticker_symbol', sa.String(length=20), nullable=True),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('name', sa.String(length=500), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=True),
        sa.Column('price', sa.Float(), nullable=True),
        sa.Column('fees', sa.Float(), nullable=True),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('subtype', sa.String(length=50), nullable=True),
        sa.Column('iso_currency_code', sa.String(length=3), nullable=True),
        sa.Column('unofficial_currency_code', sa.String(length=10), nullable=True),
        sa.Column('user_category', sa.String(length=100), nullable=True),
        sa.Column('user_notes', sa.Text(), nullable=True),
        sa.Column('is_excluded', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['account_id'], ['plaid_accounts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_plaid_inv_transactions_account_date', 'plaid_investment_transactions', ['account_id', 'date'], unique=False)
    op.create_index('ix_plaid_inv_transactions_ticker', 'plaid_investment_transactions', ['ticker_symbol'], unique=False)
    op.create_index('ix_plaid_inv_transactions_user_date', 'plaid_investment_transactions', ['user_id', 'date'], unique=False)
    op.create_index('ix_plaid_inv_transactions_user_type', 'plaid_investment_transactions', ['user_id', 'type'], unique=False)
    op.create_index(op.f('ix_plaid_investment_transactions_account_id'), 'plaid_investment_transactions', ['account_id'], unique=False)
    op.create_index(op.f('ix_plaid_investment_transactions_date'), 'plaid_investment_transactions', ['date'], unique=False)
    op.create_index(op.f('ix_plaid_investment_transactions_investment_transaction_id'), 'plaid_investment_transactions', ['investment_transaction_id'], unique=True)
    op.create_index(op.f('ix_plaid_investment_transactions_ticker_symbol'), 'plaid_investment_transactions', ['ticker_symbol'], unique=False)
    op.create_index(op.f('ix_plaid_investment_transactions_user_id'), 'plaid_investment_transactions', ['user_id'], unique=False)


def downgrade() -> None:
    """Drop plaid_investment_transactions table."""
    op.drop_index(op.f('ix_plaid_investment_transactions_user_id'), table_name='plaid_investment_transactions')
    op.drop_index(op.f('ix_plaid_investment_transactions_ticker_symbol'), table_name='plaid_investment_transactions')
    op.drop_index(op.f('ix_plaid_investment_transactions_investment_transaction_id'), table_name='plaid_investment_transactions')
    op.drop_index(op.f('ix_plaid_investment_transactions_date'), table_name='plaid_investment_transactions')
    op.drop_index(op.f('ix_plaid_investment_transactions_account_id'), table_name='plaid_investment_transactions')
    op.drop_index('ix_plaid_inv_transactions_user_type', table_name='plaid_investment_transactions')
    op.drop_index('ix_plaid_inv_transactions_user_date', table_name='plaid_investment_transactions')
    op.drop_index('ix_plaid_inv_transactions_ticker', table_name='plaid_investment_transactions')
    op.drop_index('ix_plaid_inv_transactions_account_date', table_name='plaid_investment_transactions')
    op.drop_table('plaid_investment_transactions')
