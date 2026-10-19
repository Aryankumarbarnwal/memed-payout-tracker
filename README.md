# Meme'd Campaign Payout Tracker

Brands create campaigns with a milestone payout ladder. Creators submit posts and earn the payout of the highest milestone their post has crossed, always within the campaign budget.

- **Live app:** <https://memed-payout-tracker-uw26.vercel.app/login>
- **Live API:** <https://memed-payout-tracker-5.onrender.com/>/health
- **Note:** the backend runs on Render's free tier and sleeps when idle. The first request can take 30-60 seconds.

## Tech stack

- Backend: Node.js, TypeScript, Express, MongoDB (Mongoose), JWT, Zod
- Frontend: Next.js (App Router), TypeScript
- Tests: Jest (ts-jest)
- Deployment: MongoDB Atlas, Render (backend), Vercel (frontend)

## Project structure

```
backend/src
  config/       db connection
  models/       User, Campaign, Submission
  services/     payout, auth, campaign, submission (business logic)
  controllers/  request validation and responses
  routes/       URL wiring
  middleware/   auth, role check, error handler
  tests/        Jest unit tests
frontend/src
  app/          login, signup, brand, creator pages
  lib/          api wrapper, auth context, types
```

## Setup

Requirements: Node 18+, a MongoDB URI (local or Atlas).

### Backend

```bash
cd backend
cp .env.example .env     # fill in the values
npm install
npm run dev              # http://localhost:5000
npm test                 # unit tests
npm run build && npm start
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev              # http://localhost:3000
```

## Environment variables

| Variable | Where | Description |
|---|---|---|
| `PORT` | backend | Server port (default 5000; Render sets it) |
| `MONGO_URI` | backend | MongoDB connection string |
| `JWT_SECRET` | backend | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | backend | Token lifetime, e.g. `7d` |
| `NEXT_PUBLIC_API_URL` | frontend | Base URL of the backend |

## API

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | public | Sign up as brand or creator |
| POST | `/api/auth/login` | public | Login, returns JWT |
| GET | `/api/auth/me` | any | Current user |
| POST | `/api/campaigns` | brand | Create campaign |
| GET | `/api/campaigns/mine` | brand | Own campaigns with spent / remaining |
| GET | `/api/campaigns` | creator | Live campaigns |
| POST | `/api/submissions` | creator | Submit a post link |
| GET | `/api/submissions/mine` | creator | Own submissions and total earnings |
| PATCH | `/api/submissions/:id/views` | none | Update view count (simulates platform data) |

## Payout logic

```
eligible = payout of the highest milestone whose threshold <= views
delta    = max(eligible - alreadyPaid, 0)
payout   = min(delta, remainingBudget)
```

Pure functions in `services/payout.service.ts`, covered by Jest tests (milestones, repeated updates, budget cap).

## Assumptions and decisions

- Payout equals the highest milestone crossed. Milestones are not summed.
- If one update crosses two milestones, the creator gets the highest one, minus what was already paid.
- If the budget runs out mid-payout, the creator gets the remaining budget (partial payout). The rest is forfeited.
- Views cannot decrease (400). There are no clawbacks.
- A campaign is "live" while `spent < totalBudget`.
- Milestone thresholds must be unique, payouts must increase with views, and the top payout cannot exceed the total budget.
- All money values are whole rupees (integers).
- The post link must belong to the campaign's platform (Instagram or YouTube), and the same link cannot be submitted twice to a campaign.
- `PATCH /views` has no auth, as per the brief. The "Update views" box on the creator page is a demo helper for this endpoint.

## Concurrency and double-pay protection

- Budget is reserved with a single atomic MongoDB update that computes `min(amount, remaining)` inside the database, so `spent` can never exceed `totalBudget`, even with simultaneous requests.
- The submission is then updated only if `paidAmount` is still the value that was read (optimistic lock). If another request paid in between, the reserved budget is returned and the update is retried. Repeated updates therefore never double-pay.

## Not implemented

Redis caching, spike flagging, Docker, and a concurrency integration test.

## Scaling to 10,000 creators

- Index `Submission` by `campaignId` and `creatorId`, and paginate list endpoints.
- Cache the live campaign list in Redis and invalidate on change.
- Run multiple stateless API instances behind a load balancer (JWT keeps them stateless).
- Move view updates to a queue so bursts are processed asynchronously. The atomic budget update keeps results correct.
- Use a MongoDB replica set with read replicas, and shard by `campaignId` if write volume grows.
