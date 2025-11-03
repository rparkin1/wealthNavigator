"""Add goal planning features

Revision ID: add_goal_planning_features
Revises: add_tax_treatment_to_budget
Create Date: 2025-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_goal_planning_features'
down_revision = 'tax_treatment_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Add goal planning features:
    - Goal dependencies and relationships
    - Education funding fields
    - Milestone tracking
    - Shared resource allocation
    """

    # Create GoalDependencyType enum
    goal_dependency_type = postgresql.ENUM(
        'sequential',
        'conditional',
        'shared_resource',
        'mutually_exclusive',
        name='goaldependencytype'
    )
    goal_dependency_type.create(op.get_bind())

    # Create GoalStatus enum
    goal_status = postgresql.ENUM(
        'planning',
        'active',
        'on_hold',
        'achieved',
        'abandoned',
        'blocked',
        name='goalstatus'
    )
    goal_status.create(op.get_bind())

    # Add goal dependency fields
    op.add_column('goals', sa.Column('status', sa.String(20), server_default='active', nullable=False))
    op.add_column('goals', sa.Column('depends_on_goal_id', sa.String(36), nullable=True))
    op.add_column('goals', sa.Column('dependency_type', sa.String(30), nullable=True))

    # Add shared resource allocation fields
    op.add_column('goals', sa.Column('allocated_accounts', sa.String(500), nullable=True))
    op.add_column('goals', sa.Column('funding_percentage', sa.Float(), server_default='100.0', nullable=False))

    # Add education-specific fields
    op.add_column('goals', sa.Column('child_name', sa.String(100), nullable=True))
    op.add_column('goals', sa.Column('child_age', sa.Integer(), nullable=True))
    op.add_column('goals', sa.Column('education_type', sa.String(50), nullable=True))
    op.add_column('goals', sa.Column('years_of_support', sa.Integer(), nullable=True))

    # Add milestone tracking field (JSON array)
    op.add_column('goals', sa.Column('milestones', sa.String(2000), nullable=True))

    # Create foreign key constraint for self-referential relationship
    op.create_foreign_key(
        'fk_goals_depends_on_goal_id',
        'goals',
        'goals',
        ['depends_on_goal_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # Create indexes for better query performance
    op.create_index('idx_goals_status', 'goals', ['status'])
    op.create_index('idx_goals_depends_on', 'goals', ['depends_on_goal_id'])
    op.create_index('idx_goals_child_age', 'goals', ['child_age'])
    op.create_index('idx_goals_education_type', 'goals', ['education_type'])


def downgrade() -> None:
    """
    Remove goal planning features
    """

    # Drop indexes
    op.drop_index('idx_goals_education_type', table_name='goals')
    op.drop_index('idx_goals_child_age', table_name='goals')
    op.drop_index('idx_goals_depends_on', table_name='goals')
    op.drop_index('idx_goals_status', table_name='goals')

    # Drop foreign key constraint
    op.drop_constraint('fk_goals_depends_on_goal_id', 'goals', type_='foreignkey')

    # Drop columns
    op.drop_column('goals', 'milestones')
    op.drop_column('goals', 'years_of_support')
    op.drop_column('goals', 'education_type')
    op.drop_column('goals', 'child_age')
    op.drop_column('goals', 'child_name')
    op.drop_column('goals', 'funding_percentage')
    op.drop_column('goals', 'allocated_accounts')
    op.drop_column('goals', 'dependency_type')
    op.drop_column('goals', 'depends_on_goal_id')
    op.drop_column('goals', 'status')

    # Drop enums
    goal_status = postgresql.ENUM(name='goalstatus')
    goal_status.drop(op.get_bind())

    goal_dependency_type = postgresql.ENUM(name='goaldependencytype')
    goal_dependency_type.drop(op.get_bind())
