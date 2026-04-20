# 🏟️ StadiumPulse — Smart Stadium Assistant

> Real-time crowd tracking, deterministic recommendations, and AI-powered explanations for sporting venue attendees.

**Live Demo:** _[Deploy URL from Cloud Run]_

---

## 📋 Chosen Vertical

**Fan / Attendee Experience at Large-Scale Sporting Venues**

StadiumPulse helps attendees at MetroArena (a fictional 60,000-seat soccer stadium) navigate the venue efficiently — finding the shortest queues, getting smart recommendations for food, restrooms, and exits, and understanding crowd patterns in real time.

---

## 🧠 Approach & Logic

### Problem
Large sporting events create painful friction: long queues, confusing layouts, crowded concourses, and no visibility into which facilities are busy. Attendees waste valuable event time waiting in lines they didn't need to join.

### Solution
A mobile-first web app that provides:

1. **Live Crowd Heatmap** — SVG venue map showing crowd density per zone (green/yellow/red)
2. **Real-Time Wait Times** — Filterable, sortable list of all amenities with estimated wait times
3. **Deterministic Recommendations** — Weighted scoring engine that picks the best option based on wait time, distance, crowd density, and match phase
4. **AI Explanation** — "Explain why" button uses Google Gemini to provide natural-language reasoning for each recommendation

### Decision-Making Logic

The recommendation engine uses a transparent weighted scoring formula:

```
score = 0.40 × waitTime + 0.25 × distance + 0.20 × crowdDensity + 0.15 × matchPhase
```

| Factor | Weight | Description |
|--------|--------|-------------|
| Wait Time | 40% | Lower wait = higher score |
| Distance | 25% | Closer to user's zone = higher score |
| Crowd Density | 20% | Less crowded zone = higher score |
| Match Phase | 15% | Timing bonus (e.g., avoid halftime rush for food) |

This is **pure deterministic logic** — no AI randomness. Same inputs always produce the same recommendation. The AI (Gemini) is only used to *explain* a recommendation after it's computed, never to make the decision.

---

## 🔧 How It Works

### Architecture

Single Node.js 20 + Express server on Cloud Run:

```
┌─────────────────────────────────────────────┐
│          Cloud Run Service                  │
│                                             │
│  Static Frontend ─── API Routes             │
│  (Vite build)        GET  /health           │
│                      GET  /api/crowd        │
│                      POST /api/recommend    │
│                      POST /api/explain      │
│                                             │
│  Simulator ───────── Gemini Service         │
│  (seeded PRNG)       (cached + fallback)    │
└─────────────────────────────────────────────┘
```

### Data Simulation

Crowd data is simulated using a **seeded PRNG (Mulberry32)** that produces deterministic, match-phase-aware patterns:

- **Pre-game:** Gates filling, food popular, seats empty
- **First Half / Second Half:** Seats full, concourses quiet
- **Halftime:** Restrooms and food spike dramatically
- **Full Time:** Exits saturated, phased departure

Same seed (default: 42) + same match minute = **identical output every time**. This makes the app testable and demo-friendly.

### Match Simulation

The demo runs an accelerated match (9× speed = ~10 minutes for a full 90-minute game). All 5 phases progress automatically.

---

## 🌐 Google Services Integration

### 1. Google Gemini API (Core)
- **Purpose:** "Explain why" for recommendations — natural-language explanations
- **How:** Server-side only via `@google/genai` SDK, `gemini-2.0-flash` model
- **Cost Control:** Cached 60s, rate-limited 10/min/IP, 150 max tokens, temperature 0.3
- **Fallback:** Full template-based explanation when no API key is present
- **Security:** API key is a server-side environment variable, never sent to the client

### 2. Google Sheets (Optional)
- **Purpose:** Load venue configuration from a public Google Sheet
- **How:** Fetch published CSV/JSON via public URL — no API key, no OAuth
- **Fallback:** Bundled `venueLayout.js` data when no sheet ID is configured

### 3. Google Fonts
- **Purpose:** Inter font family for premium typography
- **How:** Loaded via `<link>` tag in HTML

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm 9+

### Install & Run Locally

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/stadiumpulse.git
cd stadiumpulse

# Install dependencies
npm install

# Start development servers (frontend + backend)
npm run dev
```

The app will be available at `http://localhost:5173` (Vite dev server proxies API calls to port 8080).

### Environment Variables (all optional)

