import assert from 'node:assert/strict';
import {start,next} from '../assets/js/draw-core.mjs';
import {replayFrames} from '../assets/js/draw-replay-core.mjs';
const teams=Array.from({length:8},(_,i)=>({id:String(i),teamName:`Team ${i}`}));
assert.deepEqual(replayFrames(null),[]);
for(let trial=0;trial<100;trial++){
 let draw=start(teams,'0','1');assert.deepEqual(replayFrames(draw),[]);
 while(draw.slots.includes(null))draw=next(draw);
 const original=JSON.stringify(draw);const frames=replayFrames(draw);
 assert.equal(frames.length,7);assert.deepEqual(frames[0].slots,[draw.seed2,null,null,null,null,null,null,draw.seed1]);
 for(let i=1;i<7;i++){
  assert.equal(frames[i].line,i);assert.equal(frames[i].teamId,draw.slots[i]);
  assert.equal(frames[i].slots.filter(Boolean).length,i+2);
  assert.equal(new Set(frames[i].slots.filter(Boolean)).size,i+2);
 }
 assert.deepEqual(frames[6].slots,draw.slots);assert.equal(JSON.stringify(draw),original);
 frames[6].slots[0]='changed';assert.equal(JSON.stringify(draw),original);
 assert.deepEqual(replayFrames(draw)[6].slots,draw.slots);
}
console.log('PASS: 100 replays identiques au tirage validé, graines fixes, lignes 2–7, sans mutation.');
