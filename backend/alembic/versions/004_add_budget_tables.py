"""add budget tables

Revision ID: 004
Revises: 003
Create Date: 2025-10-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = 'f22e9dae9df9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create budget_entries table
    op.create_table(
        'budget_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('frequency', sa.String(20), nullable=False),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('is_fixed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notes', sa.String(1000), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=True),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('extraction_method', sa.String(50), nullable=False, server_default='manual'),
        sa.Column('extraction_confidence', sa.Float(), nullable=True),
        sa.Column('extracted_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for budget_entries
    op.create_index('idx_budget_entries_id', 'budget_entries', ['id'])
    op.create_index('idx_budget_entries_user_id', 'budget_entries', ['user_id'])
    op.create_index('idx_budget_entries_category', 'budget_entries', ['category'])
    op.create_index('idx_budget_entries_type', 'budget_entries', ['type'])
    op.create_index('idx_budget_user_type', 'budget_entries', ['user_id', 'type'])
    op.create_index('idx_budget_user_category', 'budget_entries', ['user_id', 'category'])
    op.create_index('idx_budget_created_at', 'budget_entries', ['created_at'])
    op.create_index('idx_budget_deleted_at', 'budget_entries', ['deleted_at'])

    # Create budget_analyses table
    op.create_table(
        'budget_analyses',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('analysis_type', sa.String(50), nullable=False),
        sa.Column('health_score', sa.Float(), nullable=True),
        sa.Column('health_category', sa.String(50), nullable=True),
        sa.Column('savings_rate', sa.Float(), nullable=True),
        sa.Column('concerns', sa.String(5000), nullable=True),
        sa.Column('opportunities', sa.String(5000), nullable=True),
        sa.Column('recommendations', sa.String(5000), nullable=True),
        sa.Column('total_income', sa.Float(), nullable=True),
        sa.Column('total_expenses', sa.Float(), nullable=True),
        sa.Column('total_savings', sa.Float(), nullable=True),
        sa.Column('net_cash_flow', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for budget_analyses
    op.create_index('idx_budget_analyses_id', 'budget_analyses', ['id'])
    op.create_index('idx_budget_analyses_user_id', 'budget_analyses', ['user_id'])
    op.create_index('idx_budget_analyses_created_at', 'budget_analyses', ['created_at'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_budget_analyses_created_at', 'budget_analyses')
    op.drop_index('idx_budget_analyses_user_id', 'budget_analyses')
    op.drop_index('idx_budget_analyses_id', 'budget_analyses')

    op.drop_index('idx_budget_deleted_at', 'budget_entries')
    op.drop_index('idx_budget_created_at', 'budget_entries')
    op.drop_index('idx_budget_user_category', 'budget_entries')
    op.drop_index('idx_budget_user_type', 'budget_entries')
    op.drop_index('idx_budget_entries_type', 'budget_entries')
    op.drop_index('idx_budget_entries_category', 'budget_entries')
    op.drop_index('idx_budget_entries_user_id', 'budget_entries')
    op.drop_index('idx_budget_entries_id', 'budget_entries')

    # Drop tables
    op.drop_table('budget_analyses')
    op.drop_table('budget_entries')