```bash
# Copy the template
cp .env.example .env

# Edit .env with your values (all have working defaults)
GEMINI_API_KEY=       # Enables AI explanations (optional)
GOOGLE_SHEET_ID=      # Public sheet for venue config (optional)
SIMULATOR_SEED=42     # PRNG seed for deterministic simulation
MATCH_SPEED=9         # Speed multiplier (9 = ~10 min demo)
```

**Zero API keys required.** The app is fully functional without any configuration.

### Run Tests

```bash
# Run all tests (no API keys needed)
npm test

# Run with coverage
npm run test:coverage
```

---

## 🐳 Deploy to Cloud Run

```bash
# Set your GCP project
gcloud config set project YOUR_PROJECT_ID

# Enable APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Deploy (uses Cloud Build free tier)
gcloud run deploy stadiumpulse \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 1 \
  --concurrency 80 \
  --timeout 30s \
  --set-env-vars "NODE_ENV=production,GEMINI_API_KEY=your-key-here"
```

**Estimated cost: $0.00** (within Cloud Run and Cloud Build free tiers)

---

## 📁 Project Structure

```
├── server/                  # Node.js + Express backend
│   ├── index.js             # App entry (factory pattern for testing)
│   ├── middleware/           # Security headers, CORS, rate limiting
│   ├── routes/              # API route handlers (4 endpoints)
│   ├── services/            # Simulator, recommendation engine, Gemini, Sheets
│   ├── data/                # Venue layout, match timeline
│   └── utils/               # PRNG, cache, validation
│
├── src/                     # Frontend (Vite + vanilla JS)
│   ├── main.js              # App entry
│   ├── router.js            # Hash-based SPA router
│   ├── api.js               # Fetch wrapper
│   ├── styles/              # CSS design system (4 files)
│   ├── components/          # Reusable UI components (10 files)
│   ├── pages/               # SPA page modules (4 pages)
│   └── data/                # SVG icons
│
├── tests/                   # Vitest test suites
│   ├── server/              # 6 server test files
│   └── client/              # 1 client test file
│
├── Dockerfile               # Multi-stage build for Cloud Run
└── README.md                # This file
```

---

## 🧪 Testing

| Test Suite | File | What It Tests |
|-----------|------|---------------|
| Simulator | `tests/server/simulator.test.js` | Determinism, seed isolation, phase behavior |
| Recommendation | `tests/server/recommendationEngine.test.js` | Scoring, ranking, weights, edge cases |
| Gemini | `tests/server/gemini.test.js` | Template fallback, all phases/types |
| Validation | `tests/server/validation.test.js` | Input whitelist, XSS prevention, boundaries |
| Rate Limit | `tests/server/rateLimit.test.js` | Per-IP limits, window reset, IP isolation |
| API Integration | `tests/server/api.integration.test.js` | Full HTTP request/response cycle |
| Router | `tests/client/router.test.js` | Route matching, fallback, nav state |

All tests run **without any API keys** in < 5 seconds.

---

## 🔒 Security

- **No secrets in frontend:** Gemini API key is server-side only
- **Input validation:** Strict whitelist for types and zones; regex sanitization for IDs
- **Rate limiting:** Per-IP limits (10/min for explain, 60/min for other APIs)
- **Security headers:** Helmet (CSP, X-Frame-Options, HSTS, X-Content-Type-Options)
- **CORS:** Strict origin allowlist (not `*`)
- **No eval/innerHTML for user data:** All dynamic text rendered via `textContent`
- **Minimal dependencies:** 3 production packages only

---

## ♿ Accessibility

- Semantic HTML5 (`<nav>`, `<main>`, `<section>`, `<article>`)
- ARIA labels on all interactive elements
- `role="status"` on live-updating data
- Skip-to-content link
- Full keyboard navigation with visible focus rings
- Color-blind safe (icons + text supplement color coding)
- `prefers-reduced-motion` respected
- Minimum 4.5:1 contrast ratio (WCAG AA)

---

## 📝 Assumptions

1. **Simulated data** — Real sensor data is unavailable; crowd patterns are simulated with a seeded PRNG that produces realistic, match-phase-aware behavior
2. **Single instance** — Cloud Run limited to 1 instance for cost control; sufficient for demo traffic
3. **SVG map** — Custom SVG stadium map instead of Google Maps (zero cost, better indoor UX)
4. **Accelerated match** — Demo runs at 9× speed so judges can see all phases in ~10 minutes
5. **MetroArena** — Fictional venue with 8 zones, 22 amenities, designed for showcase
6. **Stateless** — No user accounts or persistent storage; state resets on server restart

---

## 📄 License

MIT
