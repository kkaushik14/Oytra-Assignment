# Oytra Assignment — Automation & QA Developer

**GitHub Repository:** [https://github.com/kkaushik14/Oytra-Assignment](https://github.com/kkaushik14/Oytra-Assignment)  
**Detailed Walkthrough:** [`WALKTHROUGH.md`](WALKTHROUGH.md)

---

## 1. Task 1 — Web App QA & Debug Report

**Target Application:** Conduit RealWorld Angular Demo ([https://demo.realworld.show](https://demo.realworld.show))  
**Deliverable:** [`task1-qa/Task1_QA_Report_Kumar_Kaushik.pdf`](task1-qa/Task1_QA_Report_Kumar_Kaushik.pdf) (7-page PDF report complying with Section 5 Bug Report Template).

### Bug Report Table (Section 5 Template Compliance)

|          #          | Title / Summary                                               | Expected vs Actual                                                                                                                                         |  Severity  | Suspected Cause                                                                            |
| :-----------------: | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------: | ------------------------------------------------------------------------------------------ |
| **1**<br/>_(QA-01)_ | Rapid favorite clicks leave count/state desynced until reload | **Exp:** Ignore in-flight clicks or sync count.<br/>**Act:** Double-click left count at 0; reload showed 1.                                                | **Medium** | Missing debounce guard; CSS class used instead of native HTML disabled attribute.          |
| **2**<br/>_(QA-02)_ | Deleting already-deleted article leaves tab stuck with error  | **Exp:** Show not-found message & route to feed.<br/>**Act:** Tab stuck on deleted item; console error logged; no recovery.                                | **Medium** | Article deletion component only handles success; unhandled 404 leaves UI pending.          |
| **3**<br/>_(QA-03)_ | Missing article displays unexplained blank content area       | **Exp:** Render 404 message with "Return to feed".<br/>**Act:** Main area completely blank; API returned HTTP 404.                                         | **Medium** | Frontend router/component lacks error boundary or empty-state handler for 404.             |
| **4**<br/>_(QA-04)_ | Comment delete action unreachable via keyboard navigation     | **Exp:** `Tab` reaches Delete button; `Enter`/`Space` activates.<br/>**Act:** `Tab` skips trash icon; control is `<i>` inside `<span>` with `tabIndex -1`. | **Medium** | Interactive click handler bound to decorative `<i>` element rather than native `<button>`. |
| **5**<br/>_(QA-05)_ | Whitespace-only comments accepted and persisted               | **Exp:** Reject empty/whitespace input.<br/>**Act:** Empty comment card created; persists across reload.                                                   |  **Low**   | Missing string trimming / validation check on client form and server API.                  |

**Root-Cause Analysis (QA-04):** The trash icon is an non-focusable `<i>` element (`tabIndex -1`) lacking button semantics and accessible labelling. Tabbing skips deletion, though mouse clicks trigger the delete API successfully. Fix: replace with `<button type="button" aria-label="Delete comment">` with keyboard event listeners.

---

## 2. Task 2 — n8n API Integration Workflow

**Deliverable:** [`task2-n8n/Task2_Workflow_Kumar_Kaushik.json`](task2-n8n/Task2_Workflow_Kumar_Kaushik.json) (18-node importable workflow).

- **Trigger & Ingestion:** Webhook endpoint accepting `{ "topic": "string", "threshold": number }`.
- **APIs:** GitHub Search API (primary repository query sorted by stars) + GitHub Languages API (secondary enrichment on top repository) + Discord Webhook (notification destination).
- **Transformation:** Deduplicates, filters malformed items, sorts by stars, isolates top 5, converts byte breakdowns into language percentages, formats digest (≤ 2,000 chars, neutralises `@` mentions).
- **Error Routing:** Node errors route through `Report failure → Respond failure (HTTP 502) → Mark execution failed`. Language enrichment falls back gracefully.
- **Verification:** 4 verified end-to-end executions in n8n Cloud (`kkos-14`): Priority (high threshold), Standard, Empty results, and Validation failure (HTTP 502).

---

## 3. Bonus Task — Uptime & Response-Time Monitor

**Deliverable:** [`bonus-uptime/Bonus_UptimeMonitor_Kumar_Kaushik.json`](bonus-uptime/Bonus_UptimeMonitor_Kumar_Kaushik.json) (9-node workflow).

- **5-Minute Polling:** Schedule trigger pings `https://demo.realworld.show` every 5 minutes.
- **Resilience:** 3 automated retries with 2-second backoff on network failures.
- **Latency SLA Tracking:** Tracks millisecond latency and categorises performance (`EXCELLENT` < 1s, `ACCEPTABLE` < 3s, `SLOW` >= 3s).
- **Incident Alerting:** Formats and posts Discord alert if status code != 200 or timeout occurs.

---
