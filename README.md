# Oytra Assignment — Kumar Kaushik

Submission for the Oytra Automation & QA Developer take-home assessment.

**GitHub:** https://github.com/kkaushik14/Oytra-Assignment  
**Walkthrough:** see [`WALKTHROUGH.md`](WALKTHROUGH.md) for full details of both tasks.

---

## Task 1 — QA Report (Conduit RealWorld Angular)

Target: https://demo.realworld.show

| # | Severity | Finding |
|---|---|---|
| QA-01 | Medium | Rapid repeated favorite clicks leave count and state incorrect until reload |
| QA-02 | Medium | Deleting an already-deleted article leaves a stale tab stuck without feedback |
| QA-03 | Medium | Missing article shows a blank content area instead of a not-found message |
| QA-04 | Low | Whitespace-only comments are accepted and persisted |
| QA-05 | Medium | Comment delete action cannot be reached by keyboard |

Root-cause analysis (QA-05): the trash icon is an `<i>` inside a `<span>` with `tabIndex -1` and no button role or accessible label. Tab skips it entirely. Fix: replace with a native `<button>` and an accessible label.

Deliverables: `task1-qa/Task1_QA_Report_Kumar_Kaushik.pdf` · `task1-qa/findings.json` · `task1-qa/evidence/` (20+ screenshots and JSON files).

---

## Task 2 — n8n GitHub Repository Intelligence Digest

Webhook-triggered 18-node workflow: GitHub search → enrich top repo (language breakdown) → branch by popularity threshold → Discord digest.

**APIs:** GitHub Search Repositories (primary), GitHub Languages (enrichment), Discord Webhook (output).  
**Transformation:** deduplicate, validate required fields, sort by stars, keep top 5.  
**Error handling:** any node failure routes to `Report failure → Respond failure (HTTP 502) → Mark execution failed`. Language enrichment falls back silently.

Four end-to-end test cases verified on 10 November 2026 (Cloud n8n kkos-14) with real Discord deliveries: priority, standard, empty-results, validation failure.

Deliverables: `task2-n8n/Task2_Workflow_Kumar_Kaushik.json` (importable, no secrets) · `task2-n8n/README.md` · `task2-n8n/screenshots/` · `task2-n8n/src/` (code-node source).

---

## Bonus Task


