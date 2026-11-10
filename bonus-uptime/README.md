# Bonus Task — Web Application Uptime & Response-Time Monitor

An automated n8n workflow that monitors the availability, response time, and HTTP status of the target web application ([Conduit RealWorld demo](https://demo.realworld.show)) evaluated in Task 1.

## Architecture & Features

```
[Schedule Trigger (every 5m)]
       │
[Initialize Ping (Start timer)]
       │
[Ping Web App (GET with 3 retries, 2s backoff)]
       │
[Evaluate Health & Latency (Duration, Status code, SLA tier)]
       │
       ▼
 [App Healthy?] (Status == 200?)
 ├── False (Incident) ──► [Format Incident Alert] ──► [Send Discord Alert] ──► [Log Incident Receipt]
 └── True (Healthy)   ──► [Format Heartbeat Pulse]
```

### Key Capabilities

1. **Automated Polling:** Scheduled interval trigger running every 5 minutes.
2. **Built-in Resilience & Retry:** Configured with 3 retry attempts with a 2-second backoff interval on HTTP network hiccups.
3. **Response-Time & Latency Tracking:** Measures exact request-to-response duration in milliseconds (`durationMs`), benchmarking against performance SLA tiers (`EXCELLENT` < 1000ms, `ACCEPTABLE` < 3000ms, `SLOW` >= 3000ms).
4. **Conditional Alerting:** Evaluates HTTP status code. If anything other than 200 OK is returned or if a connection timeout occurs, an incident payload is constructed.
5. **Discord Notification Integration:** Posts incident alerts to the same Discord channel used in Task 2, complete with target URL, response latency, retry count, and incident timestamp.
6. **Zero Secrets in Repository:** Uses n8n credential references for the Discord webhook; no private tokens are stored in the workflow JSON.

## Deliverable

- `Bonus_UptimeMonitor_Kumar_Kaushik.json`: Ready-to-import n8n workflow file.
