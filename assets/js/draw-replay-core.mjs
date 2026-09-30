import {valid} from './draw-core.mjs?v=20260930-3';
// Replay the saved slots only: no randomness, persistence or team changes.
export function replayFrames(draw){
  if(!draw||!valid(draw)||draw.slots.some(id=>id===null))return [];
  const slots=Array(8).fill(null);slots[0]=draw.slots[0];slots[7]=draw.slots[7];
  const frames=[{line:null,teamId:null,slots:[...slots]}];
  for(let line=1;line<=6;line++){
    slots[line]=draw.slots[line];frames.push({line,teamId:draw.slots[line],slots:[...slots]});
  }
  return frames;
}
