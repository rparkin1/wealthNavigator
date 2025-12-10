# CI/CD Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose installed
- GitHub repository with Actions enabled
- AWS account (for production deployments)

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/your-org/wealthnavigator.git
cd wealthnavigator

# 2. Create environment file
cp .env.example .env
# Edit .env with your API keys

# 3. Start all services
docker-compose up -d

# 4. Access the application
# Frontend: http://localhost:8080
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Running Tests Locally

```bash
# Backend tests
cd backend
uv run pytest tests/ -v --cov

# Frontend tests
cd frontend
npm test -- --coverage

# Integration tests
docker-compose up -d
# Wait for services to be healthy
curl http://localhost:8000/health
```

## 📦 CI/CD Pipeline

### Workflow Triggers

**Main Pipeline** (`.github/workflows/ci.yml`):
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Dependency Updates** (`.github/workflows/dependency-update.yml`):
- Weekly schedule (Mondays at 9 AM UTC)
- Manual trigger via GitHub Actions UI

### Pipeline Jobs

| Job | Purpose | Runs On |
|-----|---------|---------|
| `backend-test` | Backend tests + coverage | All PRs/pushes |
| `frontend-test` | Frontend tests + coverage | All PRs/pushes |
| `code-quality` | Linting, formatting, security | All PRs/pushes |
| `integration-test` | Full stack testing | All PRs/pushes |
| `docker-build` | Container images | All PRs/pushes |
| `performance-test` | Performance benchmarks | Push to `main` only |
| `deploy-staging` | Deploy to staging | Push to `develop` |
| `deploy-production` | Deploy to production | Push to `main` |

### Deployment Flow

```
develop branch → Staging Environment
   ↓
   Manual testing
   ↓
   Merge to main
   ↓
main branch → Production Environment
```

## 🔧 Configuration Files

### GitHub Actions
- `.github/workflows/ci.yml` - Main CI/CD pipeline
- `.github/workflows/dependency-update.yml` - Automated dependency updates

### Docker
- `backend/Dockerfile` - Backend container configuration
- `backend/.dockerignore` - Files to exclude from backend image
- `frontend/Dockerfile` - Frontend container configuration
- `frontend/.dockerignore` - Files to exclude from frontend image
- `frontend/nginx.conf` - Nginx configuration for frontend
- `docker-compose.yml` - Local development environment

## 🔐 GitHub Secrets Setup

Required secrets for full CI/CD functionality:

```bash
# AWS Deployment
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY

# API Services
ANTHROPIC_API_KEY

# Monitoring
CODECOV_TOKEN
SNYK_TOKEN
SLACK_WEBHOOK
```

To add secrets:
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with its value

## 🐳 Docker Commands

### Build Images
```bash
# Build backend
docker build -t wealthnavigator-backend:latest ./backend

# Build frontend
docker build -t wealthnavigator-frontend:latest ./frontend
```

### Run Containers
```bash
# Start with docker-compose
docker-compose up -d

# Start specific service
docker-compose up -d backend

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Database Operations
```bash
# Run migrations
docker-compose exec backend uv run alembic upgrade head

# Create new migration
docker-compose exec backend uv run alembic revision --autogenerate -m "description"

# Access database
docker-compose exec postgres psql -U postgres -d wealthnavigator
```

## 📊 Monitoring Pipeline Status

### GitHub Actions UI
- Navigate to repository → Actions tab
- View workflow runs, logs, and artifacts

### Status Badges
Add to README.md:
```markdown
![CI/CD](https://github.com/your-org/wealthnavigator/actions/workflows/ci.yml/badge.svg)
```

### Coverage Reports
- Codecov: https://codecov.io/gh/your-org/wealthnavigator
- View coverage trends and detailed reports

## 🔄 Common Workflows

### Making Changes
```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and test locally
docker-compose up -d
# Run tests

# 3. Commit and push
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature

# 4. Create Pull Request
# CI/CD pipeline will automatically run

# 5. After approval, merge to develop
# Automatically deploys to staging

# 6. After staging validation, merge to main
# Automatically deploys to production
```

### Updating Dependencies
```bash
# Python dependencies
cd backend
uv sync --upgrade

# npm dependencies
cd frontend
npm update

# Commit changes
git add .
git commit -m "chore(deps): update dependencies"
git push
```

### Troubleshooting Failed Pipelines
```bash
# 1. Check logs in GitHub Actions UI
# 2. Reproduce locally with Docker
docker-compose up --build

# 3. Run specific test that failed
cd backend && uv run pytest tests/test_specific.py -v

# 4. Fix issue and push
git add .
git commit -m "fix: resolve test failure"
git push
```

## 🚨 Important Notes

1. **Never commit secrets** - Use `.env` files locally, GitHub Secrets in CI/CD
2. **Run tests before pushing** - Catch issues early
3. **Keep dependencies updated** - Security and performance
4. **Monitor staging closely** - Catch issues before production
5. **Review Docker logs** - Diagnose container issues quickly

## 📚 Further Reading

- [Full CI/CD Documentation](./CI-CD-PIPELINE-COMPLETE.md)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [React Deployment](https://create-react-app.dev/docs/deployment/)

## ✅ Quick Checklist

Before pushing to production:
- [ ] All tests passing locally
- [ ] Docker build successful
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Staging environment tested
- [ ] Performance benchmarks met
- [ ] Security scans passed

---

**Need help?** Check the [full CI/CD documentation](./CI-CD-PIPELINE-COMPLETE.md) or open an issue.
