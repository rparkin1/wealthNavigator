"""
Plaid API service wrapper
Handles all interactions with the Plaid API
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, date
import plaid
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.transactions_sync_request import TransactionsSyncRequest as PlaidTransactionsSyncRequest
from plaid.model.investments_holdings_get_request import InvestmentsHoldingsGetRequest
from plaid.model.item_get_request import ItemGetRequest
from plaid.model.item_remove_request import ItemRemoveRequest
from plaid.model.institutions_get_by_id_request import InstitutionsGetByIdRequest

from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class PlaidService:
    """Service for interacting with Plaid API"""

    def __init__(self):
        """Initialize Plaid client"""
        # Map string environment to Plaid Environment enum
        env_map = {
            "sandbox": plaid.Environment.Sandbox,
            "development": plaid.Environment.Sandbox,  # Development uses Sandbox
            "production": plaid.Environment.Production
        }

        configuration = plaid.Configuration(
            host=env_map.get(settings.PLAID_ENV, plaid.Environment.Sandbox),
            api_key={
                'clientId': settings.PLAID_CLIENT_ID,
                'secret': settings.PLAID_SECRET,
            }
        )

        api_client = plaid.ApiClient(configuration)
        self.client = plaid_api.PlaidApi(api_client)

    def create_link_token(
        self,
        user_id: str,
        client_name: str = "WealthNavigator AI",
        products: Optional[List[str]] = None,
        country_codes: Optional[List[str]] = None,
        language: str = "en",
        webhook: Optional[str] = None,
        redirect_uri: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a Link token for Plaid Link initialization

        Args:
            user_id: Unique user identifier
            client_name: Name to display in Plaid Link
            products: List of Plaid products to enable
            country_codes: List of country codes
            language: Language code
            webhook: Webhook URL for notifications
            redirect_uri: OAuth redirect URI

        Returns:
            Dict containing link_token and expiration
        """
        try:
            # Use settings defaults if not provided
            if products is None:
                products = settings.PLAID_PRODUCTS
            if country_codes is None:
                country_codes = settings.PLAID_COUNTRY_CODES

            # Convert string products to Plaid Products enum
            product_enums = []
            product_map = {
                "auth": Products("auth"),
                "transactions": Products("transactions"),
                "investments": Products("investments"),
                "identity": Products("identity"),
                "liabilities": Products("liabilities"),
                "assets": Products("assets"),
            }
            for p in products:
                if p in product_map:
                    product_enums.append(product_map[p])

            # Convert string country codes to CountryCode enum
            country_code_enums = [CountryCode(code) for code in country_codes]

            # Build request parameters - only include webhook if provided
            request_params = {
                "user": LinkTokenCreateRequestUser(client_user_id=user_id),
                "client_name": client_name,
                "products": product_enums,
                "country_codes": country_code_enums,
                "language": language,
            }

            # Only add optional parameters if they have values
            if webhook:
                request_params["webhook"] = webhook
            # Only add redirect_uri if explicitly provided (not for sandbox testing)
            if redirect_uri:
                request_params["redirect_uri"] = redirect_uri

            request = LinkTokenCreateRequest(**request_params)

            response = self.client.link_token_create(request)

            # Convert expiration datetime to ISO string if needed
            expiration = response['expiration']
            if hasattr(expiration, 'isoformat'):
                expiration = expiration.isoformat()

            return {
                "link_token": response['link_token'],
                "expiration": expiration
            }

        except plaid.ApiException as e:
            logger.error(f"Plaid API error creating link token: {e}")
            raise Exception(f"Failed to create link token: {e.body}")

    def exchange_public_token(self, public_token: str) -> Dict[str, str]:
        """
        Exchange a public token for an access token

        Args:
            public_token: Public token from Plaid Link

        Returns:
            Dict containing access_token and item_id
        """
        try:
            request = ItemPublicTokenExchangeRequest(public_token=public_token)
            response = self.client.item_public_token_exchange(request)

            return {
                "access_token": response['access_token'],
                "item_id": response['item_id']
            }

        except plaid.ApiException as e:
            logger.error(f"Plaid API error exchanging public token: {e}")
            raise Exception(f"Failed to exchange public token: {e.body}")

    def get_accounts(self, access_token: str) -> List[Dict[str, Any]]:
        """
        Get accounts for an item

        Args:
            access_token: Plaid access token

        Returns:
            List of account dictionaries
        """
        try:
            request = AccountsGetRequest(access_token=access_token)
            response = self.client.accounts_get(request)

            accounts = []
            for account in response['accounts']:
                accounts.append({
                    "account_id": account['account_id'],
                    "name": account['name'],
                    "official_name": account.get('official_name'),
                    "type": account['type'],
                    "subtype": account.get('subtype'),
                    "mask": account.get('mask'),
                    "balances": {
                        "current": account['balances'].get('current'),
                        "available": account['balances'].get('available'),
                        "limit": account['balances'].get('limit'),
                        "iso_currency_code": account['balances'].get('iso_currency_code', 'USD')
                    }
                })

            return accounts

        except plaid.ApiException as e:
            logger.error(f"Plaid API error getting accounts: {e}")
            raise Exception(f"Failed to get accounts: {e.body}")

    def sync_transactions(
        self,
        access_token: str,
        cursor: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sync transactions using the Transactions Sync endpoint

        Args:
            access_token: Plaid access token
            cursor: Cursor for pagination

        Returns:
            Dict containing added, modified, removed transactions and new cursor
        """
        try:
            request = PlaidTransactionsSyncRequest(
                access_token=access_token,
                cursor=cursor
            )
            response = self.client.transactions_sync(request)

            return {
                "added": [self._format_transaction(t) for t in response.get('added', [])],
                "modified": [self._format_transaction(t) for t in response.get('modified', [])],
                "removed": [t['transaction_id'] for t in response.get('removed', [])],
                "cursor": response.get('next_cursor'),
                "has_more": response.get('has_more', False)
            }

        except plaid.ApiException as e:
            logger.error(f"Plaid API error syncing transactions: {e}")
            raise Exception(f"Failed to sync transactions: {e.body}")

    def get_investments_holdings(self, access_token: str) -> Dict[str, Any]:
        """
        Get investment holdings for an item

        Args:
            access_token: Plaid access token

        Returns:
            Dict containing holdings and securities
        """
        try:
            request = InvestmentsHoldingsGetRequest(access_token=access_token)
            response = self.client.investments_holdings_get(request)

            holdings = []
            for holding in response.get('holdings', []):
                holdings.append({
                    "account_id": holding['account_id'],
                    "security_id": holding['security_id'],
                    "quantity": holding['quantity'],
                    "institution_price": holding.get('institution_price'),
                    "institution_value": holding.get('institution_value'),
                    "cost_basis": holding.get('cost_basis'),
                    "iso_currency_code": holding.get('iso_currency_code', 'USD')
                })

            securities = {}
            for security in response.get('securities', []):
                securities[security['security_id']] = {
                    "security_id": security['security_id'],
                    "ticker_symbol": security.get('ticker_symbol'),
                    "name": security.get('name'),
                    "type": security.get('type'),
                    "cusip": security.get('cusip'),
                    "isin": security.get('isin'),
                    "sedol": security.get('sedol')
                }

            return {
                "holdings": holdings,
                "securities": securities
            }

        except plaid.ApiException as e:
            logger.error(f"Plaid API error getting holdings: {e}")
            raise Exception(f"Failed to get holdings: {e.body}")

    def get_item(self, access_token: str) -> Dict[str, Any]:
        """
        Get item details

        Args:
            access_token: Plaid access token

        Returns:
            Dict containing item details
        """
        try:
            request = ItemGetRequest(access_token=access_token)
            response = self.client.item_get(request)

            item = response.get('item', {})
            return {
                "item_id": item.get('item_id'),
                "institution_id": item.get('institution_id'),
                "webhook": item.get('webhook'),
                "error": item.get('error'),
                "available_products": item.get('available_products', []),
                "billed_products": item.get('billed_products', []),
                "consent_expiration_time": item.get('consent_expiration_time'),
                "update_type": item.get('update_type')
            }

        except plaid.ApiException as e:
            logger.error(f"Plaid API error getting item: {e}")
            raise Exception(f"Failed to get item: {e.body}")

    def get_institution(self, institution_id: str) -> Dict[str, Any]:
        """
        Get institution details

        Args:
            institution_id: Plaid institution ID

        Returns:
            Dict containing institution details
        """
        try:
            request = InstitutionsGetByIdRequest(
                institution_id=institution_id,
                country_codes=[CountryCode(c) for c in settings.PLAID_COUNTRY_CODES]
            )
            response = self.client.institutions_get_by_id(request)

            institution = response.get('institution', {})
            return {
                "institution_id": institution.get('institution_id'),
                "name": institution.get('name'),
                "products": institution.get('products', []),
                "country_codes": institution.get('country_codes', []),
                "url": institution.get('url'),
                "primary_color": institution.get('primary_color'),
                "logo": institution.get('logo')
            }

        except plaid.ApiException as e:
            logger.error(f"Plaid API error getting institution: {e}")
            raise Exception(f"Failed to get institution: {e.body}")

    def remove_item(self, access_token: str) -> bool:
        """
        Remove/unlink an item

        Args:
            access_token: Plaid access token

        Returns:
            True if successful
        """
        try:
            request = ItemRemoveRequest(access_token=access_token)
            self.client.item_remove(request)
            return True

        except plaid.ApiException as e:
            logger.error(f"Plaid API error removing item: {e}")
            raise Exception(f"Failed to remove item: {e.body}")

    def _format_transaction(self, transaction: Dict[str, Any]) -> Dict[str, Any]:
        """Format a transaction from Plaid response"""
        return {
            "transaction_id": transaction['transaction_id'],
            "account_id": transaction['account_id'],
            "amount": transaction['amount'],
            "iso_currency_code": transaction.get('iso_currency_code', 'USD'),
            "date": transaction['date'],
            "authorized_date": transaction.get('authorized_date'),
            "name": transaction['name'],
            "merchant_name": transaction.get('merchant_name'),
            "category": transaction.get('category'),
            "category_id": transaction.get('category_id'),
            "personal_finance_category": transaction.get('personal_finance_category'),
            "pending": transaction.get('pending', False),
            "payment_channel": transaction.get('payment_channel'),
            "location": transaction.get('location'),
            "payment_meta": transaction.get('payment_meta')
        }


# Singleton instance
plaid_service = PlaidService()
