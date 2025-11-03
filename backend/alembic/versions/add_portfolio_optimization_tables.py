"""add portfolio optimization tables

Revision ID: portfolio_opt_001
Revises: add_life_events_scenarios
Create Date: 2025-11-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'portfolio_opt_001'
down_revision = 'add_life_events_scenarios'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create portfolio optimization tables"""

    # Portfolio Optimizations table
    op.create_table(
        'portfolio_optimizations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('optimization_type', sa.String(50), nullable=False, index=True, comment='goal, account, household'),
        sa.Column('input_data', postgresql.JSONB, nullable=False, comment='Input parameters for optimization'),
        sa.Column('result_data', postgresql.JSONB, nullable=False, comment='Complete optimization results'),

        # Key metrics (denormalized for quick querying)
        sa.Column('expected_return', sa.Float, nullable=True),
        sa.Column('expected_volatility', sa.Float, nullable=True),
        sa.Column('sharpe_ratio', sa.Float, nullable=True),
        sa.Column('diversification_score', sa.Float, nullable=True),
        sa.Column('tax_drag', sa.Float, nullable=True, comment='Estimated annual tax cost'),
        sa.Column('location_efficiency', sa.Float, nullable=True, comment='Asset location efficiency 0-1'),

        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, index=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),

        # Indexes
        sa.Index('idx_portfolio_opt_user_created', 'user_id', 'created_at'),
        sa.Index('idx_portfolio_opt_type', 'optimization_type'),
    )

    # Portfolio Insights table
    op.create_table(
        'portfolio_insights',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('optimization_id', sa.String(36), sa.ForeignKey('portfolio_optimizations.id', ondelete='CASCADE'), nullable=True, index=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),

        # Insight details
        sa.Column('category', sa.String(50), nullable=False, index=True, comment='diversification, risk, performance, tax, esg, goals'),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('impact', sa.String(20), nullable=False, comment='positive, negative, neutral'),
        sa.Column('confidence', sa.Float, nullable=False, comment='Confidence score 0.0-1.0'),
        sa.Column('data', postgresql.JSONB, nullable=True, comment='Additional insight data'),

        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, index=True),
        sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True),

        # Indexes
        sa.Index('idx_insights_user_category', 'user_id', 'category'),
        sa.Index('idx_insights_impact', 'impact'),
    )

    # Portfolio Alerts table
    op.create_table(
        'portfolio_alerts',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),

        # Alert details
        sa.Column('alert_type', sa.String(50), nullable=False, index=True,
                 comment='rebalancing_needed, drift_threshold, concentration_risk, underperformance, tax_loss_opportunity, high_fees, esg_violation, goal_off_track, market_volatility'),
        sa.Column('severity', sa.String(20), nullable=False, index=True, comment='info, warning, critical'),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('recommendation', sa.Text, nullable=False),
        sa.Column('data', postgresql.JSONB, nullable=True, comment='Additional alert data'),

        # Status tracking
        sa.Column('acknowledged', sa.Boolean, default=False, nullable=False, index=True),
        sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved', sa.Boolean, default=False, nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),

        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, index=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True, comment='Optional expiration for time-sensitive alerts'),

        # Indexes
        sa.Index('idx_alerts_user_unack', 'user_id', 'acknowledged'),
        sa.Index('idx_alerts_severity', 'severity'),
        sa.Index('idx_alerts_type', 'alert_type'),
    )

    # ESG Profiles table (user custom ESG profiles/overrides)
    op.create_table(
        'esg_profiles',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('asset_code', sa.String(50), nullable=False, index=True),

        # ESG data
        sa.Column('esg_rating', sa.String(20), nullable=True, comment='leader, average, laggard, not_rated'),
        sa.Column('environmental_score', sa.Float, nullable=True),
        sa.Column('social_score', sa.Float, nullable=True),
        sa.Column('governance_score', sa.Float, nullable=True),
        sa.Column('overall_score', sa.Float, nullable=True),
        sa.Column('exclusions', postgresql.ARRAY(sa.String), nullable=True),
        sa.Column('positive_screens', postgresql.ARRAY(sa.String), nullable=True),
        sa.Column('controversies', postgresql.ARRAY(sa.String), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),

        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),

        # Unique constraint
        sa.UniqueConstraint('user_id', 'asset_code', name='uq_user_asset_esg'),

        # Indexes
        sa.Index('idx_esg_profiles_user', 'user_id'),
        sa.Index('idx_esg_profiles_asset', 'asset_code'),
    )

    # Portfolio Rebalancing History table
    op.create_table(
        'portfolio_rebalancing_history',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('optimization_id', sa.String(36), sa.ForeignKey('portfolio_optimizations.id', ondelete='SET NULL'), nullable=True),

        # Rebalancing details
        sa.Column('rebalancing_type', sa.String(50), nullable=False, comment='threshold, calendar, tax_optimized'),
        sa.Column('trigger_reason', sa.String(200), nullable=True, comment='What triggered the rebalancing'),
        sa.Column('max_drift_percentage', sa.Float, nullable=True),
        sa.Column('pre_rebalance_allocation', postgresql.JSONB, nullable=False),
        sa.Column('post_rebalance_allocation', postgresql.JSONB, nullable=False),
        sa.Column('trades_executed', postgresql.JSONB, nullable=True),
        sa.Column('estimated_tax_cost', sa.Float, nullable=True),
        sa.Column('actual_tax_cost', sa.Float, nullable=True),

        # Status
        sa.Column('status', sa.String(20), nullable=False, default='pending', comment='pending, executed, cancelled'),
        sa.Column('executed_at', sa.DateTime(timezone=True), nullable=True),

        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, index=True),

        # Indexes
        sa.Index('idx_rebal_history_user_date', 'user_id', 'created_at'),
        sa.Index('idx_rebal_history_status', 'status'),
    )

    # Comments for documentation
    op.execute("""
        COMMENT ON TABLE portfolio_optimizations IS 'Stores portfolio optimization results (goal, account, household level)';
        COMMENT ON TABLE portfolio_insights IS 'Portfolio insights generated by analysis (diversification, risk, performance, tax, ESG, goals)';
        COMMENT ON TABLE portfolio_alerts IS 'Proactive portfolio alerts (rebalancing, concentration, underperformance, fees, tax-loss harvesting)';
        COMMENT ON TABLE esg_profiles IS 'User-customized ESG profiles and asset ratings';
        COMMENT ON TABLE portfolio_rebalancing_history IS 'History of portfolio rebalancing actions';
    """)


def downgrade() -> None:
    """Drop portfolio optimization tables"""
    op.drop_table('portfolio_rebalancing_history')
    op.drop_table('esg_profiles')
    op.drop_table('portfolio_alerts')
    op.drop_table('portfolio_insights')
    op.drop_table('portfolio_optimizations')
