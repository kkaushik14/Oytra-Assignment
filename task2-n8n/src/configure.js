const body = $input.first().json.body ?? {};
const topic = String(body.topic ?? 'automation')
  .trim()
  .toLowerCase();
const threshold = Number(body.threshold ?? 1000);
if (!/^[a-z0-9][a-z0-9-]{0,49}$/.test(topic)) {
  throw new Error('Topic must contain 1–50 lowercase letters, digits or hyphens.');
}
if (!Number.isFinite(threshold) || threshold < 0 || threshold > 10000000) {
  throw new Error('Threshold must be a number between 0 and 10000000.');
}
return [{ json: { topic, threshold, requestedAt: new Date().toISOString() } }];
