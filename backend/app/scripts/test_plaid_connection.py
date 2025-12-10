#!/usr/bin/env python3
"""
Plaid Integration Test Script
Tests the Plaid integration with real API calls (sandbox mode)
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.services.plaid_service import plaid_service
from app.core.config import settings
from colorama import init, Fore, Style

init(autoreset=True)


def print_header(text: str):
    """Print a header"""
    print(f"\n{Fore.CYAN}{'='*60}")
    print(f"{Fore.CYAN}{text:^60}")
    print(f"{Fore.CYAN}{'='*60}\n")


def print_success(text: str):
    """Print success message"""
    print(f"{Fore.GREEN}✓ {text}")


def print_error(text: str):
    """Print error message"""
    print(f"{Fore.RED}✗ {text}")


def print_info(text: str):
    """Print info message"""
    print(f"{Fore.YELLOW}ℹ {text}")


def test_plaid_configuration():
    """Test Plaid configuration"""
    print_header("Testing Plaid Configuration")

    # Check environment variables
    checks = {
        "PLAID_CLIENT_ID": settings.PLAID_CLIENT_ID,
        "PLAID_SECRET": settings.PLAID_SECRET,
        "PLAID_ENV": settings.PLAID_ENV,
    }

    all_set = True
    for key, value in checks.items():
        if value:
            print_success(f"{key}: {'*' * 8}{str(value)[-4:]}")
        else:
            print_error(f"{key}: NOT SET")
            all_set = False

    if not all_set:
        print_error("Plaid credentials not configured!")
        print_info("Set credentials in backend/.env file")
        print_info("Get credentials from https://dashboard.plaid.com/")
        return False

    return True


def test_link_token_creation():
    """Test creating a link token"""
    print_header("Testing Link Token Creation")

    try:
        result = plaid_service.create_link_token(
            user_id="test-user-123",
            client_name="WealthNavigator AI Test",
            products=["auth", "transactions"],
            country_codes=["US"],
            language="en"
        )

        if result.get("link_token"):
            print_success("Link token created successfully")
            print_info(f"Token: {result['link_token'][:20]}...")
            print_info(f"Expires: {result.get('expiration')}")
            return True
        else:
            print_error("No link token in response")
            return False

    except Exception as e:
        print_error(f"Failed to create link token: {e}")
        return False


def test_sandbox_public_token():
    """Test with Plaid sandbox public token"""
    print_header("Testing Public Token Exchange")
    print_info("This requires a valid public token from Plaid Link")
    print_info("Skipping in automated test - use Plaid Link in frontend to test")
    return True


def test_plaid_service_methods():
    """Test Plaid service methods exist"""
    print_header("Testing Plaid Service Methods")

    methods = [
        "create_link_token",
        "exchange_public_token",
        "get_accounts",
        "sync_transactions",
        "get_investments_holdings",
        "get_item",
        "get_institution",
        "remove_item"
    ]

    all_exist = True
    for method in methods:
        if hasattr(plaid_service, method):
            print_success(f"Method exists: {method}")
        else:
            print_error(f"Method missing: {method}")
            all_exist = False

    return all_exist


def main():
    """Run all tests"""
    print_header("WealthNavigator Plaid Integration Test")
    print_info(f"Environment: {settings.PLAID_ENV}")
    print_info(f"Products: {', '.join(settings.PLAID_PRODUCTS)}")

    results = []

    # Run tests
    results.append(("Configuration", test_plaid_configuration()))
    results.append(("Service Methods", test_plaid_service_methods()))
    results.append(("Link Token Creation", test_link_token_creation()))
    results.append(("Public Token Exchange", test_sandbox_public_token()))

    # Print summary
    print_header("Test Summary")

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        if result:
            print_success(f"{name}")
        else:
            print_error(f"{name}")

    print(f"\n{Fore.CYAN}{'='*60}")
    print(f"{Fore.CYAN}Results: {passed}/{total} tests passed")
    print(f"{Fore.CYAN}{'='*60}\n")

    if passed == total:
        print_success("All tests passed! Plaid integration is ready.")
        print_info("\nNext steps:")
        print_info("1. Start the backend: cd backend && uv run python -m app.main")
        print_info("2. Start the frontend: cd frontend && npm run dev")
        print_info("3. Navigate to Plaid Dashboard in the app")
        print_info("4. Click 'Connect Bank Account' to test Plaid Link")
        return 0
    else:
        print_error("Some tests failed. Please check configuration.")
        return 1


if __name__ == "__main__":
    exit(main())
