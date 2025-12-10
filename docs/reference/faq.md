# Frequently Asked Questions (FAQ)

Quick answers to common questions about WealthNavigator AI.

---

## 🔐 Security & Privacy

### Is my financial data secure?
**Yes.** We use bank-level security:
- **Encryption**: TLS 1.3 in transit, AES-256 at rest
- **OAuth**: We never see your bank passwords
- **Multi-factor auth**: Optional 2FA available
- **Compliance**: GDPR & CCPA compliant

### Do you sell my data?
**No, never.** We do not sell, rent, or share your personal financial data with third parties for marketing purposes.

### Can you see my bank login credentials?
**No.** When connecting accounts, we use OAuth (via Plaid), which means your credentials go directly to your bank, never through our servers.

### Where is my data stored?
Your data is stored in secure, encrypted databases in the United States. We use industry-standard cloud providers with SOC 2 Type II certification.

---

## 💰 Financial Planning

### Is WealthNavigator AI a financial advisor?
**No.** We provide **educational tools** and general information, not personalized investment advice. We are not a registered investment advisor (RIA). For personalized advice, consult a licensed financial professional.

### How accurate are the projections?
Projections are **estimates** based on:
- Historical market data
- Your inputs (savings, timeline, etc.)
- Industry-standard assumptions

**Important:** Past performance doesn't guarantee future results. Markets are unpredictable.

### What is Monte Carlo simulation?
Instead of showing one projection, we run **5,000 different scenarios** (market booms, crashes, average years) to calculate realistic success probabilities.

**Example:**
- Success probability: 85%
- Means: In 85 out of 100 scenarios, you reach your goal
- Not guaranteed, but statistically likely

### Why is my success probability low?
Common reasons:
1. **Aggressive goal**: Wanting too much too soon
2. **Insufficient savings**: Not enough monthly contributions
3. **Short timeline**: Not enough time for growth
4. **Conservative allocation**: Lower risk = lower returns

**Solutions**: Increase savings, extend timeline, or adjust goal.

### Should I aim for 100% success probability?
**No.** That's usually too conservative and means you're taking less risk than optimal. **80-90% is ideal** for most goals.

---

## 📊 Goals & Planning

### How many goals can I create?
**Unlimited** during beta. We recommend starting with 1-3 primary goals:
- Retirement (essential)
- Education (if applicable)
- Emergency fund (recommended)

### Can I have multiple retirement goals?
Yes, but typically you want **one retirement goal** with a specific target. You can adjust it over time.

### What if my goals compete for resources?
The AI will help you:
1. **Prioritize**: Essential > Important > Aspirational
2. **Trade off**: "Fund retirement at 90%, education at 75%"
3. **Adjust**: Lower one goal to fully fund another

### Can I delete a goal?
Yes. Goals can be:
- **Deleted**: Permanently removed
- **Archived**: Hidden but preserved
- **Paused**: Temporarily inactive

---

## 💼 Portfolios & Investments

### Do you execute trades?
**No.** We provide **recommendations only**. You execute trades with your broker (Vanguard, Fidelity, etc.).

### Can I use my current broker?
**Yes!** Use any broker you prefer. We provide allocation recommendations; you implement them.

### What if I disagree with the allocation?
You can:
1. **Adjust risk tolerance**: More conservative or aggressive
2. **Custom allocation**: Set your own percentages
3. **Add constraints**: "No REITs" or "Max 50% stocks"

### How often should I rebalance?
**Recommendation**: Every 6-12 months, or when allocation drifts >5% from target.

**Example:**
- Target: 70% stocks
- Current: 76% stocks (due to market gains)
- **Rebalance**: Sell some stocks, buy bonds

### What investments should I use?
We recommend **low-cost index funds**:
- **Stocks**: VTI (Total US Market), VXUS (International)
- **Bonds**: BND (Total Bond Market)
- **Target-date funds**: All-in-one option (e.g., Vanguard 2055)

---

## 🧮 Calculations & Assumptions

### What return assumptions do you use?
**Default assumptions** (based on historical data):
- **US Stocks**: 10% annual return, 18% volatility
- **International Stocks**: 9% annual, 20% volatility
- **Bonds**: 4% annual, 6% volatility
- **Cash**: 2% annual, 1% volatility
- **Inflation**: 3% annual

You can customize these in Settings.

### How do you calculate required savings?
We use **present value** calculations:
1. Determine future value needed (goal amount adjusted for inflation)
2. Calculate contributions needed to reach that amount
3. Account for current savings growing over time

**Formula** (simplified):
```
FV = PV × (1 + r)^n + PMT × [((1 + r)^n - 1) / r]

Where:
FV = Future value (goal)
PV = Present value (current savings)
r = Expected return rate
n = Number of years
PMT = Monthly contribution
```

### What inflation rate do you use?
**Default: 3% annually**

You can adjust this in Settings. Historical US inflation (1926-2024):
- Average: 3.0%
- Range: -10% to +18%
- Recent (2000-2024): 2.5%

### How do you account for taxes?
We consider:
1. **Account types**: Taxable, tax-deferred (401k), tax-free (Roth)
2. **Asset location**: Place tax-inefficient assets in tax-deferred accounts
3. **Tax-loss harvesting**: Identify opportunities to offset gains
4. **Withdrawal strategy**: Minimize taxes when withdrawing in retirement

---

## 🔧 Technical & Platform

### What browsers are supported?
- ✅ **Chrome**: Latest 2 versions
- ✅ **Firefox**: Latest 2 versions
- ✅ **Safari**: Latest 2 versions
- ✅ **Edge**: Latest 2 versions

