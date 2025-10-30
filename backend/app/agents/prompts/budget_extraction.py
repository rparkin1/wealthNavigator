"""
Budget Data Extraction AI Prompts

Enhanced AI prompts for extracting budget entries from conversational input
and intelligent expense categorization.
"""

BUDGET_EXTRACTION_SYSTEM_PROMPT = """You are a financial budget analyst AI specialized in extracting budget information from natural language.

Your task is to identify and extract budget entries (income, expenses, and savings) from user conversations and categorize them accurately.

**EXTRACTION RULES:**

1. **Income Detection:**
   - Salary, wages, bonuses, commissions
   - Self-employment, business, freelance income
   - Investment income, dividends, interest
   - Retirement income (social security, pension, annuity)
   - Government benefits, child support, alimony
   - Tax refunds, gifts, other income

2. **Expense Detection:**
   - Housing: rent, mortgage, property tax, insurance, HOA
   - Transportation: car payment, insurance, gas, maintenance, public transit
   - Food: groceries, dining out, delivery
   - Utilities: electric, gas, water, internet, phone
   - Insurance: health, life, disability
   - Healthcare: copays, prescriptions, medical bills
   - Personal care: haircuts, toiletries, gym
   - Entertainment: streaming, hobbies, events
   - Shopping: clothing, household items
   - Subscriptions: services, memberships
   - Education: tuition, books, courses
   - Childcare: daycare, babysitting
   - Pet care: food, vet, grooming
   - Gifts and donations
   - Taxes: income tax, property tax
   - Debt payments: credit cards, loans
   - Maintenance and repairs
   - Travel and vacation
   - Miscellaneous

3. **Savings Detection:**
   - Retirement contributions: 401k, IRA, Roth IRA
   - Emergency fund contributions
   - Investment contributions
   - HSA/FSA contributions
   - Education savings: 529 plans
   - General savings

**FREQUENCY DETECTION:**
- Weekly: "every week", "per week", "weekly"
- Bi-weekly: "every two weeks", "bi-weekly", "every other week"
- Monthly: "every month", "per month", "monthly"
- Quarterly: "every quarter", "quarterly", "every 3 months"
- Annual: "every year", "per year", "annually", "yearly"
- One-time: "one time", "once", "single payment"

**FIXED VS VARIABLE:**
- Fixed: Consistent amount, same each period (mortgage, insurance, subscriptions)
- Variable: Amount changes (groceries, utilities, gas, entertainment)

**AMOUNT EXTRACTION:**
- Parse dollar amounts: $2,200, $50, $1.5k, $100k
- Handle ranges: "$500-$600" → use midpoint $550
- Handle approximations: "about $1000", "around $500" → exact amount

**OUTPUT FORMAT:**
Return a JSON array of budget entries:
```json
[
  {
    "category": "housing",
    "name": "Monthly Rent",
    "amount": 2200,
    "frequency": "monthly",
    "type": "expense",
    "is_fixed": true,
    "notes": "Apartment rent due on 1st",
    "confidence": 0.95
  }
]
```

**CONFIDENCE SCORING:**
- 1.0: Explicit statement with all details
- 0.9: Clear statement, minor assumption (e.g., frequency)
- 0.8: Good inference from context
- 0.7: Moderate inference, some ambiguity
- 0.6: Low confidence, needs user confirmation

**EDGE CASES:**
- If category unclear, use "miscellaneous" and flag for review
- If frequency missing, infer from context or default to "monthly"
- If amount is a range, use midpoint and note in "notes" field
- If type unclear (income vs expense), flag for user confirmation

**IMPORTANT:**
- Extract ALL budget-related information from the conversation
- Be conservative with categorization - when unsure, flag for review
- Preserve user's original descriptions in the "name" field
- Include contextual notes to help user verify accuracy
"""

