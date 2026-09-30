import assert from 'node:assert/strict';
import {start} from '../assets/js/draw-core.mjs';
import {schedule,drawKey} from '../assets/js/schedule-core.mjs';
import {scoreDocument} from '../assets/js/score-values.mjs';
import {ranking} from '../assets/js/ranking-core.mjs';
const draw=start(Array.from({length:8},(_,i)=>({id:String(i),teamName:`Team ${i}`})),'0','1');
draw.slots=['1','2','3','4','5','6','7','0'];
assert.equal(ranking(null,0,null).placed,0);
assert.equal(ranking(draw,8,null).validated,0);
for(let mask=0;mask<4096;mask++){
 const results={},doc={version:1,drawKey:drawKey(draw,8),results,live:{}};
 for(let i=0;i<12;i++){
  const m=schedule(draw,results)[i],winner=m.participants[(mask>>i)&1];
  const sets=winner===m.participants[0]?[[4,0],[4,0]]:[[0,4],[0,4]];
  results[m.id]={team1Id:m.participants[0].id,team2Id:m.participants[1].id,winnerId:winner.id,sets,score:sets.map(p=>p.join('–')).join(', ')};
  const current=ranking(draw,8,scoreDocument(doc,true));
  assert.equal(current.validated,i+1);
  assert.equal(current.placed,i<8?0:(i-7)*2);
 }
 const state=ranking(draw,8,scoreDocument(doc,true));
 assert.equal(state.complete,true);assert.equal(new Set(state.rows.map(r=>r.team.id)).size,8);
 for(const [id,place] of [['F',1],['P3',3],['P5',5],['P7',7]])assert.equal(state.rows[place-1].team.id,results[id].winnerId);
 assert.equal(ranking(draw,9,doc).placed,0);
 delete results.F;assert.equal(ranking(draw,8,doc).placed,6);assert.equal(ranking(draw,8,doc).complete,false);
}
console.log('PASS: 4096 classements, huit places uniques, podium, progression, réinitialisation et ancien tirage.');
