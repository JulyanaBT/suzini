import assert from 'node:assert/strict';
import {MATCHES,schedule} from '../assets/js/schedule-core.mjs';
import {validatePlanning,swapPlanning,planningKey,moveLabel} from '../assets/js/planning-core.mjs';
let positions=validatePlanning();
let change=swapPlanning(positions,'QF1','court');
assert.equal(change.other,'QF2');assert.deepEqual(change.positions.QF1,{start:1080,court:1});
assert.deepEqual(change.positions.QF2,{start:1080,court:0});
assert.equal(planningKey(swapPlanning(change.positions,'QF1','court').positions),planningKey(positions));
change=swapPlanning(positions,'QF1','down');assert.equal(change.other,'QF3');
assert.equal(change.positions.QF1.start,1125);assert.equal(change.positions.QF3.start,1080);
const resolved=schedule(null,{},change.positions);assert.equal(resolved[0].start,1125);assert.equal(resolved[0].end,1170);
assert.equal(schedule(null,{},swapPlanning(positions,'QF1','court').positions)[0].courtName,'🐝 Manon Queen Bee');
assert.throws(()=>swapPlanning(positions,'CL1','up'),/doit suivre/);
assert.throws(()=>swapPlanning(positions,'QF1','up'),/premier créneau/);
assert.equal(moveLabel(positions,'CL1','up').allowed,false);
change=swapPlanning(positions,'F','court');assert.equal(change.other,null);assert.equal(change.positions.F.court,1);
change=swapPlanning(change.positions,'F','down');assert.equal(change.positions.F.start,1395);
assert.throws(()=>swapPlanning(change.positions,'F','down'),/minuit/);
assert.equal(planningKey(JSON.parse(JSON.stringify(change.positions))),planningKey(change.positions));
assert.throws(()=>validatePlanning({...positions,QF1:positions.QF2}),/même terrain/);
assert.throws(()=>validatePlanning({...positions,F:{start:1351,court:0}}),/invalide/);
// Walk many legal swaps; each keeps unique court slots and all match dependencies.
for(let i=0;i<1000;i++){
 const match=MATCHES[(i*7)%12],direction=['up','court','down'][i%3];
 try{positions=swapPlanning(positions,match.id,direction).positions;}catch{}
 validatePlanning(positions);
 const reverse=Object.fromEntries(Object.entries(positions).reverse().map(([id,p])=>[id,{court:p.court,start:p.start}]));
 assert.equal(planningKey(reverse),planningKey(positions));
}
console.log('PASS: échange terrain/créneau, place libre, propagation, limites, dépendances et 1000 déplacements.');
