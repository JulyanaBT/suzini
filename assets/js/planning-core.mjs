import { MATCHES, DURATION, time } from './schedule-core.mjs?v=20261001-1';
export const FIRST_START=18*60, LAST_START=23*60+15;
export function placements(overrides={}) {
  if(!overrides||typeof overrides!=='object'||Array.isArray(overrides))throw Error('Programmation invalide.');
  if(Object.keys(overrides).some(id=>!MATCHES.some(m=>m.id===id)))throw Error('Match inconnu.');
  return Object.fromEntries(MATCHES.map(m=>[m.id,overrides[m.id]||{start:m.start,court:m.court}]));
}
export function validatePlanning(overrides={}){
  const positions=placements(overrides),occupied=new Set();
  for(const m of MATCHES){
    const p=positions[m.id];
    if(!p||!Number.isInteger(p.start)||p.start<FIRST_START||p.start>LAST_START||(p.start-FIRST_START)%DURATION||![0,1].includes(p.court))throw Error('Créneau ou terrain invalide.');
    const key=`${p.start}/${p.court}`;
    if(occupied.has(key))throw Error('Deux matchs occupent le même terrain au même horaire.');
    occupied.add(key);
    for(const source of m.sources){
      if(source.type!=='slot'&&positions[source.match].start+DURATION>p.start)throw Error(`${m.title} doit suivre ${MATCHES.find(x=>x.id===source.match).title.toLowerCase()}.`);
    }
  }
  return positions;
}
export function planningKey(overrides={}){
  const p=validatePlanning(overrides);
  return JSON.stringify(MATCHES.map(m=>[m.id,p[m.id].start,p[m.id].court]));
}
export function swapPlanning(overrides,id,direction){
  const p=validatePlanning(overrides),from=p[id];
  if(!from||!['up','down','court'].includes(direction))throw Error('Déplacement inconnu.');
  const to={start:from.start+(direction==='up'?-DURATION:direction==='down'?DURATION:0),court:direction==='court'?1-from.court:from.court};
  if(to.start<FIRST_START)throw Error('Le premier créneau est à 18 h 00.');
  if(to.start>LAST_START)throw Error('Le dernier créneau se termine à minuit.');
  const other=MATCHES.find(m=>p[m.id].start===to.start&&p[m.id].court===to.court);
  const next={...p,[id]:to};
  if(other)next[other.id]={...from};
  validatePlanning(next);
  return {positions:next,other:other?.id||null,start:to.start,court:to.court};
}
export function moveLabel(overrides,id,direction){
  try{
    const result=swapPlanning(overrides,id,direction);
    const target=result.other?MATCHES.find(m=>m.id===result.other).title:'une place libre';
    return {allowed:true,label:direction==='court'?`Changer de terrain : ${result.other?'échanger avec '+target:'déplacer sur le terrain libre'}`:`${direction==='up'?'Avancer':'Reculer'} à ${time(result.start)} : ${result.other?'échanger avec '+target:target}`};
  }catch(e){return {allowed:false,label:e.message};}
}
