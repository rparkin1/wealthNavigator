# Frequently Asked Questions (FAQ)

## Table of Contents

- [General Questions](#general-questions)
- [Getting Started](#getting-started)
- [Features & Functionality](#features--functionality)
- [Security & Privacy](#security--privacy)
- [Technical Questions](#technical-questions)
- [Pricing & Plans](#pricing--plans)
- [Troubleshooting](#troubleshooting)

---

## General Questions

### What is WealthNavigator AI?

WealthNavigator AI is an AI-powered financial planning platform that combines conversational AI with institutional-grade portfolio management tools. It helps you plan for retirement, education funding, home purchases, and other major financial goals using advanced algorithms like Modern Portfolio Theory and Monte Carlo simulation.

### How is WealthNavigator AI different from other robo-advisors?

**Key Differences**:

1. **Goal-Based Planning**: Unlike portfolio-first approaches, we focus on your specific life goals
2. **Multi-Agent AI**: 8 specialized AI agents working together for comprehensive analysis
3. **Transparent Calculations**: See exactly how recommendations are generated
4. **Tax Optimization**: Advanced strategies like asset location and tax-loss harvesting
5. **Monte Carlo Simulation**: Run thousands of scenarios in seconds
6. **No Investment Management**: We provide plans and recommendations, you maintain control

### Do you actually invest my money?

No. WealthNavigator AI is a planning and analysis platform. We provide recommendations, but you maintain control of your investments through your existing brokerage accounts. We can integrate with Plaid to view your accounts but never have authority to trade.

### Is WealthNavigator AI suitable for beginners?

Yes! The platform is designed for both beginners and experienced investors:

- **For Beginners**: Natural language interface, guided setup wizard, educational content
- **For Advanced Users**: Institutional-grade tools, advanced analytics, customizable assumptions

### What credentials do your AI agents have?

Our AI agents are powered by Anthropic's Claude Sonnet 4.5 and trained on:

- Certified Financial Planner (CFP) curriculum
- Modern Portfolio Theory (Markowitz)
- Tax code and regulations
- Actuarial science
- Behavioral finance research

**Important**: WealthNavigator AI provides educational tools, not financial advice. For personalized advice, consult a licensed financial advisor.

---

## Getting Started

### What do I need to get started?

**Minimum Requirements**:
- Web browser (Chrome, Firefox, Safari, Edge)
- Email address for account creation
- Basic financial information (age, income, savings)

**Optional but Recommended**:
- Details of existing investment accounts
- Plaid-compatible bank/brokerage accounts
- Tax documents (for optimization features)

### How long does initial setup take?

**Quick Start**: 10 minutes
- Create account (2 min)
- Complete profile (3 min)
- Create first goal (5 min)

**Complete Setup**: 30-45 minutes
- Quick start (10 min)
- Connect financial accounts (15 min)
- Create multiple goals (10 min)
- Run first Monte Carlo simulation (5 min)

### Can I import data from other platforms?

**Supported Imports**:
- **Plaid**: Automatic account syncing from 10,000+ institutions
- **CSV**: Manual import of portfolio holdings
- **Mint, Personal Capital**: CSV export → import
- **Excel**: Portfolio data templates

### Do I need to connect my bank accounts?

No, connecting accounts is optional:

**Benefits of Connecting**:
- Automatic portfolio updates
- Real-time net worth tracking
- Transaction categorization
- Easier setup

**Manual Entry Alternative**:
- Enter holdings manually
- Update quarterly or monthly
- Still get full analysis and recommendations

---

## Features & Functionality

### How accurate are Monte Carlo simulations?

Our Monte Carlo engine:
- Runs 5,000+ iterations in 3-5 seconds
- Uses historical market data (30+ years)
- Accounts for correlation between asset classes
- Models realistic withdrawal patterns

**Accuracy**: Probabilistic, not predictive. Results show range of possible outcomes based on historical patterns. Past performance doesn't guarantee future results.

### What is "success probability"?

Success probability is the percentage of Monte Carlo scenarios where you meet or exceed your goal.

**Example**: 80% success probability means:
- 8 out of 10 scenarios succeeded
- 2 out of 10 scenarios fell short
- Higher is better, but 100% is overly conservative

**Recommended Thresholds**:
- Essential goals (retirement): 85-90%
- Important goals (education): 75-85%
- Aspirational goals (vacation home): 60-75%

### How often should I rebalance my portfolio?

**Recommended Frequency**:
- **Quarterly**: Most common, balances costs and drift
- **Semi-annually**: Lower costs, acceptable drift
- **Annually**: Minimal costs, higher drift
- **Threshold-based**: Rebalance when allocation drifts >5%

**Tax Considerations**: In taxable accounts, rebalance less frequently to avoid short-term capital gains.

### Can I model multiple goals simultaneously?

Yes! This is a core feature:

**Multi-Goal Optimization**:
- Coordinate goals with dependencies
- Prioritize funding (Essential → Important → Aspirational)
- Optimize allocation across goals
- Track household-level success probability

**Example**: System ensures emergency fund is fully funded before allocating to home down payment.

### How does tax-loss harvesting work?

**Process**:
1. System monitors all holdings daily
2. Identifies positions with losses >$1,000
3. Suggests replacement securities (avoid wash sale)
4. Calculates tax savings
5. You approve and execute trades

**Requirements**:
- Taxable accounts only (not IRAs/401ks)
- Losses must exceed transaction costs
- Must avoid wash sale (30-day rule)
- Replacement must maintain market exposure

**Typical Savings**: $1,000-$5,000/year depending on portfolio size and volatility.

### What's the difference between asset allocation and asset location?

**Asset Allocation**: Which asset classes to own
- Example: 70% stocks, 25% bonds, 5% cash

**Asset Location**: Which account types to hold them in
- Tax-inefficient assets (bonds, REITs) → 401(k)/IRA
- Tax-efficient assets (index funds) → Taxable accounts
- High-growth assets → Roth IRA

**Impact**: Good asset location can save $2,000-$5,000/year in taxes.

### Can I model early retirement?

Yes, with advanced features:

**Early Retirement Considerations**:
- Healthcare costs (before Medicare at 65)
- Sequence of returns risk
- Early withdrawal penalties (59.5 rule)
- Social Security claiming strategies
- Part-time work or consulting income

**FIRE Strategies** (Financial Independence, Retire Early):
- Roth conversion ladders
- 72(t) SEPP withdrawals
- Taxable account bridging

---

## Security & Privacy

### How is my financial data protected?

**Security Measures**:
- **Encryption in Transit**: TLS 1.3
- **Encryption at Rest**: AES-256
- **Authentication**: Multi-factor authentication (2FA)
- **Access Control**: Role-based permissions
- **Audit Logs**: All actions logged
- **Compliance**: GLBA, SOC 2 Type II

### Do you sell my data?

**Absolutely not.** We never sell, rent, or share your personal or financial data with third parties.

**Data Usage**:
- Your data: Used only for your analysis
- Aggregated data: Anonymous statistics for improving the platform (opt-in)

### Can I delete my data?

Yes, you have full control:

**Options**:
- **Export Data**: Download all data as CSV/JSON
- **Delete Account**: Permanently delete all data (GDPR/CCPA compliance)
- **Data Retention**: 30-day soft delete (recoverable), then permanent

**Process**:
1. Settings → Privacy → Delete Account
2. Confirm via email
3. 30-day grace period
4. Permanent deletion

### Is Plaid secure?

Yes. Plaid is a leading financial data aggregator used by:
- Venmo, Robinhood, Coinbase, Betterment
- Bank-level security (256-bit encryption)
- Never stores your bank login credentials
- Read-only access (cannot move money)

**How It Works**:
1. You enter credentials directly into Plaid (not us)
2. Plaid securely connects to your bank
3. Plaid sends us read-only data
4. You can disconnect anytime

### What permissions does Plaid need?

**Read-Only Access**:
- Account balances
- Transaction history (60-90 days)
- Holdings and asset allocation
- Account ownership details

**Cannot**:
- Transfer money
- Make trades
- Change account settings
- Access login credentials

---

## Technical Questions

### What browsers are supported?

**Fully Supported**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Mobile**:
- iOS Safari 14+
- Chrome Android 90+

**Not Supported**:
- Internet Explorer (discontinued)

### Why is the Monte Carlo simulation slow?

**Expected Performance**: 3-5 seconds for 5,000 iterations

**If Slower**:
1. **Browser Issues**: Try Chrome or Firefox
2. **System Resources**: Close other tabs/applications
3. **Reduce Iterations**: Settings → Simulations → Max Iterations (reduce to 1,000)
4. **Clear Cache**: Settings → Advanced → Clear Cache

### Can I access the platform offline?

**Limited Offline Support**:
- View previously loaded data
- Read educational content
- Review saved reports

**Requires Internet**:
- AI chat
- Portfolio optimization
- Monte Carlo simulation
- Account syncing
- Real-time data

### Is there a mobile app?

**Current State**: Mobile-optimized web app (responsive design)

**Planned**: Native iOS and Android apps (Q3 2025)

**Mobile Web Features**:
- Full dashboard access
- Goal tracking
- Portfolio viewing
- Notifications
- Limited: Complex charts and simulations (use desktop for best experience)

### Can I use the API?

Yes! We offer a REST API for developers:

**Use Cases**:
- Custom integrations
- Data export/import
- Automated monitoring
- Third-party tools

**Documentation**: See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

**Access**: Available on Professional and Enterprise plans

### How often is market data updated?

**Update Frequency**:
- **End-of-Day Prices**: Daily at 6 PM ET
- **Portfolio Values**: Real-time when accounts are synced
- **Economic Data**: Weekly (inflation, interest rates)
- **Historical Returns**: Monthly

**Data Sources**:
- Alpha Vantage
- Yahoo Finance
- Federal Reserve Economic Data (FRED)

---

## Pricing & Plans

### Is there a free trial?

**Yes!** 30-day free trial with full access:
- All features unlocked
- Unlimited goals
- Unlimited simulations
- No credit card required

**After Trial**:
- Basic: $9.99/month
- Professional: $29.99/month
- Enterprise: Custom pricing

### What's included in each plan?

**Basic Plan** ($9.99/month):
- Up to 3 goals
- Basic portfolio optimization
- 1,000 Monte Carlo iterations
- Email support

**Professional Plan** ($29.99/month):
- Unlimited goals
- Advanced optimization
- 5,000+ Monte Carlo iterations
- Tax optimization
- Multi-goal planning
- Priority support
- API access

**Enterprise Plan** (Custom):
- Multi-user accounts
- Advisor collaboration
- White-label option
- Dedicated support
- Custom integrations

### Is there a discount for annual billing?

**Yes!**
- Basic: $99/year (save $20, 2 months free)
- Professional: $299/year (save $60, 2 months free)

### Can I change plans anytime?

Yes:
- **Upgrade**: Immediate access to new features, prorated billing
- **Downgrade**: Takes effect at next billing cycle
- **Cancel**: Access until end of current billing period, then read-only

### Is there a money-back guarantee?

**30-Day Money-Back Guarantee**: If not satisfied, request full refund within 30 days of purchase.

---

## Troubleshooting

### I can't log in

**Solutions**:
1. **Forgot Password**: Click "Forgot Password" on login page
2. **Account Locked**: Too many failed attempts → Wait 15 minutes or contact support
3. **2FA Issues**: Use backup codes or contact support to reset
4. **Email Not Verified**: Check spam folder for verification email

### Monte Carlo simulation fails

**Error**: "Simulation failed to complete"

**Solutions**:
1. **Reduce Iterations**: Settings → Simulations → Max Iterations (try 1,000)
2. **Check Goal Parameters**: Ensure all required fields filled
3. **Clear Cache**: Settings → Advanced → Clear Cache
4. **Try Different Browser**: Switch to Chrome or Firefox

### Plaid connection failed

**Error**: "Unable to connect to [Bank Name]"

**Solutions**:
1. **Verify Credentials**: Check username/password at bank's website
2. **Security Questions**: Some banks require additional verification
3. **Try Desktop**: Mobile connections can be finicky
4. **Bank Issues**: Check if bank is undergoing maintenance
5. **Alternative**: Manual CSV import

### Portfolio optimization produces strange results

**Issue**: Recommended allocation seems unrealistic

**Possible Causes**:
1. **Risk Tolerance**: Check risk questionnaire score
2. **Constraints**: Remove or adjust constraints (ESG, sector limits)
3. **Time Horizon**: Short horizons favor conservative allocations
4. **Market Data**: Refresh market data (Settings → Data → Refresh)

### Dashboard not loading

**Solutions**:
1. **Hard Refresh**: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. **Clear Browser Cache**: Settings → Privacy → Clear Data
3. **Disable Extensions**: Try incognito/private mode
4. **Check Internet**: Verify connection is stable
5. **Backend Status**: Check http://localhost:8000/health (dev) or status page

### Export to Excel isn't working

**Issue**: Downloaded file is corrupted or won't open

**Solutions**:
1. **Check File Type**: Ensure .xlsx extension
2. **Try CSV**: Alternative format (Settings → Export → CSV)
3. **Browser Download Settings**: Check download location and permissions
4. **Excel Version**: Update to Excel 2016+ or use Google Sheets

### AI chat is not responding

**Issue**: Message sent but no response

**Solutions**:
1. **Check API Key**: Backend .env must have valid ANTHROPIC_API_KEY
2. **Rate Limits**: Wait 1 minute if many requests sent
3. **Message Length**: Keep messages under 2,000 characters
4. **Backend Logs**: Check terminal for error messages
5. **Restart Backend**: Kill and restart uvicorn server

---

## Still Have Questions?

### Contact Support

- **Email**: support@wealthnavigator.ai
- **Response Time**:
  - Basic: 24-48 hours
  - Professional: 12-24 hours
  - Enterprise: 4-8 hours
- **Live Chat**: Available 9 AM - 5 PM ET (Professional & Enterprise plans)

### Community Resources

- **User Forum**: https://community.wealthnavigator.ai
- **GitHub Discussions**: https://github.com/yourusername/wealthNavigator/discussions
- **Discord Server**: https://discord.gg/wealthnavigator

### Documentation

- [Getting Started Guide](GETTING_STARTED.md)
- [Feature Tutorials](FEATURE_TUTORIALS.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Developer Guide](DEVELOPER_GUIDE.md)

---

**Last Updated**: January 2025
