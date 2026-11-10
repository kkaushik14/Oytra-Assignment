const init = $('Initialize Ping').first().json;
const httpRes = $input.first().json;
const durationMs = Date.now() - init.startTime;

const statusCode = httpRes.statusCode || (httpRes.error ? httpRes.error.status || 500 : 200);
const isSuccess = statusCode >= 200 && statusCode < 300 && !httpRes.error;
const isDegraded = isSuccess && durationMs > 3000;
const statusCategory = !isSuccess ? 'DOWN' : isDegraded ? 'DEGRADED' : 'HEALTHY';

return [
  {
    json: {
      target: init.targetUrl,
      timestamp: init.timestamp,
      checkedAt: new Date().toISOString(),
      durationMs,
      statusCode,
      isSuccess,
      isDegraded,
      statusCategory,
      errorDetail: httpRes.error ? httpRes.error.message || JSON.stringify(httpRes.error) : null,
      retriesConfigured: 3,
    },
  },
];
