"""
Role-Based Access Control (RBAC)
Implements permission-based authorization for enhanced security
"""

from enum import Enum
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User


class Permission(str, Enum):
    """
    System permissions that can be assigned to roles.

    Granular permissions for different operations:
    - READ: View data
    - WRITE: Create/update data
    - DELETE: Delete data
    - ADMIN: Administrative operations
    """

    # User management
    USER_READ = "user:read"
    USER_WRITE = "user:write"
    USER_DELETE = "user:delete"
    USER_ADMIN = "user:admin"

    # Goal management
    GOAL_READ = "goal:read"
    GOAL_WRITE = "goal:write"
    GOAL_DELETE = "goal:delete"

    # Portfolio management
    PORTFOLIO_READ = "portfolio:read"
    PORTFOLIO_WRITE = "portfolio:write"
    PORTFOLIO_DELETE = "portfolio:delete"

    # Budget management
    BUDGET_READ = "budget:read"
    BUDGET_WRITE = "budget:write"
    BUDGET_DELETE = "budget:delete"

    # Financial data
    PLAID_READ = "plaid:read"
    PLAID_WRITE = "plaid:write"
    PLAID_DELETE = "plaid:delete"

    # AI features
    AI_CHAT = "ai:chat"
    AI_ANALYSIS = "ai:analysis"

    # Simulations
    SIMULATION_RUN = "simulation:run"

    # Reports
    REPORT_VIEW = "report:view"
    REPORT_EXPORT = "report:export"

    # System administration
    SYSTEM_ADMIN = "system:admin"
    AUDIT_LOG_VIEW = "audit:view"


class Role(str, Enum):
    """
    User roles with predefined permission sets.

    Roles:
    - USER: Standard user with full access to their own data
    - ADMIN: System administrator with elevated permissions
    - READONLY: Read-only access (for advisors, family members)
    - DEMO: Limited access for demo accounts
    """

    USER = "user"
    ADMIN = "admin"
    READONLY = "readonly"
    DEMO = "demo"


# Role to permissions mapping
ROLE_PERMISSIONS = {
    Role.USER: [
        # Full access to own data
        Permission.USER_READ,
        Permission.USER_WRITE,
        Permission.GOAL_READ,
        Permission.GOAL_WRITE,
        Permission.GOAL_DELETE,
        Permission.PORTFOLIO_READ,
        Permission.PORTFOLIO_WRITE,
        Permission.PORTFOLIO_DELETE,
        Permission.BUDGET_READ,
        Permission.BUDGET_WRITE,
        Permission.BUDGET_DELETE,
        Permission.PLAID_READ,
        Permission.PLAID_WRITE,
        Permission.PLAID_DELETE,
        Permission.AI_CHAT,
        Permission.AI_ANALYSIS,
        Permission.SIMULATION_RUN,
        Permission.REPORT_VIEW,
        Permission.REPORT_EXPORT,
    ],
    Role.ADMIN: [
        # All permissions including system admin
        *[p for p in Permission],
    ],
    Role.READONLY: [
        # Read-only access
        Permission.USER_READ,
        Permission.GOAL_READ,
        Permission.PORTFOLIO_READ,
        Permission.BUDGET_READ,
        Permission.PLAID_READ,
        Permission.REPORT_VIEW,
    ],
    Role.DEMO: [
        # Limited access for demo accounts
        Permission.USER_READ,
        Permission.GOAL_READ,
        Permission.GOAL_WRITE,
        Permission.PORTFOLIO_READ,
        Permission.BUDGET_READ,
        Permission.AI_CHAT,
        Permission.SIMULATION_RUN,
        Permission.REPORT_VIEW,
    ],
}


class RBACService:
    """Service for role-based access control operations."""

    @staticmethod
    def get_user_role(user: User) -> Role:
        """
        Get the role for a user.

        Args:
            user: User object

        Returns:
            User's role
        """
        # Check if user is superuser
        if user.is_superuser:
            return Role.ADMIN

        # Get role from user preferences (or default to USER)
        if user.preferences and "role" in user.preferences:
            role_str = user.preferences["role"]
            try:
                return Role(role_str)
            except ValueError:
                return Role.USER

        return Role.USER

    @staticmethod
    def get_role_permissions(role: Role) -> List[Permission]:
        """
        Get all permissions for a role.

        Args:
            role: User role

        Returns:
            List of permissions
        """
        return ROLE_PERMISSIONS.get(role, [])

    @staticmethod
    def has_permission(user: User, permission: Permission) -> bool:
        """
        Check if user has a specific permission.

        Args:
            user: User object
            permission: Permission to check

        Returns:
            True if user has permission
        """
        user_role = RBACService.get_user_role(user)
        user_permissions = RBACService.get_role_permissions(user_role)
        return permission in user_permissions

    @staticmethod
    def require_permission(permission: Permission):
        """
        Decorator to require a specific permission for an endpoint.

        Usage:
            @router.get("/admin/users")
            @RBACService.require_permission(Permission.USER_ADMIN)
            async def list_users(current_user: User = Depends(get_current_user)):
                ...

        Args:
            permission: Required permission

        Returns:
            Dependency function for FastAPI
        """

        async def permission_checker(
            current_user: User = Depends(get_current_user),
        ) -> User:
            if not RBACService.has_permission(current_user, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied. Required permission: {permission.value}",
                )
            return current_user

        return permission_checker

    @staticmethod
    def require_role(role: Role):
        """
        Decorator to require a specific role for an endpoint.

        Usage:
            @router.get("/admin/dashboard")
            @RBACService.require_role(Role.ADMIN)
            async def admin_dashboard(current_user: User = Depends(get_current_user)):
                ...

        Args:
            role: Required role

        Returns:
            Dependency function for FastAPI
        """

        async def role_checker(
            current_user: User = Depends(get_current_user),
        ) -> User:
            user_role = RBACService.get_user_role(current_user)
            if user_role != role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required role: {role.value}",
                )
            return current_user

        return role_checker


# Convenience functions for common permission checks
def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def require_user_or_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Require user or admin role (blocks readonly and demo)."""
    user_role = RBACService.get_user_role(current_user)
    if user_role not in [Role.USER, Role.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    return current_user
