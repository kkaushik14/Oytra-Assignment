const base = $('Normalize top five').first().json;
const result = $input.first().json;
const entries = Object.entries(result).filter(([name,bytes]) => name !== 'error' && typeof bytes === 'number' && Number.isFinite(bytes) && bytes > 0);
const total = entries.reduce((sum,[,bytes]) => sum+bytes,0);
const languages = entries.sort((a,b)=>b[1]-a[1]).slice(0,3).map(([name,bytes]) => ({name,bytes,percent:Math.round(bytes/total*1000)/10}));
return [{json:{...base,topStars:base.repositories[0].stars,
  enrichment:{status:result.error ? 'unavailable' : (total ? 'ok' : 'no-language-data'),
    repository:base.repositories[0].fullName,languages}}}];
