// Run: node --experimental-vm-modules tests/draw-page.test.mjs
// Exercise the real page handlers and Firestore callbacks without touching production.
import vm from 'node:vm';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
const source = await fs.readFile(new URL('../assets/js/draw-page.js',import.meta.url),'utf8');
const core = await fs.readFile(new URL('../assets/js/draw-core.mjs',import.meta.url),'utf8');
const teams = Array.from({length:8},(_,i)=>({id:String(i),teamName:`Équipe ${i+1}`,woman:{prenom:'A',rank:i+1},man:{prenom:'B',rank:10}}));
// Firestore serializes maps independently of insertion order at every nesting level.
function stored(value){
 if(Array.isArray(value))return value.map(stored);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stored(value[k])]));
 return value;
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function createPage(initial=null){
 const elements=new Map();
 const get=id=>{
  if(!elements.has(id))elements.set(id,{value:'',hidden:false,disabled:false,textContent:'',innerHTML:'',classList:{toggle(){},add(){}}});
  return elements.get(id);
 };
 let state=initial, writes=0, deny=false, conflict=false, teamCount=8;
 const listeners=[];
 const snapshot=ref=>ref.endsWith('/teams')?{docs:teams.slice(0,teamCount).map(t=>({id:t.id,exists:()=>true,data:()=>stored(t)})),metadata:{fromCache:false}}:ref.includes('/teams/')?{id:ref.split('/').at(-1),exists:()=>true,data:()=>stored(teams.find(t=>t.id===ref.split('/').at(-1)))}:{exists:()=>state!==null,data:()=>stored(state),metadata:{fromCache:false,hasPendingWrites:false}};
 const emit=()=>listeners.forEach(([ref,cb])=>cb(snapshot(ref)));
 const api={
  collection:(_db,...parts)=>parts.join('/'),
  doc:(first,...parts)=>[...(typeof first==='string'?[first]:[]),...parts].join('/'),
  onSnapshot:(ref,_opts,cb)=>{listeners.push([ref,cb]);queueMicrotask(()=>cb(snapshot(ref)));},
  serverTimestamp:()=>123,
  runTransaction:async(_db,fn)=>{
   if(deny)throw Object.assign(Error('Denied'),{code:'permission-denied'});
   let pending;
   await fn({get:async ref=>conflict&&ref.endsWith('/draw')?{exists:()=>true,data:()=>({revision:999})}:snapshot(ref),set:(_ref,data)=>{pending=data;}});
   state=stored(pending);writes++;emit();
  },
 };
 const context=vm.createContext({document:{body:{dataset:{admin:'true'}},getElementById:get},console:{error(){}},crypto:webcrypto,confirm:()=>true});
 const module=(exports,name)=>new vm.SyntheticModule(Object.keys(exports),function(){for(const [k,v] of Object.entries(exports))this.setExport(k,v);},{context,identifier:name});
 const modules=new Map([
  ['core',new vm.SourceTextModule(core,{context})],
  ['admin',module({requireAdmin:()=>true,isAdminConnected:()=>true},'admin')],
  ['firebase',module({db:{}},'firebase')],
  ['firestore',module(api,'firestore')],
 ]);
 const load=async spec=>{
  const m=modules.get(spec.includes('draw-core')?'core':spec.includes('admin-session')?'admin':spec.includes('firebase-firestore')?'firestore':'firebase');
  if(m.status==='unlinked')await m.link(load);
  if(m.status==='linked')await m.evaluate();
  return m;
 };
 const page=new vm.SourceTextModule(source,{context,importModuleDynamically:load});
 await page.link(load);await page.evaluate();await tick();await tick();
 return {get,state:()=>state,writes:()=>writes,setDeny:v=>deny=v,setConflict:v=>conflict=v,setTeamCount:v=>{teamCount=v;emit();}};
}
for(let run=0;run<20;run++){
 let p=await createPage();
 assert.equal(p.get('start').disabled,false);
 p.get('start').onclick();await tick();
 assert.equal(p.state().draw.slots.filter(Boolean).length,2);
 for(let line=2;line<=7;line++){
  assert.equal(p.get('next').disabled,false,`line ${line}: ${p.get('status').textContent}`);
  assert.equal(p.get('next').textContent,`Tirer la ligne ${line}`);
  p.get('next').onclick();p.get('next').onclick(); // rapid double click must save only once
  await tick();
  assert.equal(p.state().draw.slots.filter(Boolean).length,line+1);
  assert.equal(p.state().draw.slots[0],'1');assert.equal(p.state().draw.slots[7],'0');
  assert.ok(!p.get('status').textContent.includes('changé'));
  p=await createPage(p.state()); // full reload after every line
 }
 assert.equal(p.get('next').hidden,true);
 assert.equal(new Set(p.state().draw.slots).size,8);
}
let p=await createPage();p.setDeny(true);p.get('start').onclick();await tick();assert.equal(p.writes(),0);assert.match(p.get('status').textContent,/refusé/);
p=await createPage();p.setConflict(true);p.get('start').onclick();await tick();assert.equal(p.writes(),0);assert.match(p.get('status').textContent,/autre appareil/);
p=await createPage();p.get('start').onclick();await tick();p.setTeamCount(7);assert.equal(p.get('next').disabled,true);
console.log('PASS: 20 parcours complets, 120 clics, champs Firestore réordonnés, rechargement après chaque ligne, doubles clics, erreurs et vrais changements.');
