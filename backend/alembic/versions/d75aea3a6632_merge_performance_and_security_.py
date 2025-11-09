"""merge performance and security migrations

Revision ID: d75aea3a6632
Revises: perf_indexes_001, add_security_001
Create Date: 2025-11-08 23:03:38.530963

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd75aea3a6632'
down_revision: Union[str, Sequence[str], None] = ('perf_indexes_001', 'add_security_001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
