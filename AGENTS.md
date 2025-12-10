# Repository Guidelines

## Project Structure & Module Organization
- `backend/` hosts the FastAPI service; domain logic sits in `app/{api,services,agents,schemas}`, migrations in `alembic/`, and automated checks target `tests/{unit,integration,performance}`.
- `frontend/` carries the React + Vite client with feature folders inside `src/{components,hooks,services,utils}` and matching suites in `frontend/tests/{unit,integration}`.
- Shared documentation lives in `docs/` and `development_docs/`; shell helpers such as `start-backend.sh`, `start-frontend.sh`, and root `docker-compose.yml` wire the stack.

## Build, Test, and Development Commands
- Backend dev loop: `cd backend && uvicorn app.main:app --reload` for live API reloads; `./start-backend.sh` adds local dependencies.
- Backend quality gates: `cd backend && ruff check app tests` to lint, `pytest` (configured via `pytest.ini`) to enforce coverage, and `alembic upgrade head` before exercising new DB code.
- Frontend workflows: `cd frontend && npm run dev` for Vite, `npm run build` for production bundles, `npm run test` or `npm run test:coverage` for Vitest, and `npm run lint` to apply the shared ESLint config.

## Coding Style & Naming Conventions
- Python follows PEP 8: 4-space indents, snake_case functions, PascalCase classes, and UPPER_SNAKE_CASE constants; keep type hints and docstrings on service and agent boundaries (`app/services`, `app/agents`).
- Run `ruff check . --fix` prior to committing; format imports with Ruff rather than ad-hoc tools to stay consistent with CI.
- TypeScript uses 2-space indents, PascalCase component files (`GoalSummaryCard.tsx`), camelCase hooks/utilities, and colocated specs named `Component.test.tsx`.

## Testing Guidelines
- Place new backend tests under `backend/tests/unit` or `integration`; name files `test_<feature>.py`, rely on fixtures from `tests/conftest.py`, and tag long scenarios with `@pytest.mark.slow` to enable `pytest -m "not slow"`.
- Maintain coverage by running `pytest --cov --cov-report=html` and checking `backend/htmlcov/index.html`; delete regenerated reports before committing.
- Frontend tests live in `frontend/tests` or `src/test`; organize suites with `describe('<Component />', ...)` and ensure `npm run test:coverage` passes ahead of reviews.
- Use `docker-compose up` when validating cross-service flows so contract drift surfaces before merging.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `docs:`) as in the existing history; keep scopes concise and present tense.
- Base branches on `feature/<slug>`, `bugfix/<issue>`, or `docs/<topic>` and reference ticket IDs when available.
- Pull requests should outline the change, list verification commands, attach UI screenshots for visible updates, and note any new env vars, migrations, or scripts.
