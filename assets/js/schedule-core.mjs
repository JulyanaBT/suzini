import { valid } from './draw-core.mjs?v=20260930-3';

export const COURTS = ['🌶️ Lisa de Los Pimentos', '🐝 Manon Queen Bee'];
export const DURATION = 45;
const slot = line => ({ type: 'slot', line });
const winner = match => ({ type: 'winner', match });
const loser = match => ({ type: 'loser', match });

// All quarterfinals, classification 5–8, semifinals, places 7/5, third place,
// then the final alone. Every team plays three matches.
export const MATCHES = [
  { id:'QF1', title:'Quart de finale 1', round:'quarter', start:1080, court:0, sources:[slot(0),slot(1)] },
  { id:'QF2', title:'Quart de finale 2', round:'quarter', start:1080, court:1, sources:[slot(2),slot(3)] },
  { id:'QF3', title:'Quart de finale 3', round:'quarter', start:1125, court:0, sources:[slot(4),slot(5)] },
  { id:'QF4', title:'Quart de finale 4', round:'quarter', start:1125, court:1, sources:[slot(6),slot(7)] },
  { id:'CL1', title:'Classement 5–8 · match 1', round:'classification', start:1170, court:0, sources:[loser('QF1'),loser('QF2')] },
  { id:'CL2', title:'Classement 5–8 · match 2', round:'classification', start:1170, court:1, sources:[loser('QF3'),loser('QF4')] },
  { id:'DF1', title:'Demi-finale 1', round:'semi', start:1215, court:0, sources:[winner('QF1'),winner('QF2')] },
  { id:'DF2', title:'Demi-finale 2', round:'semi', start:1215, court:1, sources:[winner('QF3'),winner('QF4')] },
  { id:'P7', title:'Match pour la 7e place', round:'place7', start:1260, court:0, sources:[loser('CL1'),loser('CL2')] },
  { id:'P5', title:'Match pour la 5e place', round:'place5', start:1260, court:1, sources:[winner('CL1'),winner('CL2')] },
  { id:'P3', title:'Match pour la 3e place', round:'place3', start:1305, court:0, sources:[loser('DF1'),loser('DF2')] },
  { id:'F', title:'Finale', round:'final', start:1350, court:0, sources:[winner('DF1'),winner('DF2')] },
];

export function time(minutes) {
  return `${String(Math.floor(minutes/60)).padStart(2,'0')} h ${String(minutes%60).padStart(2,'0')}`;
}

export function participant(source, draw) {
  if(source.type !== 'slot') return {
    name: `${source.type === 'winner' ? 'Vainqueur' : 'Perdant'} ${source.match}`,
    players: '', seed: null, pending: true,
  };
  const id = draw?.slots[source.line];
  const team = id ? draw.teams.find(t => t.id === id) : null;
  if(!team) return { name:`Équipe ligne ${source.line+1}`, players:'À déterminer au tirage', seed:null, pending:true };
  return { name:team.name, players:team.players.join(' · '), seed:id === draw.seed1 ? 1 : id === draw.seed2 ? 2 : null, pending:false };
}

export function schedule(draw = null) {
  if(draw !== null && !valid(draw)) throw Error('Le tirage enregistré est invalide.');
  return MATCHES.map(match => ({
    ...match, end:match.start+DURATION, courtName:COURTS[match.court],
    participants:match.sources.map(source => participant(source,draw)),
  }));
}
