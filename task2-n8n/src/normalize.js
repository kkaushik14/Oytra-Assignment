const response = $input.first().json;
const config = $('Configure request').first().json;
if (!Array.isArray(response.items)) throw new Error('GitHub response is missing the items array.');
const seen = new Set();
const valid = response.items.filter((repo) => {
  if (
    !repo ||
    typeof repo.full_name !== 'string' ||
    !repo.owner?.login ||
    !repo.name ||
    typeof repo.html_url !== 'string' ||
    !repo.html_url.startsWith('https://github.com/') ||
    !Number.isFinite(repo.stargazers_count) ||
    repo.stargazers_count < 0 ||
    seen.has(repo.full_name)
  )
    return false;
  seen.add(repo.full_name);
  return true;
});
if (response.items.length && !valid.length) throw new Error('All repositories were malformed.');
const repositories = valid
  .sort((a, b) => b.stargazers_count - a.stargazers_count)
  .slice(0, 5)
  .map((repo) => ({
    name: repo.name,
    owner: repo.owner.login,
    fullName: repo.full_name,
    description:
      typeof repo.description === 'string' ? repo.description : 'No description provided',
    stars: repo.stargazers_count,
    language: repo.language ?? 'Not specified',
    url: repo.html_url,
    updatedAt: repo.updated_at ?? null,
  }));
return [
  {
    json: {
      ...config,
      repositories,
      count: repositories.length,
      skipped: response.items.length - valid.length,
      incompleteResults: response.incomplete_results === true,
    },
  },
];
