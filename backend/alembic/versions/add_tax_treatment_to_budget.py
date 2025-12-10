"""add tax treatment to budget entries

Revision ID: tax_treatment_001
Revises: previous_migration
Create Date: 2025-11-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'tax_treatment_001'
down_revision = '4e8dce1e3b6f'  # Plaid tables migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add tax treatment fields to budget_entries table."""

    # Create TaxTreatment enum type
    tax_treatment_enum = postgresql.ENUM(
        'ordinary_income',
        'qualified_dividends',
        'long_term_capital_gains',
        'short_term_capital_gains',
        'tax_exempt',
        'tax_deferred',
        'non_taxable',
        'self_employment',
        'rental_income',
        'social_security',
        'pension',
        'other',
        name='taxtreatment',
        create_type=False  # Type created inline
    )
    tax_treatment_enum.create(op.get_bind(), checkfirst=True)

    # Add tax_treatment column
    op.add_column('budget_entries', sa.Column('tax_treatment', tax_treatment_enum, nullable=True))

    # Add is_pre_tax column (for pre-tax deductions like 401k, HSA)
    op.add_column('budget_entries', sa.Column('is_pre_tax', sa.Boolean(), nullable=False, server_default='false'))

    # Add is_deductible column (for tax deductible expenses)
    op.add_column('budget_entries', sa.Column('is_deductible', sa.Boolean(), nullable=False, server_default='false'))

    # Create index on tax_treatment for efficient queries
    op.create_index('idx_budget_tax_treatment', 'budget_entries', ['tax_treatment'], unique=False)


def downgrade() -> None:
    """Remove tax treatment fields from budget_entries table."""

    # Drop index
    op.drop_index('idx_budget_tax_treatment', table_name='budget_entries')

    # Drop columns
    op.drop_column('budget_entries', 'is_deductible')
    op.drop_column('budget_entries', 'is_pre_tax')
    op.drop_column('budget_entries', 'tax_treatment')

    # Drop enum type
    op.execute('DROP TYPE IF EXISTS taxtreatment')
