import assert from 'node:assert/strict';
import { MATCHES, COURTS, DURATION, schedule, time } from '../assets/js/schedule-core.mjs';
import { start } from '../assets/js/draw-core.mjs';
assert.equal(MATCHES.length,12);
assert.deepEqual(COURTS,['Lisa de Los Pimentos','Manon Queen Bee']);
assert.equal(DURATION,45);
assert.equal(Math.min(...MATCHES.map(m=>m.start)),1080);
assert.equal(Math.max(...MATCHES.map(m=>m.start+DURATION)),1350);
assert.equal(new Set(MATCHES.map(m=>`${m.start}:${m.court}`)).size,12);
assert.equal(new Set(MATCHES.map(m=>m.id)).size,12);
for(const m of MATCHES)for(const s of m.sources)if(s.type!=='slot'){
 const previous=MATCHES.find(p=>p.id===s.match);assert.ok(previous);assert.ok(previous.start+DURATION<=m.start);
}
// Exhaustively simulate all winner combinations. Each team must play exactly
// three matches, never overlap and have exactly one final placement.
for(let scenario=0;scenario<4096;scenario++){
 const results={},games=Array.from({length:8},()=>[]),placements=[];
 MATCHES.forEach((m,index)=>{
  const players=m.sources.map(s=>s.type==='slot'?s.line:results[s.match][s.type]);
  assert.notEqual(players[0],players[1]);
  for(const player of players){assert.ok(games[player].every(previous=>previous+DURATION<=m.start));games[player].push(m.start);}
  const selected=(scenario>>index)&1;
  results[m.id]={winner:players[selected],loser:players[1-selected]};
  if(['F','P3','P5','P7'].includes(m.id))placements.push(...players);
 });
 assert.ok(games.every(g=>g.length===3));assert.equal(new Set(placements).size,8);
}
const teams=Array.from({length:8},(_,i)=>({id:String(i),teamName:`Team ${i}`,p1Rank:1,p2Rank:2}));
const d=start(teams,'0','1');
let rows=schedule(d);assert.equal(rows[0].participants[0].name,'Team 1');assert.equal(rows[3].participants[1].name,'Team 0');assert.equal(rows[0].participants[1].pending,true);
d.slots=['1','2','3','4','5','6','7','0'];rows=schedule(d);
assert.ok(rows.slice(0,4).every(m=>m.participants.every(p=>!p.pending)));
assert.equal(rows.find(m=>m.id==='F').participants[0].name,'Vainqueur DF1');
assert.equal(rows.find(m=>m.id==='CL1').participants[0].name,'Perdant QF1');
assert.equal(time(1305),'21 h 45');assert.equal(time(1350),'22 h 30');
assert.equal(schedule(null).length,12);assert.throws(()=>schedule({}));
console.log('PASS: 4096 scénarios TMC, 3 matchs par équipe, aucun chevauchement, 8 places finales, tirages partiels et complets.');
