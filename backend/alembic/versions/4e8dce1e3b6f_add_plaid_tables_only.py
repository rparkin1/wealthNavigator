"""Add Plaid tables only

Revision ID: 4e8dce1e3b6f
Revises: 005
Create Date: 2025-10-31 23:36:49.254837

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '4e8dce1e3b6f'
down_revision: Union[str, Sequence[str], None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add Plaid tables only."""

    # Create plaid_items table
    op.create_table('plaid_items',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('item_id', sa.String(length=255), nullable=False),
        sa.Column('access_token', sa.Text(), nullable=False),
        sa.Column('institution_id', sa.String(length=255), nullable=True),
        sa.Column('institution_name', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('consent_expiration_time', sa.String(length=50), nullable=True),
        sa.Column('last_successful_sync', sa.String(length=50), nullable=True),
        sa.Column('cursor', sa.Text(), nullable=True),
        sa.Column('error_code', sa.String(length=255), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('available_products', sa.JSON(), nullable=True),
        sa.Column('billed_products', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_plaid_items_item_id'), 'plaid_items', ['item_id'], unique=True)
    op.create_index(op.f('ix_plaid_items_user_id'), 'plaid_items', ['user_id'], unique=False)

    # Create plaid_accounts table
    op.create_table('plaid_accounts',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('item_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('account_id', sa.String(length=255), nullable=False),
        sa.Column('persistent_account_id', sa.String(length=255), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('official_name', sa.String(length=255), nullable=True),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('subtype', sa.String(length=50), nullable=True),
        sa.Column('mask', sa.String(length=10), nullable=True),
        sa.Column('current_balance', sa.Float(), nullable=True),
        sa.Column('available_balance', sa.Float(), nullable=True),
        sa.Column('limit', sa.Float(), nullable=True),
        sa.Column('iso_currency_code', sa.String(length=3), nullable=True, server_default='USD'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_balance_update', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['item_id'], ['plaid_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_plaid_accounts_account_id'), 'plaid_accounts', ['account_id'], unique=True)
    op.create_index(op.f('ix_plaid_accounts_item_id'), 'plaid_accounts', ['item_id'], unique=False)
    op.create_index(op.f('ix_plaid_accounts_persistent_account_id'), 'plaid_accounts', ['persistent_account_id'], unique=False)
    op.create_index('ix_plaid_accounts_user_active', 'plaid_accounts', ['user_id', 'is_active'], unique=False)
    op.create_index(op.f('ix_plaid_accounts_user_id'), 'plaid_accounts', ['user_id'], unique=False)
    op.create_index('ix_plaid_accounts_user_type', 'plaid_accounts', ['user_id', 'type'], unique=False)

    # Create plaid_transactions table
    op.create_table('plaid_transactions',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('account_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('transaction_id', sa.String(length=255), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('iso_currency_code', sa.String(length=3), nullable=True, server_default='USD'),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('authorized_date', sa.Date(), nullable=True),
        sa.Column('name', sa.String(length=500), nullable=False),
        sa.Column('merchant_name', sa.String(length=255), nullable=True),
        sa.Column('category', sa.JSON(), nullable=True),
        sa.Column('category_id', sa.String(length=50), nullable=True),
        sa.Column('personal_finance_category', sa.JSON(), nullable=True),
        sa.Column('pending', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('location', sa.JSON(), nullable=True),
        sa.Column('payment_meta', sa.JSON(), nullable=True),
        sa.Column('payment_channel', sa.String(length=50), nullable=True),
        sa.Column('user_category', sa.String(length=100), nullable=True),
        sa.Column('user_notes', sa.Text(), nullable=True),
        sa.Column('is_excluded', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['account_id'], ['plaid_accounts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_plaid_transactions_account_date', 'plaid_transactions', ['account_id', 'date'], unique=False)
    op.create_index(op.f('ix_plaid_transactions_account_id'), 'plaid_transactions', ['account_id'], unique=False)
    op.create_index(op.f('ix_plaid_transactions_date'), 'plaid_transactions', ['date'], unique=False)
    op.create_index(op.f('ix_plaid_transactions_transaction_id'), 'plaid_transactions', ['transaction_id'], unique=True)
    op.create_index('ix_plaid_transactions_user_category', 'plaid_transactions', ['user_id', 'user_category'], unique=False)
    op.create_index('ix_plaid_transactions_user_date', 'plaid_transactions', ['user_id', 'date'], unique=False)
    op.create_index(op.f('ix_plaid_transactions_user_id'), 'plaid_transactions', ['user_id'], unique=False)

    # Create plaid_holdings table
    op.create_table('plaid_holdings',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('account_id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('security_id', sa.String(length=255), nullable=False),
        sa.Column('ticker_symbol', sa.String(length=20), nullable=True),
        sa.Column('cusip', sa.String(length=20), nullable=True),
        sa.Column('isin', sa.String(length=20), nullable=True),
        sa.Column('sedol', sa.String(length=20), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=True),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('institution_price', sa.Float(), nullable=True),
        sa.Column('institution_value', sa.Float(), nullable=True),
        sa.Column('cost_basis', sa.Float(), nullable=True),
        sa.Column('iso_currency_code', sa.String(length=3), nullable=True, server_default='USD'),
        sa.Column('unofficial_currency_code', sa.String(length=10), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['account_id'], ['plaid_accounts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_plaid_holdings_account', 'plaid_holdings', ['account_id'], unique=False)
    op.create_index(op.f('ix_plaid_holdings_account_id'), 'plaid_holdings', ['account_id'], unique=False)
    op.create_index(op.f('ix_plaid_holdings_ticker_symbol'), 'plaid_holdings', ['ticker_symbol'], unique=False)
    op.create_index(op.f('ix_plaid_holdings_user_id'), 'plaid_holdings', ['user_id'], unique=False)
    op.create_index('ix_plaid_holdings_user_ticker', 'plaid_holdings', ['user_id', 'ticker_symbol'], unique=False)


def downgrade() -> None:
    """Downgrade schema - Drop Plaid tables."""
    op.drop_index('ix_plaid_holdings_user_ticker', table_name='plaid_holdings')
    op.drop_index(op.f('ix_plaid_holdings_user_id'), table_name='plaid_holdings')
    op.drop_index(op.f('ix_plaid_holdings_ticker_symbol'), table_name='plaid_holdings')
    op.drop_index(op.f('ix_plaid_holdings_account_id'), table_name='plaid_holdings')
    op.drop_index('ix_plaid_holdings_account', table_name='plaid_holdings')
    op.drop_table('plaid_holdings')

    op.drop_index(op.f('ix_plaid_transactions_user_id'), table_name='plaid_transactions')
    op.drop_index('ix_plaid_transactions_user_date', table_name='plaid_transactions')
    op.drop_index('ix_plaid_transactions_user_category', table_name='plaid_transactions')
    op.drop_index(op.f('ix_plaid_transactions_transaction_id'), table_name='plaid_transactions')
    op.drop_index(op.f('ix_plaid_transactions_date'), table_name='plaid_transactions')
    op.drop_index(op.f('ix_plaid_transactions_account_id'), table_name='plaid_transactions')
    op.drop_index('ix_plaid_transactions_account_date', table_name='plaid_transactions')
    op.drop_table('plaid_transactions')

    op.drop_index('ix_plaid_accounts_user_type', table_name='plaid_accounts')
    op.drop_index(op.f('ix_plaid_accounts_user_id'), table_name='plaid_accounts')
    op.drop_index('ix_plaid_accounts_user_active', table_name='plaid_accounts')
    op.drop_index(op.f('ix_plaid_accounts_persistent_account_id'), table_name='plaid_accounts')
    op.drop_index(op.f('ix_plaid_accounts_item_id'), table_name='plaid_accounts')
    op.drop_index(op.f('ix_plaid_accounts_account_id'), table_name='plaid_accounts')
    op.drop_table('plaid_accounts')

    op.drop_index(op.f('ix_plaid_items_user_id'), table_name='plaid_items')
    op.drop_index(op.f('ix_plaid_items_item_id'), table_name='plaid_items')
    op.drop_table('plaid_items')
