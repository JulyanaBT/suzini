export function wins(sets) {
  return sets.reduce((sum,pair)=>{sum[pair[0]>pair[1]?0:1]++;return sum;},[0,0]);
}
export function scoreText(sets) { return sets.map(pair=>pair.join('–')).join(', '); }
export function pairValid(pair) { return Array.isArray(pair)&&pair.length===2&&pair.every(n=>Number.isInteger(n)&&n>=0&&n<=99); }
export function setsValid(sets) {
  if(!Array.isArray(sets)||sets.length>3)return false;
  const counts=[0,0];
  for(const pair of sets){
    if(counts.includes(2)||!pairValid(pair)||pair[0]===pair[1])return false;
    counts[pair[0]>pair[1]?0:1]++;
  }
  return true;
}

// Firestore interdit les tableaux directement imbriqués.
export function scoreDocument(data,encode=false){
  if(!data)return data;
  const convert=entries=>Object.fromEntries(Object.entries(entries||{}).map(([id,value])=>[id,{...value,sets:Array.isArray(value?.sets)?value.sets.map(pair=>encode?{a:pair[0],b:pair[1]}:Array.isArray(pair)?pair:[pair?.a,pair?.b]):value?.sets}]));
  return {...data,results:convert(data.results),live:convert(data.live)};
}
