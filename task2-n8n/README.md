# Oytra — GitHub Repository Intelligence Digest

An importable n8n workflow that receives a topic and a popularity threshold, searches GitHub repositories, ranks and enriches the top five, selects a priority, and sends a Discord digest. The design deliberately uses one verified notification destination rather than untested Slack/email placeholders.

## Import and configure

1. Import `Task2_Workflow_Kumar_Kaushik.json` into n8n.
2. Open **Send Discord digest** and select a Discord Webhook credential. Do not place its webhook URL in this repository.
3. Click **Execute workflow** for a test run, then POST JSON to the displayed n8n test URL. Publish/activate the workflow only after the notification credential is configured for production.

Example request body:

```json
{ "topic": "automation", "threshold": 1000 }
```

`topic` must be 1–50 lowercase letters, digits, or hyphens. `threshold` must be from 0 through 10,000,000.

## Workflow behaviour

`Digest webhook` → validate request → GitHub repository search → normalize/deduplicate/top five → result check → language enrichment → popularity branch → format digest → Discord → delivery receipt → webhook response.

- **Priority:** the leading repository has more stars than the supplied threshold.
- **Standard:** the leading repository does not exceed the supplied threshold.
- **No results:** sends a clear no-results notice and does not call the enrichment endpoint.
- **Resilience:** GitHub request, normalization, formatting, notification, and receipt errors route through `Report failure`, respond with an error, and stop the execution visibly. Language enrichment falls back to the original repository data if that secondary request fails.

The formatter limits the outbound content to Discord's 2,000-character maximum, neutralizes mention characters, and retains the queried topic, priority, top-five ranking, and available language breakdown.

## Verified test evidence

On 10 November 2026 in the configured Cloud n8n instance:

| Case | Input | Result |
| --- | --- | --- |
| Priority | `automation`, threshold `1000` | Delivered, high priority, 5 repositories, enrichment succeeded |
| Standard | `automation`, threshold `10000000` | Delivered, standard priority, 5 repositories, enrichment succeeded |
| Empty | controlled nonexistent topic | Delivered, empty priority, 0 repositories, enrichment not attempted |
| Validation failure | threshold above `10000000` | HTTP 502 via the visible failure route |

`screenshots/workflow-draft.png` documents the imported workflow canvas. Credential values and message IDs are intentionally excluded.

## Local checks

Run `node scripts/test-workflow-code.cjs` from the assignment root to exercise configuration, ranking/top-five behavior, empty and malformed results, deduplication, enrichment fallback, and message sizing for the Code-node logic.
