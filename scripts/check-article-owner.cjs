const fs = require('node:fs');

const api = 'https://api.realworld.show/api';
const accountA = JSON.parse(fs.readFileSync('.private/qa-accounts.json', 'utf8')).a;
const runId = `20261110${Date.now().toString().slice(-6)}`;

(async () => {
  const login = await fetch(`${api}/users/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ user: { email: accountA.email, password: accountA.password } }),
  });
  const loginBody = await login.json();
  const token = loginBody.user?.token;
  const created = await fetch(`${api}/articles`, {
    method: 'POST',
    headers: { authorization: `Token ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ article: {
      title: `OYTRA QA ownership check ${runId}`,
      description: 'Disposable ownership verification',
      body: 'This controlled article is removed immediately after verification.',
      tagList: ['oytra-qa'],
    } }),
  });
  const articleBody = await created.json();
  const slug = articleBody.article?.slug;
  let cleanup = 'not-attempted';
  if (slug) {
    const removed = await fetch(`${api}/articles/${encodeURIComponent(slug)}`, { method: 'DELETE', headers: { authorization: `Token ${token}` } });
    cleanup = `HTTP ${removed.status}`;
  }
  console.log(JSON.stringify({
    creation: `HTTP ${created.status}`,
    createdAuthorMatchesAccountA: articleBody.article?.author?.username === accountA.username,
    cleanup,
  }, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
