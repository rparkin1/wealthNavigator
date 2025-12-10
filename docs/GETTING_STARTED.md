# Getting Started with WealthNavigator AI

Welcome to WealthNavigator AI! This guide will walk you through setting up the platform and getting started with your financial planning journey.

## Table of Contents

- [System Requirements](#system-requirements)
- [Installation](#installation)
  - [Quick Start (Docker)](#quick-start-docker)
  - [Manual Installation](#manual-installation)
- [Initial Configuration](#initial-configuration)
- [First-Time Setup](#first-time-setup)
- [Your First Goal](#your-first-goal)
- [Next Steps](#next-steps)

---

## System Requirements

### For Users (Running Pre-Built Application)

- **Web Browser**: Chrome, Firefox, Safari, or Edge (latest version)
- **Internet Connection**: Stable broadband connection
- **Screen Resolution**: Minimum 1280x720, recommended 1920x1080

### For Developers (Running from Source)

- **Node.js**: 18.x or higher
- **Python**: 3.11 or higher
- **Docker**: 20.x or higher (optional, for containerized setup)
- **PostgreSQL**: 15 or higher
- **Redis**: 7 or higher
- **RAM**: Minimum 8GB, recommended 16GB
- **Storage**: 10GB free space

---

## Installation

### Quick Start (Docker)

The fastest way to get WealthNavigator AI running is with Docker Compose:

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/wealthNavigator.git
   cd wealthNavigator
   ```

2. **Configure environment variables**
   ```bash
   # Copy example environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Add your Anthropic API key**

   Edit `backend/.env` and add:
   ```env
   ANTHROPIC_API_KEY=sk-ant-your-api-key-here
   ```

4. **Start all services**
   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

That's it! WealthNavigator AI is now running.

---

### Manual Installation

For development or custom deployments:

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv

   # Activate virtual environment
   # On macOS/Linux:
   source venv/bin/activate

   # On Windows:
   venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start PostgreSQL and Redis**
   ```bash
   # Using Docker
   docker run --name wealthnav-postgres \
     -e POSTGRES_PASSWORD=dev \
     -e POSTGRES_DB=wealthnav \
     -p 5432:5432 \
     -d postgres:15

   docker run --name wealthnav-redis \
     -p 6379:6379 \
     -d redis:7
   ```

5. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   ```env
   # Database
   DATABASE_URL=postgresql://postgres:dev@localhost:5432/wealthnav

   # Redis
   REDIS_URL=redis://localhost:6379

   # Anthropic AI
   ANTHROPIC_API_KEY=sk-ant-your-api-key-here

   # Security (generate with: openssl rand -hex 32)
   SECRET_KEY=your-secret-key-here
   ```

6. **Initialize database**
   ```bash
   alembic upgrade head
   ```

7. **Start backend server**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**

   Open http://localhost:5173 in your browser

---

## Initial Configuration

### 1. Create Your Account

On first launch, you'll be prompted to create an account:

1. Click **"Sign Up"**
2. Enter your email and create a password
3. Verify your email (check your inbox)
4. Complete your profile information

### 2. Security Setup

**Multi-Factor Authentication (Recommended)**

1. Navigate to **Settings** → **Security**
2. Click **"Enable 2FA"**
3. Scan QR code with your authenticator app
4. Enter verification code
5. Save recovery codes in a secure location

### 3. Connect Financial Accounts (Optional)

WealthNavigator AI can automatically import your financial data:

1. Go to **Portfolio** → **Connect Accounts**
2. Click **"Add Account"**
3. Search for your bank or brokerage
4. Complete secure authentication
5. Select accounts to link
6. Review and confirm

**Supported Institutions**: 10,000+ banks and brokerages via Plaid

---

## First-Time Setup

### Quick Setup Wizard

WealthNavigator AI includes a 10-minute guided setup:

1. **Financial Profile**
   - Current age and retirement age
   - Annual income
   - Current savings
   - Risk tolerance (questionnaire)

2. **Initial Goals**
   - Primary financial goal
   - Target amount
   - Target date
   - Priority level

3. **Budget Overview**
   - Monthly income
   - Major expense categories
   - Savings rate

4. **Portfolio Setup**
   - Current investments (manual entry or import)
   - Account types (401k, IRA, Taxable, etc.)
   - Asset allocation preferences

---

## Your First Goal

Let's create your first financial goal using natural language:

### Example: Retirement Planning

1. **Open the Chat Interface**

   Click on the **Chat** icon or press `Ctrl/Cmd + K`

2. **Describe Your Goal**

   Type naturally, for example:
   ```
   I want to retire at age 65 with $80,000 per year in income.
   I'm currently 35 and have $50,000 saved in my 401k.
   ```

3. **AI Analysis**

   WealthNavigator's AI agents will:
   - Analyze your goal feasibility
   - Calculate required monthly savings
   - Run Monte Carlo simulations
   - Suggest optimal asset allocation
   - Identify tax optimization opportunities

4. **Review Recommendations**

   You'll see:
   - **Success Probability**: e.g., "72% chance of success"
   - **Required Monthly Savings**: e.g., "$850/month"
   - **Recommended Asset Allocation**: e.g., "70% stocks, 25% bonds, 5% cash"
   - **Tax Optimization**: e.g., "Increase 401k contributions by $200/month"

5. **Save Your Goal**

   Click **"Accept Goal"** to add it to your dashboard

### More Goal Examples

**Education Funding:**
```
I need to save $100,000 for my daughter's college in 10 years
```

**Home Purchase:**
```
I want to buy a $500,000 house in 5 years with 20% down
```

**Emergency Fund:**
```
I need 6 months of expenses ($30,000) for emergencies
```

---

## Next Steps

### Explore Key Features

1. **Dashboard Overview**

   View all goals, portfolio value, and success probabilities at a glance

2. **Monte Carlo Simulation**

   Run "what-if" scenarios:
   - What if market returns are below average?
   - What if I increase savings by 10%?
   - What if I retire 3 years earlier?

3. **Tax Optimization**

   Review tax-saving recommendations:
   - Asset location optimization
   - Tax-loss harvesting opportunities
   - Withdrawal strategies
   - Roth conversion analysis

4. **Risk Management**

   Assess and manage portfolio risk:
   - Risk tolerance questionnaire
   - Diversification analysis
   - Hedging strategies
   - Stress test results

5. **Multi-Goal Planning**

   Coordinate multiple goals:
   - Goal dependencies (e.g., emergency fund before retirement)
   - Priority-based funding
   - Household optimization
   - Mental accounting buckets

### Get Help

- **In-App Chat**: Ask questions anytime - type `Ctrl/Cmd + K`
- **Tutorial Videos**: Click **Help** → **Tutorials**
- **FAQ**: See [FAQ.md](FAQ.md)
- **Documentation**: Browse all docs at [docs/](.)
- **Support**: Email support@wealthnavigator.ai

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Chat | `Ctrl/Cmd + K` |
| New Goal | `Ctrl/Cmd + N` |
| Dashboard | `Ctrl/Cmd + H` |
| Portfolio | `Ctrl/Cmd + P` |
| Run Simulation | `Ctrl/Cmd + R` |
| Search | `Ctrl/Cmd + F` |

---

## Troubleshooting

### Cannot Connect to Backend

**Error**: "Network Error" or "Failed to fetch"

**Solution**:
1. Verify backend is running: `http://localhost:8000/health`
2. Check `frontend/.env` has correct `VITE_API_BASE_URL`
3. Ensure no firewall blocking port 8000

### Database Connection Failed

**Error**: "Could not connect to database"

**Solution**:
1. Verify PostgreSQL is running: `docker ps`
2. Check database credentials in `backend/.env`
3. Ensure database exists: `psql -U postgres -l`

### Monte Carlo Simulation Slow

**Issue**: Simulations taking >30 seconds

**Solution**:
1. Check system resources (RAM, CPU)
2. Reduce iteration count (Settings → Simulations → Max Iterations)
3. Clear Redis cache: `redis-cli FLUSHDB`

### More Issues?

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions.

---

## Security Best Practices

1. **Use Strong Passwords**: Minimum 12 characters, mix of letters, numbers, symbols
2. **Enable 2FA**: Multi-factor authentication is highly recommended
3. **Keep Software Updated**: Regular updates include security patches
4. **Review Connected Accounts**: Periodically check Settings → Connected Accounts
5. **Use HTTPS**: Always access via secure connection in production

---

## What's Next?

Congratulations on setting up WealthNavigator AI! Here are recommended next steps:

1. Complete the **Risk Tolerance Questionnaire** (Settings → Profile)
2. Add all financial accounts for a complete picture
3. Create 2-3 core financial goals
4. Run your first **Monte Carlo Simulation**
5. Review **Tax Optimization** recommendations
6. Explore **Feature Tutorials** for in-depth guides

**Ready to dive deeper?**
- [Feature Tutorials](FEATURE_TUTORIALS.md)
- [User Guide](USER_GUIDE.md)
- [API Documentation](API_DOCUMENTATION.md)

---

**Need Help?** Contact support@wealthnavigator.ai or open an issue on [GitHub](https://github.com/yourusername/wealthNavigator/issues).
