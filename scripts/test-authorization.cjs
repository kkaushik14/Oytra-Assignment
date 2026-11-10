const fs = require('node:fs');

const api = 'https://api.realworld.show/api';
const accountA = JSON.parse(fs.readFileSync('.private/qa-accounts.json', 'utf8')).a;
const runId = `20261110${Date.now().toString().slice(-6)}`;
const accountB = {
  username: `oytra_qa_b_${runId}`,
  email: `oytra.qa.b.${runId}@example.com`,
  password: `OytraQa!${runId}z`,
};

async function request(path, options = {}) {
  const response = await fetch(`${api}${path}`, options);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { nonJson: true };
  }
  return { status: response.status, body };
}

async function register(user) {
  return request('/users', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ user }),
  });
}

async function login(user) {
  const result = await request('/users/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ user: { email: user.email, password: user.password } }),
  });
  if (result.status !== 200 || !result.body.user?.token)
    throw new Error(`Controlled account login failed: HTTP ${result.status}`);
  return result.body.user.token;
}

function auth(token) {
  return { authorization: `Token ${token}`, 'content-type': 'application/json' };
}

(async () => {
  const createdB = await register(accountB);
  if (createdB.status !== 201)
    throw new Error(`Controlled account B creation failed: HTTP ${createdB.status}`);
  const tokenA = await login(accountA);
  const tokenB = await login(accountB);
  const created = await request('/articles', {
    method: 'POST',
    headers: auth(tokenA),
    body: JSON.stringify({
      article: {
        title: `OYTRA QA authorization ${runId}`,
        description: 'Disposable controlled ownership test',
        body: 'This clearly labelled QA article will be removed at the end of the test.',
        tagList: ['oytra-qa', 'authorization-test'],
      },
    }),
  });
  if (created.status !== 201 || !created.body.article?.slug)
    throw new Error(`Controlled article creation failed: HTTP ${created.status}`);
  const slug = created.body.article.slug;

  const readAsB = await request(`/articles/${encodeURIComponent(slug)}`, { headers: auth(tokenB) });
  const updateAsB = await request(`/articles/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    headers: auth(tokenB),
    body: JSON.stringify({ article: { title: `UNAUTHORIZED CHANGE ${runId}` } }),
  });
  const updatedSlug = updateAsB.body.article?.slug ?? slug;
  const deleteAsB = await request(`/articles/${encodeURIComponent(updatedSlug)}`, {
    method: 'DELETE',
    headers: auth(tokenB),
  });

  const afterAsA = await request(`/articles/${encodeURIComponent(updatedSlug)}`, {
    headers: auth(tokenA),
  });
  let cleanup = 'not-needed';
  if (afterAsA.status === 200) {
    const cleaned = await request(`/articles/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      headers: auth(tokenA),
    });
    cleanup = `HTTP ${cleaned.status}`;
  }

  const summary = {
    scope: 'two controlled disposable accounts and one clearly labelled disposable article',
    accountBRegistration: `HTTP ${createdB.status}`,
    BReadAArticle: `HTTP ${readAsB.status}`,
    BUpdateAArticle: `HTTP ${updateAsB.status}`,
    BDeleteAArticle: `HTTP ${deleteAsB.status}`,
    AReadAfterBMutations: `HTTP ${afterAsA.status}`,
    readAuthorIsAccountA: readAsB.body.article?.author?.username === accountA.username,
    updateAppliedRequestedTitle: updateAsB.body.article?.title === `UNAUTHORIZED CHANGE ${runId}`,
    updateResponseAuthor:
      updateAsB.body.article?.author?.username === accountA.username
        ? 'account-a'
        : 'other-or-missing',
    cleanup,
    crossAccountWriteObserved: updateAsB.status >= 200 && updateAsB.status < 300,
    crossAccountDeleteObserved: deleteAsB.status >= 200 && deleteAsB.status < 300,
  };
  console.log(JSON.stringify(summary, null, 2));
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
