# ProofScreen — frontend

The recruiter dashboard and candidate intake for [ProofScreen](../proofscreen).
Next.js 16 (App Router), React 19, deployed **separately** from the API.

The API turns resume claims into a scored, quotable evidence graph. This app
renders it, and records the one thing the API cannot produce on its own: a
human hiring decision.

---

## Run it

```bash
cp .env.example .env.local        # then check PROOFSCREEN_API_URL
npm install
npm run dev                       # http://localhost:3000
```

The backend must be running separately:

```bash
cd ../proofscreen
uvicorn api.main:app --reload     # http://127.0.0.1:8000
python seed.py                    # four candidates and three role lenses
```

With no `OPENAI_API_KEY` the backend runs in **fixture mode** and with no
WhatsApp credentials it runs **dry-run**. Both are usable, and both are
labelled in the dashboard's top bar — a demo should never be able to claim a
live model or a sent message when neither happened.

### Environment

| Variable | Purpose |
| --- | --- |
| `PROOFSCREEN_API_URL` | Where the API is reachable **from the Next server**. Not `NEXT_PUBLIC_`, on purpose (see below). |
| `PROOFSCREEN_ENABLE_WRITES` | Server Actions are public HTTP endpoints and this app has no auth yet, so writes are off unless a deployment opts in. |
| `PROOFSCREEN_ENABLE_DEV_ACTIONS` | Enables the simulator, which writes `Channel.simulated` rows. Also needs `ENABLE_DEV_ENDPOINTS=true` on the backend. |

---

## How it talks to the API

**Every call is server-side.** Reads happen in Server Components; writes are
Server Actions in `lib/api/actions.ts`. The browser never contacts the API.

Three reasons, all of which bite on the day of a demo rather than in theory:

1. **No CORS.** The backend's allowed origins are an env var on a machine
   nobody wants to redeploy because a preview URL changed. Server to server,
   the browser's origin never enters the picture.
2. **The API's address stays private.** `PROOFSCREEN_API_URL` carries no
   `NEXT_PUBLIC_` prefix, so it is not inlined into the client bundle and the
   API can sit on an internal hostname with no public ingress.
3. **One timeout, retry and error policy**, in one file, for every screen.

**Nothing is cached.** `fetch` is uncached by default in Next 16, which is what
a live score board wants; `cache: "no-store"` is passed anyway so the intent
survives someone enabling `cacheComponents` later.

**Reads degrade, writes don't.** Every read goes through `safeGet`, so a dead
API produces an inline panel naming the cause and the fix instead of a
full-page error boundary. Mutations report failure loudly — a write that
silently did nothing is worse than one that errors.

```
lib/api/
  types.ts       hand-written mirror of api/schemas.py — the contract
  client.ts      server-only fetch, ApiError, safeGet, health
  recruiter.ts   one function per recruiter read
  candidates.ts  session read
  actions.ts     every mutation, as Server Actions
  format.ts      labels, dates, score→CSS bands
```

### The rule this codebase keeps

**Nothing in `lib/` or `components/` computes a score.** Not an average, not a
re-weighting, not a synthesised headline figure. Every number on screen is read
off the response exactly as the backend calculated it, because the product's
claim — *every recruiter-facing number is arithmetic over counted, quoted
evidence* — is worth nothing if the frontend quietly does arithmetic of its
own. Counts of rows (how many candidates carry a badge) are fine and are
labelled as counts. If a number needs to exist, it gets computed in Python and
added to the contract.

`format.ts` has one function that looks like an exception and isn't:
`scoreBand` maps a score the backend already produced onto a CSS class. It
never changes the score, and nothing reads the band back.

---

## Screens

Every screen below reads live data. There is no mock data layer any more —
`data/`, `types/` and `lib/data.ts` were deleted once nothing referenced them.

