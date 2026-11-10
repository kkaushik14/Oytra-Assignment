# Oytra Assignment — Automation & QA Developer

**Candidate:** Kumar Kaushik  
**GitHub Repository:** [https://github.com/kkaushik14/Oytra-Assignment](https://github.com/kkaushik14/Oytra-Assignment)  
**Detailed Walkthrough:** [`WALKTHROUGH.md`](WALKTHROUGH.md)

---

## 1. Task 1 — Web App QA & Debug Report

**Target Application:** Conduit RealWorld Angular Demo ([https://demo.realworld.show](https://demo.realworld.show))  
**Deliverable:** [`task1-qa/Task1_QA_Report_Kumar_Kaushik.pdf`](task1-qa/Task1_QA_Report_Kumar_Kaushik.pdf) (7-page PDF report complying with Section 5 Bug Report Template).

### Bug Report Table (Section 5 Template Compliance)

| # | Title / Summary | Expected vs Actual | Severity | Suspected Cause |
|:---:|---|---|:---:|---|
| **1**<br/>*(QA-01)* | Rapid favorite clicks leave count/state desynced until reload | **Exp:** Ignore in-flight clicks or sync count.<br/>**Act:** Double-click left count at 0; reload showed 1. | **Medium** | Missing debounce guard; CSS class used instead of native HTML disabled attribute. |
| **2**<br/>*(QA-02)* | Deleting already-deleted article leaves tab stuck with error | **Exp:** Show not-found message & route to feed.<br/>**Act:** Tab stuck on deleted item; console error logged; no recovery. | **Medium** | Article deletion component only handles success; unhandled 404 leaves UI pending. |
| **3**<br/>*(QA-03)* | Missing article displays unexplained blank content area | **Exp:** Render 404 message with "Return to feed".<br/>**Act:** Main area completely blank; API returned HTTP 404. | **Medium** | Frontend router/component lacks error boundary or empty-state handler for 404. |
| **4**<br/>*(QA-04)* | Whitespace-only comments accepted and persisted | **Exp:** Reject empty/whitespace input.<br/>**Act:** Empty comment card created; persists across reload. | **Low** | Missing string trimming / validation check on client form and server API. |
| **5**<br/>*(QA-05)* | Comment delete action unreachable via keyboard navigation | **Exp:** `Tab` reaches Delete button; `Enter`/`Space` activates.<br/>**Act:** `Tab` skips trash icon; control is `<i>` inside `<span>` with `tabIndex -1`. | **Medium** | Interactive click handler bound to decorative `<i>` element rather than native `<button>`. |

**Root-Cause Analysis (QA-05):** The trash icon is an non-focusable `<i>` element (`tabIndex -1`) lacking button semantics and accessible labelling. Tabbing skips deletion, though mouse clicks trigger the delete API successfully. Fix: replace with `<button type="button" aria-label="Delete comment">` with keyboard event listeners.

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

## 4. Repository Structure

```
.
├── README.md                      ← Submission overview (< 1 page)
├── WALKTHROUGH.md                 ← In-depth execution & architecture guide
├── task1-qa/                      ← Task 1: Web App QA & Debug Report
│   ├── Task1_QA_Report_Kumar_Kaushik.pdf  ← 7-page PDF report (Section 5 template)
│   ├── test-matrix.md             ← Full execution matrix & bug table
│   ├── findings.json              ← Machine-readable defect catalog
│   └── evidence/                  ← 20+ screenshot and JSON evidence files
├── task2-n8n/                     ← Task 2: GitHub Intelligence Digest
│   ├── Task2_Workflow_Kumar_Kaushik.json  ← 18-node importable workflow
│   ├── README.md                  ← Node architecture, APIs, transformations
│   ├── src/                       ← Modular code-node logic (configure, normalize, enrich, format)
│   └── screenshots/               ← Canvas and execution screenshots
├── bonus-uptime/                  ← Bonus Task: Uptime & Latency Monitor
│   ├── Bonus_UptimeMonitor_Kumar_Kaushik.json  ← 9-node uptime workflow
│   └── README.md                  ← Uptime architecture & alerting logic
└── scripts/                       ← Build & verification automation
    ├── test-workflow-code.cjs     ← Unit tests for workflow code logic
    ├── build-qa-report.py         ← Automated ReportLab PDF generator
    ├── build-workflow.cjs         ← Task 2 workflow JSON compiler
    └── build-bonus-workflow.cjs   ← Bonus workflow JSON compiler
```
