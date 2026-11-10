const data = $input.first().json;
const clean = (s) =>
  String(s || '')
    .replace(/@/g, '＠')
    .slice(0, 150);

const lines = [
  '🚨 **OYTRA UPTIME ALERT — SERVICE DOWN / UNRESPONSIVE**',
  '',
  '• **Target Application:** ' + clean(data.target),
  '• **Status Code:** ' + data.statusCode + ' (Expected: 200 OK)',
  '• **Response Latency:** ' + data.durationMs + ' ms',
  '• **Health Category:** ' + data.statusCategory,
  '• **Retries Attempted:** ' + data.retriesConfigured + ' tries with 2s backoff',
  '• **Incident Timestamp:** ' + data.checkedAt,
  data.errorDetail ? '• **Error Detail:** ' + clean(data.errorDetail) : '',
  '',
  '⚠️ **Action:** Verify cloud bucket, DNS routing, or web server container status.',
].filter(Boolean);

return [
  {
    json: {
      ...data,
      content: lines.join('\n'),
      alertType: 'INCIDENT',
    },
  },
];
