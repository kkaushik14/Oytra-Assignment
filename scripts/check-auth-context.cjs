const fs = require('node:fs');

const accountA = JSON.parse(fs.readFileSync('.private/qa-accounts.json', 'utf8')).a;

(async () => {
  const login = await fetch('https://api.realworld.show/api/users/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ user: { email: accountA.email, password: accountA.password } }),
  });
  const loginBody = await login.json();
  const token = loginBody.user?.token;
  const current = await fetch('https://api.realworld.show/api/user', {
    headers: { authorization: `Token ${token}` },
  });
  const currentBody = await current.json();
  console.log(JSON.stringify({
    login: `HTTP ${login.status}`,
    currentUser: `HTTP ${current.status}`,
    loginIdentityMatchesAccountA: loginBody.user?.username === accountA.username,
    currentIdentityMatchesAccountA: currentBody.user?.username === accountA.username,
  }, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
