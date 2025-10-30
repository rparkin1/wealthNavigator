"""add recurring transactions

Revision ID: 005
Revises: 004
Create Date: 2025-10-30 00:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '005'
down_revision: Union[str, None] = '004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create recurring_transactions table
    op.create_table(
        'recurring_transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('frequency', sa.String(20), nullable=False),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('is_fixed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notes', sa.String(1000), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('last_generated_date', sa.DateTime(), nullable=True),
        sa.Column('next_generation_date', sa.DateTime(), nullable=False),
        sa.Column('total_generated', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_occurrences', sa.Integer(), nullable=True),
        sa.Column('auto_generate', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('days_ahead', sa.Integer(), nullable=False, server_default='7'),
        sa.Column('reminder_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('reminder_days_before', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for recurring_transactions
    op.create_index('idx_recurring_transactions_id', 'recurring_transactions', ['id'])
    op.create_index('idx_recurring_transactions_user_id', 'recurring_transactions', ['user_id'])
    op.create_index('idx_recurring_user_status', 'recurring_transactions', ['user_id', 'status'])
    op.create_index('idx_recurring_next_generation', 'recurring_transactions', ['next_generation_date', 'status'])
    op.create_index('idx_recurring_auto_generate', 'recurring_transactions', ['auto_generate', 'status'])

    # Create recurring_transaction_history table
    op.create_table(
        'recurring_transaction_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('recurring_transaction_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('budget_entry_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('generated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('generation_date', sa.DateTime(), nullable=False),
        sa.Column('was_manual', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['recurring_transaction_id'], ['recurring_transactions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['budget_entry_id'], ['budget_entries.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for recurring_transaction_history
    op.create_index('idx_recurring_history_id', 'recurring_transaction_history', ['id'])
    op.create_index('idx_recurring_history_recurring_id', 'recurring_transaction_history', ['recurring_transaction_id'])
    op.create_index('idx_recurring_history_budget_id', 'recurring_transaction_history', ['budget_entry_id'])
    op.create_index('idx_recurring_history_generated_at', 'recurring_transaction_history', ['generated_at'])

    # Add recurring_transaction_id column to budget_entries
    op.add_column('budget_entries', sa.Column('recurring_transaction_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        'fk_budget_entries_recurring_transaction_id',
        'budget_entries',
        'recurring_transactions',
        ['recurring_transaction_id'],
        ['id'],
        ondelete='SET NULL'
    )
    op.create_index('idx_budget_entries_recurring_id', 'budget_entries', ['recurring_transaction_id'])


def downgrade() -> None:
    # Drop foreign key and column from budget_entries
    op.drop_index('idx_budget_entries_recurring_id', 'budget_entries')
    op.drop_constraint('fk_budget_entries_recurring_transaction_id', 'budget_entries', type_='foreignkey')
    op.drop_column('budget_entries', 'recurring_transaction_id')

    # Drop indexes for recurring_transaction_history
    op.drop_index('idx_recurring_history_generated_at', 'recurring_transaction_history')
    op.drop_index('idx_recurring_history_budget_id', 'recurring_transaction_history')
    op.drop_index('idx_recurring_history_recurring_id', 'recurring_transaction_history')
    op.drop_index('idx_recurring_history_id', 'recurring_transaction_history')

    # Drop recurring_transaction_history table
    op.drop_table('recurring_transaction_history')

    # Drop indexes for recurring_transactions
    op.drop_index('idx_recurring_auto_generate', 'recurring_transactions')
    op.drop_index('idx_recurring_next_generation', 'recurring_transactions')
    op.drop_index('idx_recurring_user_status', 'recurring_transactions')
    op.drop_index('idx_recurring_transactions_user_id', 'recurring_transactions')
    op.drop_index('idx_recurring_transactions_id', 'recurring_transactions')

    # Drop recurring_transactions table
    op.drop_table('recurring_transactions')
