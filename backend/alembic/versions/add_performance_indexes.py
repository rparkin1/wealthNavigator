"""add_performance_indexes

Add database indexes for performance optimization - SAFE VERSION

Revision ID: perf_indexes_001
Revises: eae32684b4b7
Create Date: 2025-01-08

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = 'perf_indexes_001'
down_revision = 'eae32684b4b7'
branch_labels = None
depends_on = None


def table_exists(table_name: str) -> bool:
    """Check if a table exists in the database"""
    conn = op.get_bind()
    inspector = inspect(conn)
    return table_name in inspector.get_table_names()


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table"""
    if not table_exists(table_name):
        return False
    conn = op.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def index_exists(index_name: str) -> bool:
    """Check if an index already exists"""
    conn = op.get_bind()
    inspector = inspect(conn)
    for table_name in inspector.get_table_names():
        indexes = inspector.get_indexes(table_name)
        if any(idx['name'] == index_name for idx in indexes):
            return True
    return False


def safe_create_index(index_name: str, table_name: str, columns: list, unique: bool = False):
    """Safely create an index only if table and columns exist"""
    if not table_exists(table_name):
        print(f"⚠️  Skipping index {index_name}: table {table_name} does not exist")
        return

    for col in columns:
        if not column_exists(table_name, col):
            print(f"⚠️  Skipping index {index_name}: column {col} does not exist in {table_name}")
            return

    if index_exists(index_name):
        print(f"ℹ️  Index {index_name} already exists, skipping")
        return

    try:
        op.create_index(index_name, table_name, columns, unique=unique)
        print(f"✅ Created index: {index_name}")
    except Exception as e:
        print(f"⚠️  Failed to create index {index_name}: {e}")


def upgrade():
    """Add performance indexes safely"""
    print("\n🚀 Starting safe performance index creation...")

    # User-related indexes
    safe_create_index('idx_users_email', 'users', ['email'], unique=True)

    # Goal indexes
    safe_create_index('idx_goals_user_id', 'goals', ['user_id'])
    safe_create_index('idx_goals_target_date', 'goals', ['target_date'])
    safe_create_index('idx_goals_status', 'goals', ['status'])

    # Portfolio account indexes (check for both 'user_id' and 'owner_id')
    if column_exists('accounts', 'user_id'):
        safe_create_index('idx_accounts_user_id', 'accounts', ['user_id'])
    elif column_exists('accounts', 'owner_id'):
        safe_create_index('idx_accounts_owner_id', 'accounts', ['owner_id'])

    safe_create_index('idx_accounts_type', 'accounts', ['account_type'])

    # Holdings indexes
    safe_create_index('idx_holdings_account_id', 'holdings', ['account_id'])

    # Transaction indexes (if table exists)
    safe_create_index('idx_transactions_user_id', 'transactions', ['user_id'])
    safe_create_index('idx_transactions_date', 'transactions', ['transaction_date'])

    # Budget indexes
    safe_create_index('idx_budget_entries_user_id', 'budget_entries', ['user_id'])
    safe_create_index('idx_budget_entries_category', 'budget_entries', ['category'])
    safe_create_index('idx_budget_entries_date', 'budget_entries', ['entry_date'])

    # Thread indexes
    safe_create_index('idx_threads_user_id', 'threads', ['user_id'])
    safe_create_index('idx_threads_created_at', 'threads', ['created_at'])

    # Simulation indexes
    safe_create_index('idx_simulations_goal_id', 'simulations', ['goal_id'])
    safe_create_index('idx_simulations_user_id', 'simulations', ['user_id'])
    safe_create_index('idx_simulations_created_at', 'simulations', ['created_at'])

    # Plaid indexes
    safe_create_index('idx_plaid_items_user_id', 'plaid_items', ['user_id'])
    safe_create_index('idx_plaid_accounts_item_id', 'plaid_accounts', ['plaid_item_id'])
    safe_create_index('idx_plaid_accounts_account_id', 'plaid_accounts', ['account_id'])

    # Composite indexes for common queries (only if all columns exist)
    if column_exists('goals', 'user_id') and column_exists('goals', 'status'):
        safe_create_index('idx_goals_user_status', 'goals', ['user_id', 'status'])

    if column_exists('goals', 'user_id') and column_exists('goals', 'priority'):
        safe_create_index('idx_goals_user_priority', 'goals', ['user_id', 'priority'])

    if column_exists('transactions', 'user_id') and column_exists('transactions', 'transaction_date'):
        safe_create_index('idx_transactions_user_date', 'transactions', ['user_id', 'transaction_date'])

    if column_exists('budget_entries', 'user_id') and column_exists('budget_entries', 'entry_date'):
        safe_create_index('idx_budget_entries_user_date', 'budget_entries', ['user_id', 'entry_date'])

    print("\n✅ Performance indexes creation complete!\n")


def downgrade():
    """Remove performance indexes safely"""
    print("\n🔄 Removing performance indexes...")

    indexes_to_remove = [
        ('idx_users_email', 'users'),
        ('idx_goals_user_id', 'goals'),
        ('idx_goals_target_date', 'goals'),
        ('idx_goals_status', 'goals'),
        ('idx_goals_user_status', 'goals'),
        ('idx_goals_user_priority', 'goals'),
        ('idx_accounts_user_id', 'accounts'),
        ('idx_accounts_owner_id', 'accounts'),
        ('idx_accounts_type', 'accounts'),
        ('idx_holdings_account_id', 'holdings'),
        ('idx_transactions_user_id', 'transactions'),
        ('idx_transactions_date', 'transactions'),
        ('idx_transactions_user_date', 'transactions'),
        ('idx_budget_entries_user_id', 'budget_entries'),
        ('idx_budget_entries_category', 'budget_entries'),
        ('idx_budget_entries_date', 'budget_entries'),
        ('idx_budget_entries_user_date', 'budget_entries'),
        ('idx_threads_user_id', 'threads'),
        ('idx_threads_created_at', 'threads'),
        ('idx_simulations_goal_id', 'simulations'),
        ('idx_simulations_user_id', 'simulations'),
        ('idx_simulations_created_at', 'simulations'),
        ('idx_plaid_items_user_id', 'plaid_items'),
        ('idx_plaid_accounts_item_id', 'plaid_accounts'),
        ('idx_plaid_accounts_account_id', 'plaid_accounts'),
    ]

    for index_name, table_name in indexes_to_remove:
        if table_exists(table_name) and index_exists(index_name):
            try:
                op.drop_index(index_name, table_name=table_name)
                print(f"✅ Dropped index: {index_name}")
            except Exception as e:
                print(f"⚠️  Failed to drop index {index_name}: {e}")

    print("\n✅ Performance indexes removal complete!\n")
