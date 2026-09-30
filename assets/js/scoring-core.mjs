import { schedule, descendants, drawKey } from './schedule-core.mjs?v=20261001-2';

import { wins, scoreText, setsValid, pairValid } from './score-values.mjs?v=20261001-2';
export { wins, scoreText } from './score-values.mjs?v=20261001-2';
export function blankLive(match) { return {team1Id:match.participants[0].id,team2Id:match.participants[1].id,sets:[],current:[0,0]}; }
export function liveValid(live,match) {
  return !!live && !!match && match.participants.every(p=>p.id&&!p.pending) && live.team1Id===match.participants[0].id && live.team2Id===match.participants[1].id
    && setsValid(live.sets) && pairValid(live.current)
    && (!wins(live.sets).includes(2)||live.current.every(n=>n===0));
}
export function matchStateKey(state,id) {
  const r=state.results?.[id],l=state.live?.[id];
  return JSON.stringify([r?[r.team1Id,r.team2Id,r.winnerId,r.score,r.sets]:null,l?[l.team1Id,l.team2Id,l.sets,l.current]:null]);
}
export function reduceScore(draw,revision,state,id,action) {
  if(!drawKey(draw,revision))throw Error('Le tirage doit être terminé.');
  const match=schedule(draw,state.results||{}).find(m=>m.id===id);
  if(!match)throw Error('Match inconnu.');
  const results={...(state.results||{})}, live={...(state.live||{})};
  if(action.type==='reset'){
    const blocked=descendants(id).filter(next=>results[next]||live[next]);
    if(blocked.length)throw Error(`Réinitialise d’abord les matchs suivants déjà saisis : ${blocked.join(', ')}.`);
    delete results[id];delete live[id];return {results,live};
  }
  if(match.participants.some(p=>p.pending))throw Error('Les deux équipes doivent être connues avant de saisir le score.');
  if(action.type==='reopen'){
    if(!match.result)throw Error('Aucun résultat validé à corriger.');
    const blocked=descendants(id).filter(next=>results[next]||live[next]);
    if(blocked.length)throw Error(`Impossible de corriger : une saisie a déjà commencé sur ${blocked.join(', ')}.`);
    const sets=match.result.sets.map(pair=>[...pair]);
    if(!setsValid(sets)||!sets.length)throw Error('Le score enregistré est invalide.');
    live[id]={team1Id:match.participants[0].id,team2Id:match.participants[1].id,current:sets.pop(),sets};
    delete results[id];return {results,live};
  }
  if(match.result||results[id])throw Error('Ce résultat est déjà validé. Utilise « Corriger ».');
  const value=live[id]||blankLive(match);
  if(!liveValid(value,match))throw Error('La saisie enregistrée ne correspond plus à ce match.');
  const next={...value,sets:value.sets.map(pair=>[...pair]),current:[...value.current]};
  const complete=wins(next.sets).includes(2);
  if(action.type==='adjust'){
    if(complete)throw Error('Deux sets sont gagnés. Confirme le résultat ou corrige le dernier set.');
    if(![0,1].includes(action.team)||![-1,1].includes(action.delta))throw Error('Action invalide.');
    const n=next.current[action.team]+action.delta;
    if(n<0||n>99)throw Error('Le score doit être compris entre 0 et 99.');
    next.current[action.team]=n;
  }else if(action.type==='validateSet'){
    if(complete)throw Error('Le match attend déjà sa confirmation.');
    if(next.current[0]===next.current[1])throw Error('Un set ne peut pas être validé à égalité.');
    next.sets.push([...next.current]);next.current=[0,0];
  }else if(action.type==='undoSet'){
    if(!next.sets.length)throw Error('Aucun set validé à reprendre.');
    if(next.current.some(n=>n!==0))throw Error('Ramène le set en cours à 0–0 avant de reprendre le précédent.');
    next.current=next.sets.pop();
  }else if(action.type==='confirm'){
    if(!complete)throw Error('Une équipe doit gagner deux sets avant de confirmer le match.');
    const winner=wins(next.sets)[0]===2?0:1;
    results[id]={team1Id:next.team1Id,team2Id:next.team2Id,winnerId:match.participants[winner].id,sets:next.sets,score:scoreText(next.sets)};
    delete live[id];return {results,live};
  }else throw Error('Action inconnue.');
  live[id]=next;return {results,live};
}
