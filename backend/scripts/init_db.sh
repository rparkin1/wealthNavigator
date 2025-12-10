#!/bin/bash
# Database initialization script

set -e

echo "Waiting for PostgreSQL to start..."
sleep 2

echo "Creating initial migration..."
cd /Users/robparkin/code/finance/wealthNavigator/backend
uv run alembic revision --autogenerate -m "Initial migration"

echo "Running migrations..."
uv run alembic upgrade head

echo "Database initialized successfully!"
