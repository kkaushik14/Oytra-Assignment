const timestamp = new Date().toISOString();
const targetUrl = 'https://demo.realworld.show';
const apiTarget = 'https://api.realworld.show/api/tags';

return [
  {
    json: {
      timestamp,
      targetUrl,
      apiTarget,
      startTime: Date.now(),
      monitorVersion: '1.0.0',
    },
  },
];