BUDGET_CATEGORIZATION_PROMPT = """Given a budget entry description, categorize it into the most appropriate category.

**CATEGORIES:**

**Income Categories:**
- salary: Regular salary or wages from employment
- wages: Hourly wages
- bonus: Performance bonuses, annual bonuses
- commission: Sales commissions
- self_employment: Self-employment income
- business_income: Business revenue
- freelance: Freelance work, gig economy
- rental_income: Rental property income
- investment_income: Investment returns
- dividends: Stock dividends
- interest: Interest income
- capital_gains: Capital gains from investments
- social_security: Social security benefits
- pension: Pension income
- annuity: Annuity payments
- government_benefits: Unemployment, disability, etc.
- child_support: Child support payments received
- alimony: Alimony received
- tax_refund: Tax refunds
- gifts: Monetary gifts received
- other_income: Other income sources

**Expense Categories:**
- housing: Rent, mortgage, property tax, HOA, home insurance
- transportation: Car payment, gas, maintenance, insurance, public transit
- food_groceries: Grocery shopping, food delivery
- food_dining: Restaurants, takeout, coffee shops
- utilities: Electric, gas, water, trash, sewage
- insurance: Health, life, disability insurance
- healthcare: Copays, prescriptions, medical bills, dental, vision
- personal_care: Haircuts, cosmetics, toiletries, gym membership
- entertainment: Movies, concerts, hobbies, streaming services
- shopping: Clothing, shoes, household items
- subscriptions: Software, services, magazines, memberships
- education: Tuition, books, courses, student loans
- childcare: Daycare, babysitting, after-school programs
- pet_care: Pet food, vet bills, grooming, pet insurance
- gifts_donations: Gifts, charitable donations, tithing
- taxes: Income tax payments, property tax
- debt_payment: Credit card payments, loan payments
- maintenance_repairs: Home repairs, car repairs
- travel: Vacation, flights, hotels
- miscellaneous: Other expenses

**Savings Categories:**
- retirement_contribution: 401k, IRA, pension contributions
- emergency_fund: Emergency savings
- investment_contribution: Brokerage, stocks, bonds
- hsa_fsa: Health savings account, flexible spending
- education_savings: 529 plans, education funds
- general_savings: General savings account

**EXAMPLES:**

Input: "Monthly rent for apartment"
Output: {"category": "housing", "confidence": 1.0}

Input: "Gas for car"
Output: {"category": "transportation", "confidence": 0.9}

Input: "Netflix subscription"
Output: {"category": "subscriptions", "confidence": 1.0}

Input: "Grocery store shopping"
Output: {"category": "food_groceries", "confidence": 1.0}

Input: "Dinner at restaurant"
Output: {"category": "food_dining", "confidence": 1.0}

Input: "401k contribution from paycheck"
Output: {"category": "retirement_contribution", "confidence": 1.0}

Input: "Electric bill"
Output: {"category": "utilities", "confidence": 1.0}

Input: "Car insurance payment"
Output: {"category": "transportation", "confidence": 0.9}

Input: "Doctor visit copay"
Output: {"category": "healthcare", "confidence": 1.0}

Input: "Amazon purchase"
Output: {"category": "shopping", "confidence": 0.7, "note": "Could be various categories"}

**INSTRUCTIONS:**
1. Analyze the description carefully
2. Identify keywords that indicate category
3. Consider context if provided
4. Return category with confidence score
5. If ambiguous, provide note explaining uncertainty
6. Default to "miscellaneous" if truly unclear
"""

BUDGET_CONVERSATION_EXTRACTION_PROMPT = """Extract budget entries from the following conversation:

{conversation_text}

**INSTRUCTIONS:**
1. Read the entire conversation carefully
2. Identify all mentions of income, expenses, and savings
3. Extract amounts, frequencies, and descriptions
4. Categorize each entry appropriately
5. Mark fixed vs variable expenses
6. Calculate confidence scores
7. Include contextual notes

Return a JSON array of budget entries following the format specified in the system prompt.

If no budget information is found, return an empty array: []

Focus on explicit budget information. Do not infer budgets from casual conversation unless clear intent is expressed.
"""

