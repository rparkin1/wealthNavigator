"""
Expense Categorization Service

AI-powered automatic expense categorization using Plaid transaction data and machine learning.
Implements REQ-BUD-004: System shall support automated expense categorization.
"""

from typing import Optional, Dict, List, Tuple
from datetime import datetime
import re

from app.models.budget import BudgetCategory, BudgetType
from app.models.plaid import PlaidTransaction


class ExpenseCategorizationService:
    """Service for AI-powered expense categorization."""

    # Keyword mapping for category detection (ML can learn from these)
    CATEGORY_KEYWORDS: Dict[BudgetCategory, List[str]] = {
        # Housing
        BudgetCategory.HOUSING: [
            'rent', 'mortgage', 'property management', 'hoa', 'homeowners association',
            'property tax', 'home insurance', 'apartment', 'lease payment'
        ],

        # Transportation
        BudgetCategory.TRANSPORTATION: [
            'gas', 'fuel', 'exxon', 'shell', 'chevron', 'bp', 'mobil',
            'uber', 'lyft', 'taxi', 'metro', 'subway', 'train', 'bus', 'transit',
            'car payment', 'auto insurance', 'parking', 'toll', 'dmv', 'registration',
            'car wash', 'oil change', 'auto repair', 'mechanic', 'tire'
        ],

        # Food - Groceries
        BudgetCategory.FOOD_GROCERIES: [
            'grocery', 'safeway', 'walmart', 'target', 'kroger', 'whole foods', 'trader joe',
            'costco', 'sam\'s club', 'publix', 'albertsons', 'food lion', 'wegmans',
            'aldi', 'sprouts', 'fresh market', 'harris teeter', 'stop & shop'
        ],

        # Food - Dining
        BudgetCategory.FOOD_DINING: [
            'restaurant', 'cafe', 'coffee', 'starbucks', 'dunkin', 'mcdonald', 'burger',
            'pizza', 'chipotle', 'panera', 'subway', 'wendy', 'taco bell', 'kfc',
            'dining', 'doordash', 'uber eats', 'grubhub', 'postmates', 'seamless',
            'bar', 'pub', 'brewery', 'bistro', 'grill', 'diner'
        ],

        # Utilities
        BudgetCategory.UTILITIES: [
            'electric', 'electricity', 'power', 'pg&e', 'duke energy', 'sdg&e',
            'gas bill', 'water', 'sewer', 'trash', 'waste management',
            'internet', 'comcast', 'at&t', 'verizon', 'spectrum', 'xfinity',
            'phone bill', 'mobile', 'cell phone', 't-mobile', 'sprint'
        ],

        # Insurance
        BudgetCategory.INSURANCE: [
            'insurance', 'progressive', 'geico', 'state farm', 'allstate', 'usaa',
            'life insurance', 'disability insurance', 'umbrella policy'
        ],

        # Healthcare
        BudgetCategory.HEALTHCARE: [
            'doctor', 'medical', 'pharmacy', 'cvs', 'walgreens', 'rite aid',
            'hospital', 'clinic', 'dentist', 'dental', 'optometrist', 'vision',
            'copay', 'prescription', 'medicine', 'health'
        ],

        # Entertainment
        BudgetCategory.ENTERTAINMENT: [
            'movie', 'cinema', 'theater', 'concert', 'spotify', 'netflix', 'hulu',
            'disney plus', 'apple tv', 'hbo', 'amazon prime', 'youtube premium',
            'gym', 'fitness', 'planet fitness', '24 hour', 'equinox', 'crunch',
            'game', 'steam', 'playstation', 'xbox', 'nintendo'
        ],

        # Shopping
        BudgetCategory.SHOPPING: [
            'amazon', 'ebay', 'etsy', 'clothing', 'apparel', 'fashion',
            'macy', 'nordstrom', 'gap', 'old navy', 'h&m', 'zara', 'uniqlo',
            'home depot', 'lowe\'s', 'ikea', 'furniture', 'electronics',
            'best buy', 'apple store'
        ],

        # Subscriptions
        BudgetCategory.SUBSCRIPTIONS: [
            'subscription', 'membership', 'recurring', 'monthly fee',
            'adobe', 'microsoft', 'zoom', 'dropbox', 'icloud'
        ],

        # Education
        BudgetCategory.EDUCATION: [
            'tuition', 'school', 'university', 'college', 'course', 'class',
            'textbook', 'books', 'student loan', 'education', 'coursera', 'udemy'
        ],

        # Childcare
        BudgetCategory.CHILDCARE: [
            'daycare', 'childcare', 'preschool', 'nursery', 'babysitter',
            'nanny', 'after school', 'summer camp'
        ],

        # Pet Care
        BudgetCategory.PET_CARE: [
            'pet', 'vet', 'veterinary', 'petsmart', 'petco', 'dog', 'cat',
            'pet food', 'grooming', 'pet supplies'
        ],

        # Gifts & Donations
        BudgetCategory.GIFTS_DONATIONS: [
            'donation', 'charity', 'gift', 'flowers', 'red cross', 'goodwill',
            'salvation army', 'united way', 'church', 'gofundme'
        ],

        # Travel
        BudgetCategory.TRAVEL: [
            'hotel', 'airbnb', 'airline', 'flight', 'airport', 'travel',
            'expedia', 'booking.com', 'vacation', 'resort', 'cruise'
        ],

        # Taxes
        BudgetCategory.TAXES: [
            'irs', 'tax payment', 'federal tax', 'state tax', 'property tax',
            'estimated tax', 'tax bill'
        ],

        # Debt Payment
        BudgetCategory.DEBT_PAYMENT: [
            'loan payment', 'credit card payment', 'line of credit',
            'personal loan', 'auto loan', 'student loan payment'
        ],

        # Maintenance & Repairs
        BudgetCategory.MAINTENANCE_REPAIRS: [
            'repair', 'maintenance', 'hvac', 'plumber', 'plumbing',
            'electrician', 'handyman', 'contractor', 'roofing', 'painting'
        ],
    }

    # Plaid category to budget category mapping
    PLAID_CATEGORY_MAP: Dict[str, BudgetCategory] = {
        # Food and Drink
        'Food and Drink': BudgetCategory.FOOD_DINING,
        'Restaurants': BudgetCategory.FOOD_DINING,
        'Fast Food': BudgetCategory.FOOD_DINING,
        'Coffee Shop': BudgetCategory.FOOD_DINING,
        'Groceries': BudgetCategory.FOOD_GROCERIES,

        # Transportation
        'Transportation': BudgetCategory.TRANSPORTATION,
        'Gas': BudgetCategory.TRANSPORTATION,
        'Parking': BudgetCategory.TRANSPORTATION,
        'Public Transportation': BudgetCategory.TRANSPORTATION,
        'Taxi': BudgetCategory.TRANSPORTATION,
        'Ride Share': BudgetCategory.TRANSPORTATION,

        # Shops
        'Shops': BudgetCategory.SHOPPING,
        'Clothing': BudgetCategory.SHOPPING,
        'Electronics': BudgetCategory.SHOPPING,
        'Sporting Goods': BudgetCategory.SHOPPING,
        'Bookstores': BudgetCategory.SHOPPING,

        # Recreation
        'Recreation': BudgetCategory.ENTERTAINMENT,
        'Entertainment': BudgetCategory.ENTERTAINMENT,
        'Gyms and Fitness Centers': BudgetCategory.ENTERTAINMENT,
        'Arts': BudgetCategory.ENTERTAINMENT,
        'Music': BudgetCategory.ENTERTAINMENT,

        # Healthcare
        'Healthcare': BudgetCategory.HEALTHCARE,
        'Medical': BudgetCategory.HEALTHCARE,
        'Pharmacy': BudgetCategory.HEALTHCARE,

        # Travel
        'Travel': BudgetCategory.TRAVEL,
        'Airlines': BudgetCategory.TRAVEL,
        'Lodging': BudgetCategory.TRAVEL,

        # Personal Care
        'Personal Care': BudgetCategory.PERSONAL_CARE,

        # Service
        'Service': BudgetCategory.MISCELLANEOUS,
        'Professional Services': BudgetCategory.MISCELLANEOUS,

        # Government and Taxes
        'Tax': BudgetCategory.TAXES,
        'Tax Payment': BudgetCategory.TAXES,
    }

    @classmethod
    def categorize_transaction(
        cls,
        transaction: PlaidTransaction,
        user_history: Optional[Dict[str, BudgetCategory]] = None,
    ) -> Tuple[BudgetCategory, float]:
        """
        Categorize a Plaid transaction using AI/ML techniques.

        Args:
            transaction: Plaid transaction to categorize
            user_history: Optional user's historical categorization patterns

        Returns:
            Tuple of (category, confidence_score)
        """
        merchant_name = (transaction.merchant_name or "").lower()
        description = (transaction.name or "").lower()
        plaid_category = transaction.category[0] if transaction.category else ""

        # Method 1: Check Plaid's category first (most reliable)
        if plaid_category in cls.PLAID_CATEGORY_MAP:
            return cls.PLAID_CATEGORY_MAP[plaid_category], 0.90

        # Method 2: Check user's historical patterns (personalized)
        if user_history:
            # Create normalized key from merchant name
            normalized_merchant = cls._normalize_merchant_name(merchant_name)
            if normalized_merchant in user_history:
                return user_history[normalized_merchant], 0.95  # High confidence for user history

        # Method 3: Keyword matching with scoring
        category_scores: Dict[BudgetCategory, float] = {}

        for category, keywords in cls.CATEGORY_KEYWORDS.items():
            score = 0.0
            for keyword in keywords:
                # Check merchant name
                if keyword in merchant_name:
                    score += 1.0

                # Check description
                if keyword in description:
                    score += 0.8

            if score > 0:
                # Normalize score to 0-1 range
                category_scores[category] = min(score / len(keywords), 1.0)

        # Get category with highest score
        if category_scores:
            best_category = max(category_scores, key=category_scores.get)
            confidence = category_scores[best_category]
            return best_category, confidence

        # Method 4: Amount-based heuristics
        amount = abs(transaction.amount)

        # Large amounts often housing/auto
        if amount > 1000:
            return BudgetCategory.HOUSING, 0.50

        # Small amounts often food/entertainment
        if amount < 20:
            return BudgetCategory.FOOD_DINING, 0.40

        # Default to miscellaneous with low confidence
        return BudgetCategory.MISCELLANEOUS, 0.30

    @classmethod
    def _normalize_merchant_name(cls, merchant_name: str) -> str:
        """Normalize merchant name for consistent matching."""
        # Convert to lowercase
        normalized = merchant_name.lower()

        # Remove common suffixes
        suffixes = ['inc', 'llc', 'ltd', 'corp', 'co', '#', '*']
        for suffix in suffixes:
            normalized = re.sub(f'\\s+{suffix}\\b', '', normalized)

        # Remove numbers
        normalized = re.sub(r'\d+', '', normalized)

        # Remove extra whitespace
        normalized = ' '.join(normalized.split())

        return normalized.strip()

    @classmethod
    def determine_budget_type(
        cls,
        transaction: PlaidTransaction,
        category: BudgetCategory,
    ) -> BudgetType:
        """
        Determine if transaction is income, expense, or savings.

        Args:
            transaction: Plaid transaction
            category: Categorized budget category

        Returns:
            BudgetType (income, expense, or savings)
        """
        # Check if transaction is positive (income) or negative (expense)
        if transaction.amount < 0:
            # Negative amounts are typically transfers out (expenses)
            # Check if it's a savings/investment contribution
            if category in [
                BudgetCategory.RETIREMENT_CONTRIBUTION,
                BudgetCategory.EMERGENCY_FUND,
                BudgetCategory.INVESTMENT_CONTRIBUTION,
                BudgetCategory.HSA_FSA,
                BudgetCategory.EDUCATION_SAVINGS,
                BudgetCategory.GENERAL_SAVINGS,
            ]:
                return BudgetType.SAVINGS
            else:
                return BudgetType.EXPENSE
        else:
            # Positive amounts are typically income
            return BudgetType.INCOME

    @classmethod
    def is_recurring(
        cls,
        transaction: PlaidTransaction,
        similar_transactions: List[PlaidTransaction],
    ) -> Tuple[bool, Optional[str]]:
        """
        Determine if transaction is recurring (fixed expense).

        Args:
            transaction: Current transaction
            similar_transactions: Previous transactions from same merchant

        Returns:
            Tuple of (is_recurring, frequency)
        """
        if len(similar_transactions) < 2:
            return False, None

        # Analyze time gaps between transactions
        dates = sorted([t.date for t in similar_transactions])
        gaps = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]

        if not gaps:
            return False, None

        avg_gap = sum(gaps) / len(gaps)
        gap_variance = sum((g - avg_gap) ** 2 for g in gaps) / len(gaps)

        # Low variance indicates consistent recurring pattern
        if gap_variance < 5:
            # Determine frequency
            if 6 <= avg_gap <= 8:
                return True, "weekly"
            elif 13 <= avg_gap <= 15:
                return True, "biweekly"
            elif 28 <= avg_gap <= 32:
                return True, "monthly"
            elif 88 <= avg_gap <= 92:
                return True, "quarterly"
            elif 360 <= avg_gap <= 370:
                return True, "annual"

        return False, None

    @classmethod
    def build_user_history(
        cls,
        transactions: List[Dict],
    ) -> Dict[str, BudgetCategory]:
        """
        Build user's historical categorization patterns.

        Args:
            transactions: List of past transactions with categories

        Returns:
            Dictionary mapping merchant names to categories
        """
        history: Dict[str, BudgetCategory] = {}

        for txn in transactions:
            merchant = cls._normalize_merchant_name(txn.get('merchant_name', ''))
            category = txn.get('category')

            if merchant and category:
                # Most recent categorization wins
                history[merchant] = category

        return history

    @classmethod
    def suggest_budget_improvements(
        cls,
        transactions: List[PlaidTransaction],
        budget_entries: List[Dict],
    ) -> List[Dict]:
        """
        Analyze transactions and suggest budget improvements.

        Args:
            transactions: Recent transactions
            budget_entries: Current budget entries

        Returns:
            List of suggestions with actions
        """
        suggestions = []

        # Analyze spending by category
        spending_by_category: Dict[BudgetCategory, float] = {}
        for txn in transactions:
            if txn.amount < 0:  # Expenses only
                category, _ = cls.categorize_transaction(txn)
                spending_by_category[category] = spending_by_category.get(category, 0) + abs(txn.amount)

        # Compare actual spending vs budget
        budget_by_category = {entry['category']: entry['amount'] for entry in budget_entries}

        for category, actual_spending in spending_by_category.items():
            budgeted = budget_by_category.get(category, 0)

            # Over-budget
            if budgeted > 0 and actual_spending > budgeted * 1.1:
                suggestions.append({
                    'type': 'over_budget',
                    'category': category.value,
                    'budgeted': budgeted,
                    'actual': actual_spending,
                    'difference': actual_spending - budgeted,
                    'action': f'You\'re spending {(actual_spending/budgeted - 1)*100:.0f}% more than budgeted in {category.value}',
                })

            # Under-budget (potential savings opportunity)
            elif budgeted > 0 and actual_spending < budgeted * 0.8:
                suggestions.append({
                    'type': 'under_budget',
                    'category': category.value,
                    'budgeted': budgeted,
                    'actual': actual_spending,
                    'savings': budgeted - actual_spending,
                    'action': f'You\'re saving {budgeted - actual_spending:.2f} in {category.value} - consider reallocating',
                })

            # Missing budget entry
            elif category not in budget_by_category and actual_spending > 100:
                suggestions.append({
                    'type': 'missing_budget',
                    'category': category.value,
                    'actual': actual_spending,
                    'action': f'Consider adding a budget for {category.value} (spending ~${actual_spending:.2f}/month)',
                })

        return suggestions
