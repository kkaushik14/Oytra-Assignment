# Walkthrough — Oytra Assignment

**Author:** Kumar Kaushik  
**Date:** 10 November 2026

---

## Task 1 — QA Report walkthrough

### What was tested

Target: **Conduit RealWorld Angular** at `https://demo.realworld.show` — a production-grade live demo with a session-isolated backend.

### How testing was structured

1. Started from the home feed with no account.
2. Registered two disposable controlled accounts (`@example.com`).
3. Exercised the full article lifecycle: create, edit, delete, Unicode/Markdown, field validation.
4. Tested authentication flows: valid login, wrong password, logout, refresh persistence.
5. Tested route protection: `/settings` and `/editor` both redirect logged-out visitors.
6. Investigated UX and accessibility: keyboard navigation, ARIA markup, button labelling.
7. Investigated API behaviour: HTTP status codes, error payloads, console output.
8. Ran a targeted two-account authorization check (excluded from findings — demo session context became inconsistent; not overstated as a security defect).

### The five findings

**QA-01 (Medium) — Rapid repeated favorite clicks leave count and state incorrect until reload**  
Double-clicking a favorite button accepted both clicks. The feed showed the pre-click state (0, unfavorited outline) until a reload, which revealed the persisted state (1, filled). Reproduced twice with a reset between attempts.

**QA-02 (Medium) — Deleting an already-deleted article leaves a stale tab stuck without feedback**  
Article open in two tabs. Deleted in Tab B. Tab A's delete controls gained a disabled CSS class with no message, no recovery path, and a browser console error. The native `disabled` property remained `false`. Reproduced with a second article.

**QA-03 (Medium) — Missing article shows a blank content area instead of a not-found message**  
Direct navigation to a known-missing article slug rendered only the site chrome. The API correctly returned HTTP 404 with `errors.article = [not found]`. The frontend did not map this to any visible state.

**QA-04 (Low) — Whitespace-only comments are accepted and persisted**  
Three spaces submitted as a comment produced a visually empty card with author metadata. Persisted through a browser reload. No server-side or client-side whitespace validation.

**QA-05 (Medium) — Comment delete action cannot be reached by keyboard**  
The trash icon is an `<i>` inside a `<span>` with `tabIndex -1`, no `role`, and no accessible label. Tab skips it entirely; focus moves from the comment-author link directly to the footer. Mouse click deleted the comment successfully, confirming the deletion handler works — only the keyboard path is broken.

---

## Task 2 — n8n workflow walkthrough

### Workflow overview

An 18-node n8n webhook workflow that:

1. Receives a topic and popularity threshold via HTTP POST.
2. Validates inputs (topic: 1–50 lowercase slug chars; threshold: 0–10,000,000).
3. Searches GitHub for repositories matching the topic, sorted by stars.
4. Normalises results: deduplicates, validates required fields, picks the top five by star count.
5. If there are results, fetches the language breakdown for the top repository from the GitHub Languages API.
6. Combines enrichment data (falls back gracefully if the secondary request fails).
7. Branches by priority: does the top repository beat the threshold?
8. Formats a Discord message (≤ 2,000 characters; mention characters neutralised).
9. Delivers to Discord, records a delivery receipt, responds to the webhook caller.
10. Any error in steps 2–9 routes through `Report failure → Respond failure → Mark execution failed`.

### Live test results (10 November 2026, kkos-14 Cloud)

| Case | POST body | Branch taken | Discord | Webhook response |
|---|---|---|---|---|
| Priority | `{"topic":"automation","threshold":1000}` | Priority | ✅ Delivered with PRIORITY label | `{"status":"delivered","priority":"high"}` |
| Standard | `{"topic":"automation","threshold":10000000}` | Standard | ✅ Delivered with STANDARD label | `{"status":"delivered","priority":"standard"}` |
| Empty | controlled nonexistent topic | No results | ✅ Delivered with no-results notice | `{"status":"delivered","priority":"empty"}` |
| Validation failure | `{"topic":"automation","threshold":99999999}` | Error route | — | HTTP 502 from `Respond failure` |

### Error routes implemented

| Failure scenario | Triggering condition | Route |
|---|---|---|
| Invalid input | topic or threshold fails validation in `Configure request` | `Report failure → Respond failure → Mark execution failed` |
| GitHub API failure | `Search GitHub` HTTP node throws or returns non-2xx | `Report failure → Respond failure → Mark execution failed` |
| Normalisation error | All items malformed or items array missing | `Report failure → Respond failure → Mark execution failed` |
| Formatting error | Digest exceeds 2,000 characters | `Report failure → Respond failure → Mark execution failed` |
| Discord delivery failure | `Send Discord digest` throws | `Report failure → Respond failure → Mark execution failed` |
| Language enrichment failure | `Get language breakdown` fails | Fallback: `Combine enrichment` uses original repo data; execution continues |

### Code-node local test coverage

```
node scripts/test-workflow-code.cjs
```

Covers: configuration validation (valid, invalid topic, negative threshold), ranking and top-five selection, empty GitHub response, malformed items, deduplication, enrichment calculation, enrichment fallback, both priority and standard digest formats, message size limit.

**Result:** `PASS` — all assertions green.

### How to import and run

1. Import `task2-n8n/Task2_Workflow_Kumar_Kaushik.json` into any n8n instance.
2. Open **Send Discord digest** → select a Discord Webhook credential.
3. Activate or use the test webhook URL.
4. POST `{"topic":"automation","threshold":1000}` to the webhook URL.

---

## Screenshots

| File | Contents |
|---|---|
| `task2-n8n/screenshots/Task2_Workflow_Canvas.png` | Full 18-node workflow canvas |
| `task2-n8n/screenshots/Task2_Successful_Execution.png` | Successful execution panel (priority case) |
| `task2-n8n/screenshots/workflow-draft.png` | Earlier canvas captured during development |
| `task1-qa/evidence/` | Per-finding screenshots and JSON for all five QA findings |