| Route | API | What it is |
| --- | --- | --- |
| `/recruiter` | `/recruiter/candidates`, `/recruiter/validation`, `/health` | Counts of rows, top of the ranking, the M4 headline, and the fixture/dry-run banner |
| `/recruiter/candidates` | `GET /recruiter/candidates?role_id=` | The ranked list with filters and a preview pane; the lens lives in the URL so a ranking is a shareable link |
| `/recruiter/candidates/[id]` | `GET /recruiter/candidates/{id}`, `/outcomes`, `POST /outcome` | The evidence graph, and where a decision is recorded |
| `/recruiter/jobs` | `GET /recruiter/roles` + one candidate read | Openings, with live applicant and qualified counts |
| `/recruiter/jobs/[id]` | `GET /recruiter/roles`, `?role_id=` | One opening: what it weights, and its cohort |
| `/recruiter/jobs/[id]/applicants` | `GET /recruiter/candidates?role_id=` | Its cohort, ranked under its own weights |
| `/recruiter/jobs/new` | `POST /recruiter/roles`, `GET /recruiter/taxonomy` | Create an opening. Every scored candidate re-ranks immediately |
| `/recruiter/talent-pools` | `GET /recruiter/candidates`, `/taxonomy` | Job families as pools, with real membership counts |
| `/recruiter/saved-searches` | `GET /recruiter/roles` | The same lenses, as saved rankings |
| `/recruiter/validation` | `GET /recruiter/validation?minimum_n=` | Evidence vs resume screening, against recorded decisions |
| `/recruiter/simulator` | `POST /dev/simulate` | Whole pipeline in one call. Gated |
| `/recruiter/diagnostics` | `GET /dev/detect`, `/dev/llm`, `/dev/fixture`, `POST /dev/reset` | Routing inspector, model counters, reset. Gated |
| `/candidate` | `GET /recruiter/roles` + a graph per lens | Openings, with this candidate's coverage under each |
| `/candidate/jobs/[id]` | `GET /recruiter/candidates/{id}?role_id=` | One opening from the candidate's side |
| `/candidate/start` | `POST /candidates`, `POST /candidates/text` | Resume in, claims and a WhatsApp opt-in code out |
| `/candidate/proof` | `GET /sessions/{id}` | Their verification, from consent gate to final score |
| `/candidate/profile` | `GET /sessions/{id}` + graph | Claims, dimensions and consistency — built from evidence, not a form |
| `/candidate/applications` | `GET /candidates/{id}/outcomes` | The decisions recorded against them |
| `/candidate/saved-jobs` | `GET /recruiter/roles` | Saved ids in `localStorage`, openings fetched live |
| `/candidate/proof/interview` | `POST /dev/sessions/{id}/start`, `/answer` | Step-by-step simulator. Gated |

### A role lens is an opening

The portal has "jobs"; ProofScreen has `JobRole` — a title, a job family,
claim weights and dimension weights. Those are not two things that resemble
each other. A lens says *what an opening wants proved*, and
`GET /recruiter/candidates?role_id=` says *who proved it best*. That is an
opening and its applicants, in the only terms this product has. So the jobs
screens are backed by `/recruiter/roles` rather than by a jobs table nobody
built, and `lib/api/openings.ts` is where that mapping lives.

Columns the backend genuinely cannot fill are not filled. The openings table
lost "Status" (a lens has no lifecycle — it shows which lens is the family
default) and "Posted" (`RoleOut` carries no timestamp — it shows what the
opening weights most). The create form lost location, experience band, salary
range, free-text description and a comma-separated skills list, because
`JobRole` stores none of them and a box that throws away what you type into it
is a bug, not a feature.

An "applicant" is a lens's own cohort — candidates whose resume routed to the
same job family, because those are the people its claim weights apply to.
Passing `role_id` re-ranks *every* scored candidate, so the length of that list
is identical for every lens and means nothing as a count; the screens link to
it separately rather than quietly widening the definition.

### The rule this codebase keeps

