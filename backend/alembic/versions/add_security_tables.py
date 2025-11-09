"""add security tables

Revision ID: add_security_001
Revises: eae32684b4b7
Create Date: 2025-01-08

Adds tables for:
- audit_logs (security event tracking)
- mfa_secrets (multi-factor authentication)
- Updates users table with MFA relationship
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


# revision identifiers
revision = 'add_security_001'
down_revision = 'eae32684b4b7'  # Replace with your latest migration
branch_labels = None
depends_on = None


def upgrade():
    """Add security tables."""

    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('event_category', sa.String(50), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False, server_default='info'),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text, nullable=True),
        sa.Column('request_path', sa.String(500), nullable=True),
        sa.Column('request_method', sa.String(10), nullable=True),
        sa.Column('status_code', sa.Integer, nullable=True),
        sa.Column('metadata', JSON, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )

    # Create indexes for audit_logs
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'])
    op.create_index('ix_audit_logs_event_type', 'audit_logs', ['event_type'])
    op.create_index('ix_audit_logs_event_category', 'audit_logs', ['event_category'])
    op.create_index('ix_audit_logs_severity', 'audit_logs', ['severity'])
    op.create_index('ix_audit_logs_user_created', 'audit_logs', ['user_id', 'created_at'])
    op.create_index('ix_audit_logs_event_created', 'audit_logs', ['event_type', 'created_at'])
    op.create_index('ix_audit_logs_category_created', 'audit_logs', ['event_category', 'created_at'])
    op.create_index('ix_audit_logs_severity_created', 'audit_logs', ['severity', 'created_at'])

    # Create mfa_secrets table
    op.create_table(
        'mfa_secrets',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('secret_encrypted', sa.String(500), nullable=False),
        sa.Column('backup_codes_encrypted', sa.Text, nullable=True),
        sa.Column('is_enabled', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('last_verified_at', sa.DateTime, nullable=True),
        sa.Column('failed_attempts', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )

    # Create indexes for mfa_secrets
    op.create_index('ix_mfa_secrets_user_id', 'mfa_secrets', ['user_id'])


def downgrade():
    """Remove security tables."""

    # Drop mfa_secrets table
    op.drop_index('ix_mfa_secrets_user_id', 'mfa_secrets')
    op.drop_table('mfa_secrets')

    # Drop audit_logs table
    op.drop_index('ix_audit_logs_severity_created', 'audit_logs')
    op.drop_index('ix_audit_logs_category_created', 'audit_logs')
    op.drop_index('ix_audit_logs_event_created', 'audit_logs')
    op.drop_index('ix_audit_logs_user_created', 'audit_logs')
    op.drop_index('ix_audit_logs_severity', 'audit_logs')
    op.drop_index('ix_audit_logs_event_category', 'audit_logs')
    op.drop_index('ix_audit_logs_event_type', 'audit_logs')
    op.drop_index('ix_audit_logs_user_id', 'audit_logs')
    op.drop_table('audit_logs')
