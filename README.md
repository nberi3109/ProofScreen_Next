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

| Route | API | What it is |
| --- | --- | --- |
| `/recruiter` | `/recruiter/candidates`, `/recruiter/validation`, `/health` | Counts of rows, top of the ranking, the M4 headline, and the fixture/dry-run banner |
| `/recruiter/candidates` | `GET /recruiter/candidates?role_id=` | The ranked list, with the role lens in the URL so a ranking is a shareable link |
| `/recruiter/candidates/[id]` | `GET /recruiter/candidates/{id}`, `/outcomes`, `POST /outcome` | The evidence graph, and where a decision is recorded |
| `/recruiter/roles` | `GET/POST /recruiter/roles`, `GET /recruiter/taxonomy` | Role lenses — create one and every candidate re-ranks, with nobody re-interviewed |
| `/recruiter/validation` | `GET /recruiter/validation?minimum_n=` | Evidence vs resume screening, correlated against recorded decisions |
| `/recruiter/simulator` | `POST /dev/simulate` | Whole pipeline in one call. Gated. |
| `/candidate/start` | `POST /candidates`, `POST /candidates/text` | Resume in, claims and a WhatsApp opt-in code out |
| `/candidate/proof` | `GET /sessions/{id}` | The candidate's own view, driven by `?session_id=` |
| `/candidate/proof/interview` | `POST /dev/sessions/{id}/start`, `/answer` | Step-by-step simulator. Gated. |

The evidence graph page is laid out in the order the score has to be defended:
three scores rather than one (resume-only, weighted evidence, competence, so
the gaps are visible) → role coverage kept separate from score, because
"evidenced badly" and "never claimed it" are different facts → routing
confidence surfaced, because a resume that nearly matched another job family
was scored against the wrong claim types → every dimension with the counts it
came from and the verbatim quotes those counts point at → the transcript, one
click away from any claim.

### What is still mock

The API has no endpoints for job postings, applications, saved jobs, talent
pools or saved searches, so those screens still read from `data/` and `lib/data.ts`.
They are untouched.

The candidate filter sidebar was rebuilt rather than kept: its old controls
(notice period, salary band, availability date) filtered on fields ProofScreen
stores nothing for. Every control there now maps to a field the API actually
returns, and the result count is the length of the list the API returned rather
than a decorative multiple of it.

---

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
in the same PR.

**The recruiter layout awaits the health read.** In Next 16 a layout that reads
uncached data blocks navigation into every route beneath it and does not fall
back to a same-segment `loading.js`. The call is capped at 5 seconds and
degrades to `null`, so a slow API costs the mode chip rather than the dashboard.
