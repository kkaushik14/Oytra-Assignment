# Walkthrough — Oytra Assignment

**Candidate:** Kumar Kaushik  
**Target Date:** 10 November 2026 (IST)  
**Submission Repository:** [https://github.com/kkaushik14/Oytra-Assignment](https://github.com/kkaushik14/Oytra-Assignment)

---

## 1. Task 1 — Web App QA & Debug Report Walkthrough

### Application Context & Methodology

- **Target Application:** Conduit RealWorld Angular live demo ([https://demo.realworld.show](https://demo.realworld.show)).
- **Testing Approach:** Exercised core end-to-end user flows including account registration, authentication, article creation, editing, deletion, tag filtering, comment threads, keyboard navigation (WCAG 2.2 accessibility), and network response handling.
- **Controlled Test Data:** Used disposable `@example.com` accounts to verify cross-user isolation and avoid impacting persistent demo data.

### Bug Report Table (Assessment Section 5 Template Compliance)

|          #          | Title / Summary                                                                    | Steps to Reproduce                                                                                                                                                                                                                          | Expected vs Actual                                                                                                                                                                                                                                                                                                   |  Severity  | Suspected Cause                                                                                                                  |
| :-----------------: | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------: | -------------------------------------------------------------------------------------------------------------------------------- |
| **1**<br/>_(QA-01)_ | Rapid repeated favorite clicks leave visible count and state desynced until reload | 1. Sign in with controlled account.<br/>2. On Global Feed, confirm article favorite count is 0.<br/>3. Double-click favorite button.<br/>4. Observe immediate UI state.<br/>5. Reload feed page.<br/>6. Reset with single click and repeat. | **Expected:** Interface ignores duplicate clicks while request is in flight or reconciles count/state immediately.<br/><br/>**Actual:** After double-click, feed showed 0 and unfavorited outline style; reload showed 1 and favorited style.                                                                        | **Medium** | Missing click debounce/guard while request is pending; CSS disabled class applied instead of native HTML disabled attribute.     |
| **2**<br/>_(QA-02)_ | Deleting already-deleted article leaves stale tab stuck without feedback           | 1. Open identical article in two browser tabs.<br/>2. Delete article in Tab B; confirm redirection to feed.<br/>3. In Tab A (without refreshing), click Delete Article.<br/>4. Observe state and console.                                   | **Expected:** Stale tab shows clear not-found error and routes user back to feed.<br/><br/>**Actual:** Tab remains stranded on deleted content; delete button gains disabled class; browser logs uncaught error with no user recovery route.                                                                         | **Medium** | Article deletion component only implements success handler; unhandled 404/rejection leaves component in permanent pending state. |
| **3**<br/>_(QA-03)_ | Missing article leaves an unexplained blank content area                           | 1. Navigate directly to `/article/oytra-qa-nonexistent-20261110`.<br/>2. Wait for network request to settle.<br/>3. Observe main content area.<br/>4. Repeat while logged in and logged out.                                                | **Expected:** Display clear 404 / article not found error with a "Return to feed" button.<br/><br/>**Actual:** Content area is completely blank (only site header and footer render); API returned HTTP 404 with `errors.article=[not found]`.                                                                       | **Medium** | Frontend router/component does not map 404 API error response to an error boundary or empty state template.                      |
| **4**<br/>_(QA-05)_ | Comment delete action cannot be reached by keyboard                                | 1. Open article containing signed-in user's comment.<br/>2. Focus comment-author link with keyboard.<br/>3. Press `Tab` key.<br/>4. Inspect delete icon element and accessibility tree.<br/>5. Compare with mouse click.                    | **Expected:** `Tab` key focuses a native Delete button with accessible label; `Enter` or `Space` activates deletion.<br/><br/>**Actual:** `Tab` key skips trash icon completely, jumping directly to footer link. Trash icon is an `<i>` tag inside a `<span>` with `tabIndex -1`. Mouse click deleted successfully. | **Medium** | Non-focusable decorative `<i>` element used as interactive click target instead of accessible `<button>` element.                |
| **5**<br/>_(QA-04)_ | Whitespace-only comments are accepted and persisted                                | 1. Sign in and open owned article.<br/>2. Enter three spaces in "Write a comment".<br/>3. Click Post Comment.<br/>4. Reload the article page.                                                                                               | **Expected:** Comment submission is blocked; validation requires non-whitespace content.<br/><br/>**Actual:** Visually empty comment card is created with author and timestamp; persists across browser reload.                                                                                                      |  **Low**   | Missing string trimming / sanitization check on both client comment form and server API validation.                              |

### In-Depth Root-Cause Analysis (QA-05)

QA-05 prevents keyboard-only users from deleting comments they authored. The problem occurs when a comment owned by the signed-in user displays its trash icon. In the live DOM, that interactive control is rendered as an `<i>` element nested in a `<span>`, assigned `tabIndex = -1` with no button role or accessible ARIA label. Pressing the `Tab` key from the comment-author link skips the control entirely and moves focus directly to the footer navigation link. However, clicking the same trash icon with the mouse executes the deletion handler and successfully deletes the comment, proving the underlying delete endpoint and state logic work as intended. The root cause is confirmed at the rendered markup layer: the interactive element lacks native keyboard focusability and button semantics. To resolve this, replace the `<span><i>` wrapper with a standard `<button type="button">` element possessing an `aria-label="Delete comment"` attribute while maintaining the existing click handler. Verification entails tabbing directly to the delete button, activating it via both `Enter` and `Space` keys, confirming the screen reader announcement, and verifying that only the selected comment is removed.

---

## 2. Task 2 — n8n API Integration Workflow Walkthrough

### Workflow Architecture & Node Pipeline

The workflow [`task2-n8n/Task2_Workflow_Kumar_Kaushik.json`](task2-n8n/Task2_Workflow_Kumar_Kaushik.json) contains 18 nodes:

1. **Digest webhook:** Receives JSON payload with `topic` (string) and `threshold` (integer).
2. **Configure request:** Validates input structure (1–50 lowercase characters for topic, 0–10M range for threshold).
3. **Search GitHub:** Calls GitHub REST API (`GET /search/repositories?q=topic:<topic>&sort=stars&order=desc&per_page=10`). Configured with 2 retries on network failure.
4. **Normalize top five:** Validates item structures, removes duplicates by `full_name`, sorts by star count, slices top 5.
5. **Any results? (IF):** Checks if valid matching repositories were found.
   - _If no results:_ Routes to `No results notice` (sets priority to `empty`) and skips enrichment.
   - _If results exist:_ Proceeds to enrichment.
6. **Get language breakdown:** Secondary API call (`GET /repos/{owner}/{name}/languages`) to retrieve byte breakdown of top repository.
7. **Combine enrichment:** Computes percentage share per language (rounded to 0.1%). If secondary API fails, falls back gracefully to base repository data.
8. **Popularity threshold (IF):** Compares top repository star count against user-supplied `threshold`.
   - _Above threshold:_ Routes to `Priority digest` (`priority: high`).
   - _At or below:_ Routes to `Standard digest` (`priority: standard`).
9. **Format digest:** Assembles Discord message format (≤ 2,000 characters, `@` characters neutralised to prevent accidental pings).
10. **Send Discord digest:** Delivers payload via Discord Webhook credential.
11. **Delivery receipt & Respond success:** Confirms message delivery ID and returns HTTP 200 JSON to webhook caller.
12. **Error Branching:** If any core step fails, execution routes to `Report failure → Respond failure (HTTP 502) → Mark execution failed`.

### Verified Execution Results (10 November 2026, Cloud n8n `kkos-14`)

| Test Scenario          | Payload                                       | Branch Taken      | Discord Result                                                                    | HTTP Response                                  |
| ---------------------- | --------------------------------------------- | ----------------- | --------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Priority Case**      | `{"topic":"automation","threshold":1000}`     | Priority Branch   | ✅ Delivered: `PRIORITY — GitHub Repository Digest` (5 repos, languages enriched) | `{"status":"delivered","priority":"high"}`     |
| **Standard Case**      | `{"topic":"automation","threshold":10000000}` | Standard Branch   | ✅ Delivered: `STANDARD — GitHub Repository Digest` (5 repos, languages enriched) | `{"status":"delivered","priority":"standard"}` |
| **Empty Results**      | Controlled nonexistent topic                  | No Results Branch | ✅ Delivered: `GitHub Repository Digest — No results` (enrichment skipped)        | `{"status":"delivered","priority":"empty"}`    |
| **Validation Failure** | `{"topic":"automation","threshold":99999999}` | Error Route       | — (No notification sent)                                                          | HTTP 502 via `Respond failure`                 |

### Code-Node Automated Test Suite

All data transformation nodes are covered by automated unit tests in `scripts/test-workflow-code.cjs`:

```bash
node scripts/test-workflow-code.cjs
```

Checks: input sanitization, negative thresholds, empty items array, malformed schema rejection, duplicate filtering, enrichment percentage math, enrichment fallback, Discord message length boundaries (< 2,000 chars).

---

## 3. Bonus Task — Uptime & Response-Time Monitor Walkthrough

The bonus workflow [`bonus-uptime/Bonus_UptimeMonitor_Kumar_Kaushik.json`](bonus-uptime/Bonus_UptimeMonitor_Kumar_Kaushik.json) monitors the Task 1 target web application:

1. **Schedule Trigger:** Triggers every 5 minutes.
2. **Ping Web App:** Sends HTTP GET request with 3 retry attempts and 2-second backoff.
3. **Response-Time Measurement:** Measures exact millisecond latency between request initiation and completion.
4. **Health Evaluation:** Classifies performance (`EXCELLENT` < 1s, `ACCEPTABLE` < 3s, `SLOW` >= 3s, or `DOWN`).
5. **Conditional Branching:** If HTTP status != 200 or connection times out, constructs an incident alert and posts to Discord.

---

## 4. Screenshots Index

| File                                                   | Content                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------ |
| `task2-n8n/screenshots/Task2_Workflow_Canvas.png`      | Full 18-node workflow canvas on n8n Cloud                    |
| `task2-n8n/screenshots/workflow-draft.jpeg`            | Original high-resolution Cloud canvas capture                |
| `task2-n8n/screenshots/Task2_Successful_Execution.png` | ⏳ Execution details panel showing real output               |
| `task1-qa/evidence/`                                   | 20+ individual screenshot and JSON artifacts for QA findings |
