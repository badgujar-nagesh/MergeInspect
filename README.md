# 🤖 MergeInspect Code Review Agent

AI-powered GitHub Pull Request code review system. Automatically analyzes PR diffs using GPT-4o and posts inline review comments directly back to GitHub — mirroring GitHub Copilot's review workflow.

## ✨ Features

- 🔍 **AI Code Review** — GPT-4o analyzes PRs for Security, Performance, Code Quality & Architecture issues
- 🐙 **Posts to GitHub PR** — Inline review comments posted directly on the diff (signature feature)
- 📊 **Scored Reports** — Overall + per-category scores (0–100)
- 📋 **Review History** — Browse and filter all past reviews
- 🔐 **Auth** — Laravel Sanctum token authentication

## 🛠 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Laravel 12, PHP 8.3, MySQL 8        |
| Frontend   | React 18, Vite 5, Tailwind CSS 3    |
| AI         | OpenAI GPT-4o (JSON structured output) |
| GitHub API | REST v3 — PR Review API             |
| Deployment | AWS EC2 t2.micro, Nginx, Let's Encrypt |
| CI/CD      | GitHub Actions                      |

---

## 🚀 Local Setup

### Prerequisites
- PHP 8.2+, Composer
- Node.js 20+
- MySQL 8
- OpenAI API key
- GitHub Personal Access Token (`repo` scope)

### Backend

```bash
cd backend

# Install packages (one-time)
docker run --rm -u "$(id -u):$(id -g)" \
  -v "$(pwd):/var/www/html" -w /var/www/html \
  laravelsail/php82-composer:latest \
  composer install --ignore-platform-reqs

# Copy env
cp .env.example .env

# Generate app key + JWT secret
./vendor/bin/sail php artisan key:generate
./vendor/bin/sail php -r "echo 'JWT_SECRET=' . base64_encode(random_bytes(32)) . PHP_EOL;"
# → paste that JWT_SECRET= line into .env

# Start everything
./vendor/bin/sail up -d

# Migrate
./vendor/bin/sail artisan migrate

# Open dashboard
open http://localhost/dashboard

# Run migrations
./vendor/bin/sail artisan migrate

# Start server
./vendor/bin/sail artisan serve
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxies /api → localhost:8000)
npm run dev
```

Open http://localhost:5173, register an account, go to **Settings** and save your GitHub PAT, then go to **New Review** and enter a GitHub repo URL + PR number.

---

## 🐙 GitHub PR Comment Feature

When "Post review comments to GitHub PR" is enabled, the system:

1. Builds a review summary with overall score and finding counts
2. Creates inline comments on exact diff lines for each finding
3. Calls `POST /repos/:owner/:repo/pulls/:pr/reviews` with `event: COMMENT`
4. Saves the GitHub review ID back to the database

Each inline comment includes:
- Severity emoji (🚨 Critical / ⚠️ High / 🔶 Medium / 🔵 Low)
- Issue description
- Recommendation

---

## 📁 Project Structure

```
gitreview-ai/
├── backend/                  # Laravel API
│   ├── app/
│   │   ├── DTOs/             # ReviewRequestDto, GithubPRDto
│   │   ├── Http/
│   │   │   ├── Controllers/  # Auth, GithubToken, Review
│   │   │   ├── Requests/     # Validated form requests
│   │   │   └── Resources/    # API response resources
│   │   ├── Models/           # User, Review, ReviewFinding, etc.
│   │   └── Services/
│   │       ├── GitHubService.php   ← Fetch PR + post review comments
│   │       ├── OpenAIService.php   ← GPT-4o structured JSON review
│   │       └── ReviewService.php   ← Orchestrates full pipeline
│   └── database/migrations/
│
├── frontend/                 # React + Vite + Tailwind
│   └── src/
│       ├── api/              # axios instance + API helpers
│       ├── components/       # ScoreCard, FindingsList, GithubPostStatus, etc.
│       ├── context/          # AuthContext
│       └── pages/            # Login, Dashboard, NewReview, ReviewDetail, History, Settings
│
└── .github/workflows/
    └── deploy.yml            # GitHub Actions CI/CD
```

---

## ☁️ AWS Deployment

See the full deployment guide in the project documentation. Quick summary:

1. Launch EC2 t2.micro (Ubuntu 22.04)
2. Install PHP 8.3, MySQL, Nginx, Node 20
3. Clone repo to `/var/www/gitreview`
4. Configure Nginx (serves React SPA + Laravel API under `/api`)
5. Set up SSL with `certbot --nginx`
6. Add GitHub Secrets: `EC2_HOST`, `EC2_SSH_KEY`
7. Push to `main` — GitHub Actions deploys automatically

---

## 📄 License

MIT
