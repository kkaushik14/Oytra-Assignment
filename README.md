# Oytra Assignment — Kumar Kaushik

Submission for the Oytra take-home assignment. Two independent tasks delivered
under a 120-minute budget.

---

## Task 1 — QA Report

**Target application:** [Conduit RealWorld Angular demo](https://demo.realworld.show)

Five approved findings with reproduction steps, expected/actual behaviour,
root-cause analysis, and screenshot evidence.

| ID | Severity | Title |
|---|---|---|
| QA-01 | Medium | Rapid repeated favorite clicks leave count and state incorrect until reload |
| QA-02 | Medium | Deleting an already-deleted article leaves a stale tab stuck without feedback |
| QA-03 | Medium | Missing article shows a blank content area instead of a not-found message |
| QA-04 | Low | Whitespace-only comments are accepted and persisted |
| QA-05 | Medium | Comment delete action cannot be reached by keyboard |

**Deliverables**

| File | Description |
|---|---|
| `task1-qa/Task1_QA_Report_Kumar_Kaushik.pdf` | Final seven-page QA report |
| `task1-qa/findings.json` | Machine-readable findings, root-cause analysis, limitations |
| `task1-qa/test-matrix.md` | Test matrix |
| `task1-qa/evidence/` | Screenshots and JSON evidence for every finding |

---

## Task 2 — n8n GitHub Repository Intelligence Digest

An n8n workflow that accepts a topic and a popularity threshold via webhook,
searches GitHub, ranks and enriches the top five repositories, and delivers a
labelled digest to Discord.

**Workflow:** 18 nodes — webhook → validate → GitHub search → normalise/top-five
→ language enrichment → priority branch → format → Discord → receipt → response.
Errors route through a visible failure path.

**Verified test cases (10 November 2026, Cloud n8n instance kkos-14)**

| Case | Input | Result |
|---|---|---|
| Priority | `automation`, threshold `1000` | Delivered — high priority, 5 repos, enriched |
| Standard | `automation`, threshold `10000000` | Delivered — standard priority, 5 repos, enriched |
| Empty | Controlled nonexistent topic | Delivered — no-results notice, enrichment skipped |
| Validation failure | threshold above 10 000 000 | HTTP 502 via designed failure route |

**Deliverables**

| File | Description |
|---|---|
| `task2-n8n/Task2_Workflow_Kumar_Kaushik.json` | Importable n8n workflow — no credentials or secrets |
| `task2-n8n/README.md` | Import and configure instructions |
| `task2-n8n/screenshots/` | Workflow canvas and successful execution screenshots |
| `task2-n8n/src/` | Code-node source files (configure, normalize, enrich, format) |

**Local code checks**

```
node scripts/test-workflow-code.cjs
```

Exercises configuration validation, ranking, deduplication, empty-result
handling, enrichment fallback, and Discord message sizing without requiring a
running n8n instance.

---

## Repository layout

```
README.md                          ← this file
task1-qa/
  Task1_QA_Report_Kumar_Kaushik.pdf
  findings.json
  test-matrix.md
  candidate-findings.md
  evidence/                        ← 20+ screenshot and JSON files
task2-n8n/
  Task2_Workflow_Kumar_Kaushik.json
  README.md
  workflow-draft.json              ← historical build output only
  src/
    configure.js
    normalize.js
    enrich.js
    format.js
  screenshots/
    Task2_Workflow_Canvas.png
    Task2_Successful_Execution.png
docs/
  execution-notes.md               ← decision log and verification record
scripts/
  test-workflow-code.cjs
  build-qa-report.py
  build-workflow.cjs
  check-auth-context.cjs
  test-authorization.cjs
  start-n8n.sh
```

---

## Limitations and scope notes

- Testing was time-boxed to 120 minutes against the live demo; this is not a
  comprehensive security audit.
- The two-account authorization investigation produced inconsistent results
  after the demo session changed and is deliberately excluded rather than
  presented as a security finding.
- The workflow JSON contains no credential configuration. A Discord Webhook
  credential must be selected after import before activating in production.
- The old `demo.realworld.io` URL returns HTTP 404 (outdated assignment
  reference) and is not counted as an application defect.