**Nothing in `lib/` or `components/` computes a score.** Not an average, not a
re-weighting, not a synthesised headline figure. Every number on screen is read
off the response exactly as the backend calculated it, because the product's
claim — *every recruiter-facing number is arithmetic over counted, quoted
evidence* — is worth nothing if the frontend quietly does arithmetic of its
own. Counts of rows are fine and are labelled as counts.

Two things look like exceptions and are not. `scoreBand` maps a score the
backend produced onto a CSS class, changing nothing. `weightShares` normalises
**weights** — recruiter inputs the backend itself rescales — to a share of
their own total, because dimension weights arrive on two different scales:
`/recruiter/roles` sends them summing to 100, `/recruiter/taxonomy` sends them
summing to 1.0, and nothing in either payload says which. Printing the second
lot raw told a recruiter this opening weighted Specificity at "0.2", or after
rounding at "0" — which reads as "does not care about specificity", the
reverse of true.

Sorting is deliberately not offered on the ranked list. The order *is* the
backend's ranking under the chosen lens; a "sort by resume score" control would
quietly replace an evidence ranking with the thing the product exists to beat.

### What has no backend and is honest about it

- **Saved roles** live in `localStorage` — per-browser, per-device, invisible
  to recruiters. There is no saved-jobs table and adding one is a backend
  change nobody asked for.
- **Apply** is not a row anywhere. An opening is a set of weights, so the way a
  candidate enters consideration is to be verified against them:
  "Get considered" routes into intake with that opening's `role_id`, a
  parameter `POST /candidates` already accepts.
- **Candidate identity** is the session id from intake, kept in a cookie so
  every candidate page can find it without `?session_id=` on every link. A
  cookie holding an id is a bookmark, not a credential — see below.

## Known gaps

Worth reading before this goes anywhere public.

**No authentication.** `/candidate-login` and `/recruiter-login` are unwired
screens. Server Actions compile to public HTTP endpoints reachable by direct
POST, so `requireWriteAccess()` in `lib/api/actions.ts` is the single seam
where a real session check belongs. Until then it refuses to run unless
`PROOFSCREEN_ENABLE_WRITES=true`, which keeps a public preview from being used
to onboard candidates or record hiring decisions. Field validation runs
server-side regardless.

**No candidate-scoped read.** `/candidate/proof` reads the score from the
*recruiter* graph route, because Phase 1 shipped nothing else. That route takes
a candidate id and no credential. The page renders only candidate-appropriate
fields — scores and dimensions, never the verbatim quotes or the contradiction
list, which exist so a recruiter can audit a number they are about to act on —
but the real fix is a candidate-scoped endpoint in the backend, not a frontend
filtering a payload it should never have received.

**`types.ts` is hand-maintained.** Deliberately, so the two deploy pipelines
stay independent — but it means a change to `api/schemas.py` has to be mirrored
in the same PR. The three `/dev/*` dicts are described in prose by the backend
rather than validated by it, so those types are read defensively.

**Coverage on `/candidate` is one graph fetch per opening.** `role_coverage` is
lens-specific — the same candidate covers 85% of one opening and 0% of another,
and that difference is why the screen exists — so a single default-weighted
fetch cannot be reused. Fine for a handful of openings; past that the fix is a
backend route returning coverage across all roles in one query, not a cached
approximation here.

**A candidate’s decision trail shows the decision and stage only.**
`OutcomeOut` also carries `decided_by` and a free-text `note` whose form
placeholder is literally "Why?". A candidate is entitled to know a decision was
made; they are not entitled to a recruiter’s internal note about them, and a
frontend that rendered every field it received would have published it by
accident.

**The recruiter layout awaits the health read.** In Next 16 a layout that reads
uncached data blocks navigation into every route beneath it and does not fall
back to a same-segment `loading.js`. The call is capped at 5 seconds and
degrades to `null`, so a slow API costs the mode chip rather than the dashboard.
