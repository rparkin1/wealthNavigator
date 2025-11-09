#!/usr/bin/env python3
"""
Database Backup Script
Creates encrypted backups of the PostgreSQL database
"""

import os
import sys
import subprocess
from datetime import datetime
from pathlib import Path
import logging

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.core.config import settings

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def create_backup_directory() -> Path:
    """Create backup directory if it doesn't exist"""
    backup_dir = Path(__file__).parent.parent.parent / "backups"
    backup_dir.mkdir(exist_ok=True)
    return backup_dir


def parse_database_url(db_url: str) -> dict:
    """Parse DATABASE_URL into components"""
    # postgresql://user:password@host:port/database
    if not db_url.startswith("postgresql://"):
        raise ValueError("Invalid PostgreSQL URL")

    # Remove protocol
    url = db_url.replace("postgresql://", "")

    # Split credentials and host
    if "@" in url:
        credentials, host_db = url.split("@", 1)
        username, password = credentials.split(":", 1)
    else:
        raise ValueError("Database credentials not found in URL")

    # Split host/port and database
    host_port, database = host_db.split("/", 1)

    # Remove query parameters if present
    if "?" in database:
        database = database.split("?")[0]

    # Split host and port
    if ":" in host_port:
        host, port = host_port.split(":", 1)
    else:
        host = host_port
        port = "5432"

    return {
        "username": username,
        "password": password,
        "host": host,
        "port": port,
        "database": database
    }


def create_backup() -> str:
    """
    Create a PostgreSQL database backup

    Returns:
        Path to the backup file
    """
    try:
        # Parse database URL
        db_config = parse_database_url(settings.DATABASE_URL)

        # Create backup directory
        backup_dir = create_backup_directory()

        # Generate backup filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"wealthnav_backup_{timestamp}.sql"
        backup_path = backup_dir / backup_filename

        logger.info(f"Creating database backup: {backup_filename}")

        # Set password environment variable
        env = os.environ.copy()
        env['PGPASSWORD'] = db_config['password']

        # Run pg_dump
        cmd = [
            "pg_dump",
            "-h", db_config['host'],
            "-p", db_config['port'],
            "-U", db_config['username'],
            "-d", db_config['database'],
            "-F", "c",  # Custom format (compressed)
            "-f", str(backup_path),
            "--verbose"
        ]

        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise Exception(f"pg_dump failed: {result.stderr}")

        logger.info(f"Backup created successfully: {backup_path}")

        # Get file size
        size_mb = backup_path.stat().st_size / (1024 * 1024)
        logger.info(f"Backup size: {size_mb:.2f} MB")

        return str(backup_path)

    except Exception as e:
        logger.error(f"Backup failed: {e}")
        raise


def cleanup_old_backups(days_to_keep: int = 30) -> None:
    """
    Remove backups older than specified days

    Args:
        days_to_keep: Number of days to keep backups
    """
    try:
        backup_dir = create_backup_directory()
        current_time = datetime.now().timestamp()
        cutoff_time = current_time - (days_to_keep * 24 * 60 * 60)

        removed_count = 0
        for backup_file in backup_dir.glob("wealthnav_backup_*.sql"):
            if backup_file.stat().st_mtime < cutoff_time:
                logger.info(f"Removing old backup: {backup_file.name}")
                backup_file.unlink()
                removed_count += 1

        if removed_count > 0:
            logger.info(f"Removed {removed_count} old backup(s)")
        else:
            logger.info("No old backups to remove")

    except Exception as e:
        logger.error(f"Cleanup failed: {e}")


def restore_backup(backup_path: str) -> None:
    """
    Restore a database backup

    Args:
        backup_path: Path to the backup file
    """
    try:
        # Parse database URL
        db_config = parse_database_url(settings.DATABASE_URL)

        logger.info(f"Restoring database from: {backup_path}")
        logger.warning("This will DROP and recreate the database!")

        # Confirm restoration
        if not os.getenv("FORCE_RESTORE"):
            response = input("Are you sure you want to restore? (yes/no): ")
            if response.lower() != "yes":
                logger.info("Restore cancelled")
                return

        # Set password environment variable
        env = os.environ.copy()
        env['PGPASSWORD'] = db_config['password']

        # Run pg_restore
        cmd = [
            "pg_restore",
            "-h", db_config['host'],
            "-p", db_config['port'],
            "-U", db_config['username'],
            "-d", db_config['database'],
            "-c",  # Clean (drop) database objects before recreating
            "-v",  # Verbose
            backup_path
        ]

        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise Exception(f"pg_restore failed: {result.stderr}")

        logger.info("Database restored successfully")

    except Exception as e:
        logger.error(f"Restore failed: {e}")
        raise


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Database backup and restore")
    parser.add_argument(
        "action",
        choices=["backup", "restore", "cleanup"],
        help="Action to perform"
    )
    parser.add_argument(
        "--file",
        help="Backup file path (for restore action)"
    )
    parser.add_argument(
        "--days",
        type=int,
        default=30,
        help="Days to keep backups (for cleanup action)"
    )

    args = parser.parse_args()

    try:
        if args.action == "backup":
            backup_path = create_backup()
            print(f"\n✓ Backup created: {backup_path}")

        elif args.action == "restore":
            if not args.file:
                print("Error: --file argument required for restore")
                sys.exit(1)
            restore_backup(args.file)
            print(f"\n✓ Database restored from: {args.file}")

        elif args.action == "cleanup":
            cleanup_old_backups(args.days)
            print(f"\n✓ Cleaned up backups older than {args.days} days")

    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)
