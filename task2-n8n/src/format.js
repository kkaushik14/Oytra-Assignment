const data = $input.first().json;
// The branch nodes supply a distinct priority value before formatting.
const clean = value => String(value).replace(/@/g,'＠').replace(/[\r\n]/g,' ').replace(/[`*_~<>]/g,'').slice(0,160);
const title = data.priority === 'high' ? 'PRIORITY — GitHub Repository Digest' :
  data.priority === 'empty' ? 'GitHub Repository Digest — No results' : 'STANDARD — GitHub Repository Digest';
const lines = [title,`Topic: ${data.topic} | ${data.requestedAt}`,`Popularity rule: top repository stars > ${data.threshold}`, ''];
if (!data.count) lines.push('No matching repositories were returned. No enrichment was attempted.');
for (const [index,repo] of data.repositories.entries()) {
  lines.push(`${index+1}. ${clean(repo.fullName)} — ${repo.stars} stars · ${clean(repo.language)}`,repo.url);
}
if (data.enrichment) {
  lines.push('',`Language enrichment for ${clean(data.enrichment.repository)}:`);
  lines.push(data.enrichment.status === 'ok' ? data.enrichment.languages.map(x=>`${clean(x.name)} ${x.percent}%`).join(', ') : 'Unavailable; original repository information retained.');
}
if (data.incompleteResults) lines.push('Warning: GitHub reported incomplete search results.');
if (data.skipped) lines.push(`Skipped ${data.skipped} invalid or duplicate result(s).`);
if (data.count && data.count < 5) lines.push(`Only ${data.count} valid matching repositories were available.`);
const content = lines.join('\n');
if (content.length > 2000) throw new Error('Digest exceeds Discord message limit.');
return [{json:{...data,content}}];