**Mobile browsers** also supported.

### Does it work on mobile?
**Yes!** The interface is fully responsive:
- Phones (320px+)
- Tablets (768px+)
- Desktops (1024px+)

### Can I use it offline?
**Limited.** You can view cached data offline, but calculations require internet connection.

### Do you have a mobile app?
Not yet. The web app works great on mobile browsers. Native iOS/Android apps are planned for 2026.

### How do I export my data?
1. Go to **Settings** → **Data**
2. Click **"Export Data"**
3. Choose format: CSV, JSON, or PDF
4. Download completes in <10 seconds

---

## 🆘 Troubleshooting

### The simulation is taking too long
**Expected time**: 5-10 seconds for 5,000 iterations

**If slower:**
1. Refresh the page
2. Try a smaller number of iterations (1,000)
3. Check your internet connection
4. Clear browser cache

### My results seem wrong
**Check:**
1. Input values (savings, contributions, timeline)
2. Return assumptions (Settings → Assumptions)
3. Account for inflation (3% default)
4. Risk tolerance setting

### I can't connect my bank account
**Common issues:**
1. **2FA required**: Disable temporarily, reconnect, re-enable
2. **Wrong credentials**: Double-check username/password
3. **Bank not supported**: Use manual entry
4. **Maintenance**: Try again in 1 hour

### The AI isn't responding
**Try:**
1. Refresh the page
2. Start a new conversation
3. Check internet connection
4. Clear cookies and retry

### Charts aren't loading
**Solutions:**
1. Enable JavaScript
2. Update your browser
3. Disable ad blockers temporarily
4. Try incognito/private mode

---

## 💳 Billing & Subscription

### How much does it cost?
**Beta**: Free during beta period (through March 2026)

**Post-beta pricing** (TBD):
- **Free tier**: 1 goal, basic features
- **Pro**: $9.99/month - Unlimited goals, tax optimization
- **Premium**: $19.99/month - Advisory support, advanced features

### Can I cancel anytime?
**Yes**, no long-term commitments. Cancel from Settings → Subscription.

### Do you offer refunds?
**Yes**, 30-day money-back guarantee (post-beta).

---

## 🎓 Learning & Support

### I'm new to investing. Where should I start?
**Recommended path:**
1. Read: [Quick Start Guide](../getting-started/quick-start.md)
2. Read: [Investment Basics](../guides/investment-basics.md)
3. Watch: [Video tutorials](https://youtube.com/wealthnavigator)
4. Create your first goal with conservative settings

### What resources do you recommend?
**Books:**
- "A Random Walk Down Wall Street" - Burton Malkiel
- "The Bogleheads' Guide to Investing" - Taylor Larimore
- "The Simple Path to Wealth" - JL Collins

**Websites:**
- Bogleheads.org - Investment forum
- Investopedia.com - Financial dictionary
- FIRE communities - Early retirement

### How do I contact support?
**Email**: support@wealthnavigator.ai
**Response time**: 24-48 hours
**Hours**: Monday-Friday, 9 AM - 5 PM PST

**For urgent issues:**
1. Check [Troubleshooting Guide](../guides/troubleshooting.md)
2. Search [Community Forum](https://community.wealthnavigator.ai)
3. Email with "URGENT" in subject line

---

## 🌟 Features & Roadmap

### What features are coming next?
**Q1 2026:**
- Direct account connections (Plaid integration)
- Tax-loss harvesting automation
- Estate planning tools
- Social Security optimization

**Q2 2026:**
- Mobile apps (iOS & Android)
- Real-time portfolio tracking
- Automatic rebalancing
- Advisor collaboration

### Can I request a feature?
**Yes!** Send requests to: features@wealthnavigator.ai

We prioritize based on user demand. Popular requests:
1. Multiple scenarios side-by-side ✅ (implemented)
2. Roth conversion calculator (Q1 2026)
3. HSA optimization (Q2 2026)

### How do you use AI?
We use **Claude Sonnet 4.5** (Anthropic) for:
1. **Conversation**: Understanding your goals in natural language
2. **Analysis**: Portfolio optimization, tax strategies
3. **Recommendations**: Personalized advice
4. **Explanations**: Clear, jargon-free explanations

**Human expertise** validates all calculations.

---

## 📖 Definitions

### What's the difference between returns and risk?
- **Returns**: How much your investment grows (e.g., 8% per year)
- **Risk**: How much it fluctuates (volatility)

**Example:**
- Low risk: 4% return, ±5% fluctuation
- High risk: 10% return, ±20% fluctuation

### What is a "success probability"?
The percentage of Monte Carlo scenarios where you reach your goal.

**Example**: 85% = In 85 out of 100 market scenarios, you hit your target.

### What's the efficient frontier?
A chart showing the **best possible portfolios** for each risk level. Any portfolio below the frontier is sub-optimal (lower return for same risk).

### What's asset location?
Placing investments in the right account types:
- **Tax-deferred (401k)**: Bonds, REITs (high taxes)
- **Taxable**: Stocks (tax-efficient)
- **Tax-free (Roth)**: High-growth stocks

---

## 🔗 Quick Links

- [Quick Start](../getting-started/quick-start.md)
- [Tutorials](../tutorials/)
- [Troubleshooting](../guides/troubleshooting.md)
- [Contact Support](mailto:support@wealthnavigator.ai)

---

**Still have questions?** Email us: support@wealthnavigator.ai

**Back to docs** → [Documentation Home](../README.md)
