import assert from 'node:assert/strict';
import {start,next,valid,matches,visible,rank} from '../assets/js/draw-core.mjs';
const teams=Array.from({length:8},(_,i)=>({id:String(i),teamName:`Équipe ${i}`,woman:{prenom:'A',rank:i+1},man:{prenom:'B',rank:10}}));
for(let trial=0;trial<500;trial++){
 let d=start(teams,'0','1');
 assert.equal(d.slots[0],'1');assert.equal(d.slots[7],'0');
 for(let i=1;i<=6;i++){d=next(d);assert.ok(valid(d));assert.ok(d.slots[i]);assert.equal(d.slots.filter(Boolean).length,i+2);}
 assert.equal(new Set(d.slots).size,8);assert.equal(matches(d).length,4);
 assert.deepEqual(matches(d).flatMap(m=>[m.team1Id,m.team2Id]),d.slots);
 assert.throws(()=>next(d));
}
assert.throws(()=>start(teams.slice(0,7),'0','1'));
assert.throws(()=>start([...teams,teams[0]],'0','1'));
assert.throws(()=>start(teams,'0','0'));
assert.equal(visible({status:'cancelled'}),false);
assert.equal(visible({list:'wait'}),false);
assert.equal(rank({p1Rank:'',p2Rank:5}),null);
assert.equal(rank({p1Rank:'12',p2Rank:5}),17);
const d=start(teams,'0','1');d.slots[3]='2';assert.equal(valid(d),false);
console.log('PASS: 500 tirages complets, ordre des lignes, têtes de série, unicité, quarts, validations.');
