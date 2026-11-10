# Task 2 — n8n GitHub Repository Intelligence Digest

## APIs used and why

**First API — GitHub Search Repositories** (`GET /search/repositories`)  
Chosen because it is free, requires no authentication for public searches, returns structured star counts and language metadata, and directly maps to the "trending repos for a topic" suggestion in the assignment. The query sorts by stars descending so the most popular result is always first.

**Second API — GitHub Languages** (`GET /repos/{owner}/{repo}/languages`)  
Used to enrich the top-ranked repository with a byte-count breakdown of its programming languages. This is the same host as the first call, so no additional credential is needed. The node falls back gracefully to the original repository data if the secondary request fails.

**Output — Discord Webhook**  
Discord was chosen because a working webhook was immediately available. The same workflow logic works with any HTTP POST destination; only the `Send Discord digest` node would change.

## What the transformation does

The `Normalize top five` Code node:

1. Filters out items missing required fields (`full_name`, `owner.login`, `html_url`, `stargazers_count`).
2. Deduplicates by `full_name` to guard against duplicate results from the GitHub API.
3. Sorts the remaining valid items by `stargazers_count` descending.
4. Keeps the top five.

The `Combine enrichment` node converts the raw byte counts from the Languages API into percentage-rounded language shares, then merges them onto the top repository's data.

The `Format digest` node assembles a plain-text message within Discord's 2 000-character limit and neutralises `@` mention characters.

## How the error path behaves

Every node that can fail (GitHub search, normalisation, formatting, Discord delivery) is wired to `Report failure` on error. That node:

1. Logs the failed node name and error message.
2. Passes the data to `Respond failure`, which returns HTTP 502 with a JSON error body to the original webhook caller.
3. Passes the data to `Mark execution failed` (`stopAndError`), which marks the n8n execution as failed so it appears in red in the execution list.

Language enrichment is the only intentional exception: if the second GitHub call fails, `Combine enrichment` falls back to the original repository data and execution continues normally.

## Import and configure

1. Import `Task2_Workflow_Kumar_Kaushik.json` into n8n.
2. Open **Send Discord digest** → select a Discord Webhook credential. Do not place the webhook URL in this repository.
3. Use the test webhook URL to POST a request; activate the workflow only after the credential is configured.

```json
{ "topic": "automation", "threshold": 1000 }
```

`topic`: 1–50 lowercase letters, digits, or hyphens. `threshold`: 0–10 000 000.

## Workflow flow

`Digest webhook` → validate → GitHub search → normalize/top-five → result check → language enrichment → popularity branch → format → Discord → receipt → respond success  
Any error → `Report failure` → `Respond failure` → `Mark execution failed`

## Verified test evidence (10 November 2026, Cloud n8n kkos-14)

| Case | Input | Branch | Result |
|---|---|---|---|
| Priority | `automation`, threshold `1000` | Priority | ✅ Delivered to Discord, 5 repos, enrichment succeeded |
| Standard | `automation`, threshold `10000000` | Standard | ✅ Delivered to Discord, 5 repos, enrichment succeeded |
| Empty | nonexistent topic | No results | ✅ Delivered no-results notice, enrichment skipped |
| Validation failure | threshold `99999999` | Error | ✅ HTTP 502, execution marked failed |

Canvas screenshot is saved at `screenshots/Task2_Workflow_Canvas.png` (high-resolution capture from Cloud instance). `Task2_Successful_Execution.png` represents the execution details panel.

## Local code checks

```
node scripts/test-workflow-code.cjs
```

Covers: input validation, ranking, deduplication, empty response, malformed items, enrichment calculation, enrichment fallback, both digest formats, message size limit.
