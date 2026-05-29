# SIP Behaviour Analytics Platform

A full-stack PhD research platform for predictive analysis of SIP investment behaviour toward market volatility and investor psychology.

## Stack

- Frontend: Next.js, Tailwind CSS, shadcn-style components, Framer Motion
- Backend: Django, Django REST Framework
- Database: SQLite
- Charts: Recharts

## Main URLs

- Public landing page: `http://127.0.0.1:3000/`
- Public survey: `http://127.0.0.1:3000/survey`
- Researcher dashboard: `http://127.0.0.1:3000/admin-dashboard`
- API root: `http://127.0.0.1:8000/api/`

## Run Locally

Backend:

```powershell
cd backend
.venv\Scripts\python.exe manage.py migrate
.venv\Scripts\python.exe manage.py seed_questions
.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Frontend:

```powershell
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```

Set `RESEARCHER_PASSCODE` in `frontend/.env.local` before using the researcher dashboard.

## Research Features

- Participation-first premium fintech landing page with SIP awareness, research context, survey CTA, researcher profile, and public educational simulator.
- Frictionless five-step public survey with dynamic database-backed questions.
- Searchable multi-entry large-cap stock, SIP mutual fund, and investment preference input.
- Behaviour scoring engine that stores score, risk signal, investor type, and personalized summary.
- Protected `/admin-dashboard` with overview cards, animated charts, filters, search, CSV/Excel/PDF exports, and chart image export.
- Dynamic question management: add, edit, duplicate, delete, reorder, activate/deactivate, change type, preview survey, and manage scored options.
- Public SIP volatility simulation with sliders, compounding chart, bull, bear, high-volatility, and stable market scenarios.