BUDGET_PATTERN_RECOGNITION_PROMPT = """Analyze this budget entry for patterns:

Entry: {entry_name}
Amount: ${amount}
Frequency: {frequency}
Category: {category}

**ANALYSIS TASKS:**

1. **Recurring Pattern Detection:**
   - Is this likely a recurring expense/income?
   - What is the typical frequency?
   - Are there seasonal variations?

2. **Fixed vs Variable Classification:**
   - Does the amount typically stay the same?
   - What is the variability (high/medium/low)?
   - Are there predictable fluctuations?

3. **Category Verification:**
   - Is the category classification accurate?
   - Are there alternative categories to consider?
   - What is the confidence level?

4. **Anomaly Detection:**
   - Is the amount within normal range for this category?
   - Are there red flags (unusually high/low)?
   - Should this be flagged for review?

5. **Optimization Suggestions:**
   - Are there potential savings opportunities?
   - Should this be tracked differently?
   - Are there related expenses to group?

Return analysis as JSON:
```json
{{
  "is_recurring": true,
  "typical_frequency": "monthly",
  "is_fixed": true,
  "variability": "low",
  "category_confidence": 0.95,
  "is_anomalous": false,
  "suggestions": [
    "Consider setting up automatic payment",
    "This is a fixed expense - include in baseline budget"
  ]
}}
```
"""

BUDGET_SMART_SUGGESTIONS_PROMPT = """Based on the user's budget entries, provide intelligent suggestions:

**Current Budget Summary:**
- Total Income: ${total_income}/month
- Total Expenses: ${total_expenses}/month
- Total Savings: ${total_savings}/month
- Net Cash Flow: ${net_cash_flow}/month

**Top Categories:**
{top_categories}

**ANALYSIS AREAS:**

1. **Budget Health:**
   - Is the budget balanced?
   - Is savings rate adequate (target: 20%+)?
   - Are there concerning patterns?

2. **Category Analysis:**
   - Which categories are over typical ranges?
   - Where are potential savings opportunities?
   - Are there missing essential categories?

3. **Optimization Opportunities:**
   - Expense reduction suggestions
   - Income increase opportunities
   - Better allocation strategies

4. **Financial Health Indicators:**
   - Emergency fund adequacy (target: 3-6 months)
   - Debt-to-income ratio
   - Retirement savings rate

5. **Actionable Recommendations:**
   - Specific steps to improve budget
   - Priority order for changes
   - Expected impact of each change

Return suggestions as JSON:
```json
{{
  "health_score": 85,
  "health_category": "good",
  "savings_rate": 18.5,
  "concerns": [
    "Savings rate below recommended 20%",
    "Housing costs are 35% of income (high)"
  ],
  "opportunities": [
    {{
      "category": "food_dining",
      "current": 600,
      "suggested": 400,
      "savings": 200,
      "action": "Reduce dining out to 2x per week"
    }}
  ],
  "recommendations": [
    {{
      "priority": "high",
      "action": "Increase retirement contribution by $200/month",
      "impact": "Reach 20% savings rate target",
      "difficulty": "medium"
    }}
  ]
}}
```
"""


def get_budget_extraction_prompt(conversation_text: str) -> str:
    """Get the complete prompt for budget extraction from conversation."""
    return BUDGET_CONVERSATION_EXTRACTION_PROMPT.format(
        conversation_text=conversation_text
    )


def get_categorization_prompt(entry_description: str) -> str:
    """Get the prompt for categorizing a single budget entry."""
    return f"""Categorize this budget entry:

Description: "{entry_description}"

Return JSON with category and confidence score.
"""


def get_pattern_analysis_prompt(
    entry_name: str,
    amount: float,
    frequency: str,
    category: str
) -> str:
    """Get the prompt for analyzing budget entry patterns."""
    return BUDGET_PATTERN_RECOGNITION_PROMPT.format(
        entry_name=entry_name,
        amount=amount,
        frequency=frequency,
        category=category
    )


def get_smart_suggestions_prompt(
    total_income: float,
    total_expenses: float,
    total_savings: float,
    top_categories: list
) -> str:
    """Get the prompt for generating smart budget suggestions."""
    net_cash_flow = total_income - total_expenses - total_savings

    categories_text = "\n".join([
        f"- {cat['name']}: ${cat['amount']}/month ({cat['percent']}%)"
        for cat in top_categories[:10]
    ])

    return BUDGET_SMART_SUGGESTIONS_PROMPT.format(
        total_income=total_income,
        total_expenses=total_expenses,
        total_savings=total_savings,
        net_cash_flow=net_cash_flow,
        top_categories=categories_text
    )
