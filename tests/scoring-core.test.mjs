import assert from 'node:assert/strict';
import {start} from '../assets/js/draw-core.mjs';
import {schedule,drawKey} from '../assets/js/schedule-core.mjs';
import {reduceScore,wins,matchStateKey} from '../assets/js/scoring-core.mjs';
const teams=Array.from({length:8},(_,i)=>({id:String(i),teamName:`Team ${i}`}));
const draw=start(teams,'0','1');draw.slots=['1','2','3','4','5','6','7','0'];
let state={results:{},live:{}};
const apply=(id,action)=>state=reduceScore(draw,8,state,id,action);
const point=(id,team,n)=>{for(let i=0;i<n;i++)apply(id,{type:'adjust',team,delta:1});};
const set=(id,a,b)=>{point(id,0,a);point(id,1,b);apply(id,{type:'validateSet'});};
assert.throws(()=>apply('DF1',{type:'adjust',team:0,delta:1}),/connues/);
assert.throws(()=>apply('QF1',{type:'adjust',team:0,delta:-1}));
assert.throws(()=>apply('QF1',{type:'validateSet'}),/égalité/);
point('QF1',0,1);apply('QF1',{type:'adjust',team:0,delta:-1});assert.deepEqual(state.live.QF1.current,[0,0]);
set('QF1',4,2);assert.deepEqual(state.live.QF1.current,[0,0]);assert.equal(state.live.QF1.sets.length,1);
set('QF1',1,4);assert.deepEqual(wins(state.live.QF1.sets),[1,1]);
set('QF1',10,8);assert.equal(state.results.QF1,undefined);assert.equal(schedule(draw,state.results).find(m=>m.id==='DF1').participants[0].pending,true);
assert.throws(()=>point('QF1',0,1),/Deux sets/);
state=JSON.parse(JSON.stringify(state)); // resume confirmation after reload
apply('QF1',{type:'undoSet'});assert.deepEqual(state.live.QF1.current,[10,8]);apply('QF1',{type:'validateSet'});
apply('QF1',{type:'confirm'});assert.equal(state.results.QF1.score,'4–2, 1–4, 10–8');assert.equal(state.results.QF1.winnerId,'1');assert.equal(state.live.QF1,undefined);
assert.equal(schedule(draw,state.results).find(m=>m.id==='DF1').participants[0].id,'1');assert.equal(schedule(draw,state.results).find(m=>m.id==='CL1').participants[0].id,'2');
apply('QF1',{type:'reopen'});assert.equal(state.results.QF1,undefined);assert.deepEqual(state.live.QF1.current,[10,8]);apply('QF1',{type:'validateSet'});apply('QF1',{type:'confirm'});
set('QF2',4,0);set('QF2',4,1);apply('QF2',{type:'confirm'});point('DF1',0,1);assert.throws(()=>apply('QF1',{type:'reopen'}),/déjà commencé/);
assert.notEqual(drawKey(draw,8),drawKey(draw,9));
const a={live:{x:{team1Id:'a',team2Id:'b',sets:[[4,1]],current:[1,2]}},results:{}};
const b={results:{},live:{x:{current:[1,2],sets:[[4,1]],team2Id:'b',team1Id:'a'}}};assert.equal(matchStateKey(a,'x'),matchStateKey(b,'x'));
for(let trial=0;trial<32;trial++){
 state={results:{},live:{}};
 for(const match of schedule(draw)){
  const side=(trial+match.start+match.court)%2;
  for(let s=0;s<2;s++){point(match.id,side,4);apply(match.id,{type:'validateSet'});}
  assert.equal(state.results[match.id],undefined);apply(match.id,{type:'confirm'});
 }
 assert.equal(Object.keys(state.results).length,12);assert.equal(Object.keys(state.live).length,0);
 assert.ok(schedule(draw,state.results).every(m=>m.result&&m.participants.every(p=>!p.pending)));
}
console.log('PASS: +/−, égalité, trois sets, reprise, confirmation obligatoire, propagation, corrections et 32 tournois complets.');

const {scoreDocument}=await import('../assets/js/score-values.mjs');
const example={results:{QF1:{sets:[[4,2],[4,1]]}},live:{QF2:{sets:[[1,4]],current:[2,1]}}};
assert.deepEqual(scoreDocument(scoreDocument(example,true)),example);
assert.deepEqual(scoreDocument(example,true).results.QF1.sets,[{a:4,b:2},{a:4,b:1}]);

// A reset clears all validated sets, current points, and confirmed qualification.
let resetState={results:{},live:{}};
for(let setNo=0;setNo<2;setNo++){
 resetState=reduceScore(draw,8,resetState,'QF1',{type:'adjust',team:0,delta:1});
 resetState=reduceScore(draw,8,resetState,'QF1',{type:'validateSet'});
}
resetState=reduceScore(draw,8,resetState,'QF1',{type:'confirm'});
assert.equal(schedule(draw,resetState.results).find(m=>m.id==='DF1').participants[0].pending,false);
assert.equal(schedule(draw,resetState.results).find(m=>m.id==='CL1').participants[0].pending,false);
const blockedState={...resetState,live:{DF1:{team1Id:'1',team2Id:'3',sets:[],current:[1,0]}}};
assert.throws(()=>reduceScore(draw,8,blockedState,'QF1',{type:'reset'}),/d’abord/);
const cleared=reduceScore(draw,8,resetState,'QF1',{type:'reset'});
assert.deepEqual(cleared,{results:{},live:{}});
assert.equal(schedule(draw,cleared.results).find(m=>m.id==='DF1').participants[0].pending,true);
assert.equal(schedule(draw,cleared.results).find(m=>m.id==='CL1').participants[0].pending,true);
const inProgress=reduceScore(draw,8,cleared,'QF1',{type:'adjust',team:1,delta:1});
assert.deepEqual(reduceScore(draw,8,inProgress,'QF1',{type:'reset'}),cleared);
assert.ok(resetState.results.QF1); // no mutation of the input
console.log('PASS: remise à zéro en cours/confirmé, retrait des qualifications, protection des matchs suivants.');
