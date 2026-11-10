const data = $input.first().json;

return [
  {
    json: {
      status: 'HEALTHY',
      target: data.target,
      statusCode: data.statusCode,
      latencyMs: data.durationMs,
      latencySLA:
        data.durationMs < 1000 ? 'EXCELLENT' : data.durationMs < 3000 ? 'ACCEPTABLE' : 'SLOW',
      timestamp: data.checkedAt,
    },
  },
];
