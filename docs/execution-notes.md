# Execution notes

Status: QA investigation in progress; n8n installed; no QA findings finalized.

Budget started: 2026-11-10 03:40:48 IST (2026-11-09 22:10:48 UTC).
Budget: 120 minutes. Target finish: 05:40:48 IST.

## Verified environment

- Workspace initially empty; no Git repository or existing project instructions found.
- Node.js, npm, npx, Git and Python 3 available.
- No n8n, Docker or GitHub CLI executable detected on PATH.
- No server responded on localhost port 5678.
- RealWorld demo at https://demo.realworld.show opens in the browser and loads four seeded articles and popular tags.
- Disposable account A registration, incorrect-password rejection, correct login, logout and refresh persistence verified. Controlled article creation/edit/refresh and Unicode/Markdown verified.
- Repository reference redirects to https://github.com/realworld-apps/realworld, which links the newer demo.
- Shell network lookup initially failed within the sandbox; this is an environment limitation, not an application defect.

## Decision log

| Decision | Options | Selected approach | Reason | Approval |
|---|---|---|---|---|
| Testing target | Live RealWorld / local implementation | Continue checking live RealWorld | Demo loads; avoid setup overhead | Within supplied starting approach |
| n8n environment | Existing instance / isolated local installation | Isolated local n8n 2.46.7 in .runtime/n8n | User approved; installed Node 24.21.0 satisfies package metadata | User approved |
| Notification | Discord / Slack / email | Proposed first delivery to Discord test channel | User says all three are available; one working destination meets mandatory scope | Specific channel pending |
| QA test data | Existing accounts / synthetic accounts | Two synthetic @example.com accounts and clearly labelled disposable content | Controlled ownership tests | User explicitly approved creation/edit/deletion |
| API and trigger | GitHub / other; webhook / schedule | Proposed GitHub + webhook | Repeatable demonstration with public data | To confirm at design stage |
| Publication | Local artifacts / public GitHub | Local preparation only | Final review required | Publication pending |
| Bonus | Attempt / skip | Deferred | Mandatory deliverables first | Pending budget review |

## Evidence rules

Record observed behavior separately from hypotheses. Use controlled test accounts and content. Do not count inaccessible reference URLs as application bugs. Never include credentials, tokens, cookies, or sensitive execution data in deliverables.

## Resume checkpoint - 04:05 IST

- User approved switching to n8n Cloud instance kkos-14; local n8n remains installed and was started, but owner setup was not completed.
- Cloud workflow imported and saved: https://kkos-14.app.n8n.cloud/workflow/shDtAdnyuA4B9kae
- 18 nodes; local Code-node logic checks passed. No full n8n execution or Discord delivery has been verified.
- User approved Discord-first and test messages. Although user reported saving the credential, reloaded node still has no credential selected. Open Cloud credential dialog has blank webhook field and disabled Save. Asked user to complete this exact dialog.
- QA findings.json contains all five proposals and an eight-sentence root-cause analysis. PDF generated, seven pages rendered successfully after setting local FONTCONFIG_FILE; contact sheet visually checked. User approval pending.
- Screenshots are full-page originals in task1-qa/evidence. Draft Cloud screenshot is task2-n8n/screenshots/workflow-draft.png; it is not successful-execution evidence.
- Remaining: attach Discord credential; execute webhook and both branches; test failure paths; export using n8n; final QA approval; README and walkthrough; GitHub publication approval.

## Workflow validation — 10 November 2026

- Cloud Discord credential is attached to the `Send Discord digest` node; its webhook secret was neither read nor recorded.
- An end-to-end priority request (`topic=automation`, `threshold=1000`) returned `delivered`, selected the high-priority branch, enriched five repositories, and delivered a labelled Discord message.
- An end-to-end standard request (`topic=automation`, `threshold=10000000`) returned `delivered`, selected the standard branch, enriched five repositories, and delivered a labelled Discord message.
- An end-to-end empty-result request with a controlled nonexistent topic returned `delivered`, selected the no-results branch, skipped enrichment, and delivered a labelled Discord notice.
- An intentionally invalid threshold above the configured 10,000,000 maximum produced the designed error route: HTTP 502, `Report failure`, `Respond failure`, and `Mark execution failed`. This is validation coverage, not a workflow defect.
- Test-only executions do not count toward the Cloud trial quota. Discord message IDs are available in the execution response but intentionally omitted from this file.

## User review decision

User requested revision rather than approval of the five findings, while retaining keyboard-inaccessible comment deletion and its root-cause topic. Do not finalize the current report. Asked whether revision should prioritize stronger functional bugs, evidence/wording/severity, or full revalidation. User needs time for Discord credential setup; leave Chrome dialog untouched.

User selected stronger functional bugs to replace weaker findings. Retain QA-05 keyboard deletion root cause. Functional re-investigation started with clearing all article tags and checking persistence.

Functional revision: clearing all article tags passed, including refresh. Controlled article deleted successfully in second browser tab. Stale first tab deletion produced stuck disabled-class controls, no explanation and console error; recorded C06 as observed once, repeat pending. Original QA article now deleted.

## QA finalization — 10 November 2026

- User approved the revised finding set: favorite UI state mismatch after rapid clicks, stale-tab deletion recovery failure, blank missing-article state, persisted whitespace comment, and keyboard-inaccessible comment deletion.
- The stale-tab deletion behavior was repeated with a second clearly labelled disposable article before promotion into the final five.
- A targeted two-account authorization investigation was run only with disposable accounts and content. Its intermediate ownership context was inconsistent after the demo session changed, so it is excluded rather than presented as an unsupported High/Critical security finding. A direct account-A token and ownership sanity check passed, including cleanup.
- The revised seven-page QA PDF was built with a temporary Python 3.11 ReportLab environment, rendered to PNG, and visually inspected. No layout, clipping, evidence-image, or pagination defects were observed.

## Workflow handoff — 10 November 2026

- Generated `task2-n8n/Task2_Workflow_Kumar_Kaushik.json` from the tested 18-node implementation. It contains 16 connection groups and intentionally contains no credential configuration or secrets.
- The task-level README now points to this importable artifact. The original draft JSON remains as a historical build output only.
