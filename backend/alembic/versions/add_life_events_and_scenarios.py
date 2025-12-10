"""Add life events and historical scenarios tables

Revision ID: add_life_events_scenarios
Revises: add_goal_planning_features
Create Date: 2025-11-02 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_life_events_scenarios'
down_revision = 'add_goal_planning_features'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create life_events table
    op.create_table(
        'life_events',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('goal_id', sa.String(), nullable=True),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('start_year', sa.Integer(), nullable=False),
        sa.Column('duration_years', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('probability', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('enabled', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('financial_impact', sa.JSON(), nullable=False),
        sa.Column('simulation_results', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('last_simulated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['goal_id'], ['goals.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_life_events_id', 'life_events', ['id'])
    op.create_index('ix_life_events_user_id', 'life_events', ['user_id'])
    op.create_index('ix_life_events_goal_id', 'life_events', ['goal_id'])
    op.create_index('ix_life_events_event_type', 'life_events', ['event_type'])

    # Create event_templates table
    op.create_table(
        'event_templates',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('default_parameters', sa.JSON(), nullable=False),
        sa.Column('usage_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('average_rating', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_event_templates_id', 'event_templates', ['id'])
    op.create_index('ix_event_templates_event_type', 'event_templates', ['event_type'])

    # Create historical_scenarios table
    op.create_table(
        'historical_scenarios',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('period', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('start_date', sa.String(), nullable=False),
        sa.Column('end_date', sa.String(), nullable=False),
        sa.Column('duration_months', sa.Integer(), nullable=False),
        sa.Column('returns_data', sa.JSON(), nullable=False),
        sa.Column('max_drawdown_stocks', sa.Float(), nullable=True),
        sa.Column('max_drawdown_bonds', sa.Float(), nullable=True),
        sa.Column('recovery_months', sa.Integer(), nullable=True),
        sa.Column('volatility_stocks', sa.Float(), nullable=True),
        sa.Column('volatility_bonds', sa.Float(), nullable=True),
        sa.Column('key_events', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('usage_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('source', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_historical_scenarios_id', 'historical_scenarios', ['id'])
    op.create_index('ix_historical_scenarios_period', 'historical_scenarios', ['period'])
    op.create_index('ix_historical_scenarios_is_active', 'historical_scenarios', ['is_active'])
    op.create_index('ix_historical_scenarios_is_featured', 'historical_scenarios', ['is_featured'])


def downgrade() -> None:
    # Drop historical_scenarios table
    op.drop_index('ix_historical_scenarios_is_featured', 'historical_scenarios')
    op.drop_index('ix_historical_scenarios_is_active', 'historical_scenarios')
    op.drop_index('ix_historical_scenarios_period', 'historical_scenarios')
    op.drop_index('ix_historical_scenarios_id', 'historical_scenarios')
    op.drop_table('historical_scenarios')

    # Drop event_templates table
    op.drop_index('ix_event_templates_event_type', 'event_templates')
    op.drop_index('ix_event_templates_id', 'event_templates')
    op.drop_table('event_templates')

    # Drop life_events table
    op.drop_index('ix_life_events_event_type', 'life_events')
    op.drop_index('ix_life_events_goal_id', 'life_events')
    op.drop_index('ix_life_events_user_id', 'life_events')
    op.drop_index('ix_life_events_id', 'life_events')
    op.drop_table('life_events')
