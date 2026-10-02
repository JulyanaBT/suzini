import {displayDraw} from './team-display.mjs?v=20261002-1';
import {EVENT_ID,valid} from './draw-core.mjs?v=20260930-3';
import {replayFrames} from './draw-replay-core.mjs?v=20261001-5';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let rawDraw=null,currentTeams=[];
let saved=null,revision=0,ready=false,online=false,running=false,timer=null,run=0;
let shown=Array(8).fill(null);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function render(highlight=-1){
  if(!$('quarters'))return;
  $('quarters').innerHTML=[0,1,2,3].map(q=>`<article class="public-quarter" aria-label="Quart de finale ${q+1}"><h2>Quart ${q+1}</h2>${[q*2,q*2+1].map(line=>{
    const team=saved?.teams.find(t=>t.id===shown[line]);
    const seed=team&&(team.id===saved.seed1?1:team.id===saved.seed2?2:null);
    return `<div class="public-slot ${team?'':'pending'} ${highlight===line?'revealed':''}"><span class="public-line">${line+1}</span><strong>${team?esc(team.name):'À tirer'}</strong>${seed?`<span class="public-seed">TS ${seed}</span>`:''}</div>`;
  }).join('')}</article>`).join('');
  $('replayStart').disabled=!ready||!online||replayFrames(saved).length===0||running;
  $('replayStart').hidden=running;$('replayStop').hidden=!running;
  $('drawCount').textContent=`${shown.filter(Boolean).length}/8 équipes`;
}
function status(text,error=false){$('drawStatus').textContent=text;$('drawStatus').classList.toggle('error',error);}
function restore(message){
  run++;clearTimeout(timer);timer=null;running=false;
  shown=saved?[...saved.slots]:Array(8).fill(null);
  $('roulette').classList.remove('spinning');
  $('rouletteName').textContent='🎲 Revoir le tirage';
  $('rouletteLabel').textContent='Replay du tirage enregistré';
  render();
  status(message||(!ready?'Chargement…':!online?'Dernier tableau reçu · reconnexion…':saved?shown.every(Boolean)?'Tirage validé · Quarts de finale':'Tirage en cours en administration':'Le tirage sera bientôt disponible.'));
}
function replay(){
  if($('replayStart').disabled)return;
  const frames=replayFrames(saved),snapshot=saved;
  const token=++run;running=true;shown=[...frames[0].slots];render();
  $('rouletteName').textContent='TS 2 en haut · TS 1 en bas';
  $('rouletteLabel').textContent='Les têtes de série prennent place';
  status('Replay · Placement des têtes de série');
  let step=1;
  const later=(fn,delay)=>{timer=setTimeout(()=>{if(token===run)fn();},delay);};
  function revealNext(){
    const frame=frames[step];
    if(!frame){running=false;render();$('roulette').classList.remove('spinning');$('rouletteLabel').textContent='Replay terminé';$('rouletteName').textContent='Les quatre quarts sont prêts';status('Tirage validé · Replay terminé');return;}
    const candidates=snapshot.teams.filter(t=>!shown.includes(t.id));
    const target=snapshot.teams.find(t=>t.id===frame.teamId);
    $('rouletteLabel').textContent=`Ligne ${frame.line+1} · Quart ${Math.floor(frame.line/2)+1}`;
    status(`Replay · Tirage de la ligne ${frame.line+1}`);
    let tick=0;
    function land(){
      $('roulette').classList.remove('spinning');$('rouletteName').textContent=target.name;
      shown=[...frame.slots];render(frame.line);status(`${target.name} · ligne ${frame.line+1}`);
      step++;later(revealNext,reduced.matches?450:650);
    }
    function spin(){
      $('rouletteName').textContent=candidates[tick%candidates.length].name;
      tick++;
      if(tick>=13){later(land,160);return;}
      later(spin,45+tick*8);
    }
    if(reduced.matches){$('rouletteName').textContent=target.name;later(land,350);}
    else{$('roulette').classList.add('spinning');spin();}
  }
  later(revealNext,reduced.matches?450:1000);
}
$('replayStart').onclick=replay;
$('replayStop').onclick=()=>restore('Tirage validé · Tableau complet');
document.addEventListener('visibilitychange',()=>{if(document.hidden&&running)restore();});
window.addEventListener('pagehide',()=>{if(running)restore();});
async function boot(){
  const [{db},{doc,collection,onSnapshot}]=await Promise.all([import('./firebase.js'),import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')]);
  onSnapshot(collection(db,'events',EVENT_ID,'teams'),{includeMetadataChanges:true},snapshot=>{
    if(snapshot.metadata.hasPendingWrites)return;
    currentTeams=snapshot.docs.map(s=>({...s.data(),id:s.id}));
    const updated=displayDraw(rawDraw,currentTeams);
    if(JSON.stringify(updated?.teams)!==JSON.stringify(saved?.teams)){saved=updated;restore();}
  },()=>status('Impossible d’actualiser les noms des équipes. Recharge la page.',true));
  onSnapshot(doc(db,'events',EVENT_ID,'config','draw'),{includeMetadataChanges:true},snapshot=>{
    if(snapshot.metadata.hasPendingWrites)return;
    const data=snapshot.exists()?snapshot.data():{draw:null,revision:0};
    if(!Number.isInteger(data.revision)||data.revision<0||(data.draw!==null&&!valid(data.draw))){ready=false;restore();status('Le tableau enregistré est invalide.',true);return;}
    const changed=revision!==data.revision||JSON.stringify(saved?.slots)!==JSON.stringify(data.draw?.slots)||JSON.stringify(saved?.teams)!==JSON.stringify(displayDraw(data.draw,currentTeams)?.teams);
    rawDraw=data.draw;saved=displayDraw(rawDraw,currentTeams);revision=data.revision;ready=true;online=!snapshot.metadata.fromCache;
    if(running&&!changed&&online)return;
    restore(running&&changed?'Le tirage a été actualisé · voici le tableau enregistré.':undefined);
  },()=>{ready=false;restore();status('Impossible d’actualiser le tirage. Recharge la page une fois connecté.',true);});
}
restore();boot().catch(()=>{ready=false;restore();status('Impossible de charger le tirage. Recharge la page.',true);});
