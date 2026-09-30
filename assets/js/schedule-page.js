import { validatePlanning, moveLabel } from './planning-core.mjs?v=20261001-1';
import { scoreDocument } from './score-values.mjs?v=20261001-1';
import { schedule, time, DURATION, drawKey } from './schedule-core.mjs?v=20261001-1';
import { liveValid, wins, scoreText } from './scoring-core.mjs?v=20261001-1';
import { EVENT_ID, valid } from './draw-core.mjs?v=20260930-3';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const admin = document.body.dataset.admin === 'true';
let displayedMatches = [];
let currentDraw = null, drawRevision = 0, resultsDocument = null;
let drawReady = false, resultsReady = false, drawConnected = false, resultsConnected = false;
let controller = null, planningController=null;
let planningPositions={},planningReady=false,planningConnected=false,planningError=false;
function activeScores() { return resultsDocument?.drawKey === drawKey(currentDraw,drawRevision) ? resultsDocument : {results:{},live:{}}; }

function drawConnections() {
  for (const id of ['mainTree', 'classificationTree']) {
    const tree = $(id);
    if (!tree || !tree.offsetWidth) continue;
    tree.querySelector('.schedule-connections')?.remove();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('schedule-connections');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', String(tree.offsetWidth));
    svg.setAttribute('height', String(tree.offsetHeight));
    const bounds = tree.getBoundingClientRect();
    for (const match of displayedMatches) {
      const destination = tree.querySelector(`[data-match="${match.id}"]`);
      if (!destination) continue;
      match.sources.forEach((source,index) => {
        if (source.type === 'slot') return;
        const origin = tree.querySelector(`[data-match="${source.match}"]`);
        if (!origin) return;
        const a = origin.getBoundingClientRect();
        const b = destination.querySelectorAll('.match-team')[index].getBoundingClientRect();
        const x1 = a.right-bounds.left, y1 = a.top+a.height/2-bounds.top;
        const x2 = destination.getBoundingClientRect().left-bounds.left, y2 = b.top+b.height/2-bounds.top;
        const middle = (x1+x2)/2;
        const path = document.createElementNS(svg.namespaceURI, 'path');
        path.setAttribute('d', `M ${x1} ${y1} H ${middle} V ${y2} H ${x2}`);
        if (source.type === 'loser') path.setAttribute('stroke-dasharray', '4 4');
        svg.append(path);
      });
    }
    tree.prepend(svg);
  }
}

function matchLabel(match) {
  if (match.round === 'quarter') return 'Quart ' + match.id.slice(2);
  if (match.round === 'semi') return 'Demi ' + match.id.slice(2);
  if (match.round === 'classification') return 'Classement 5–8 · ' + match.id.slice(2);
  if (match.id.startsWith('P')) return match.id.slice(1) + 'e place';
  return 'Finale';
}

function card(match,editable=false) {
  const controls=editable?`<div class="planning-controls">${['up','court','down'].map(direction=>{
    const option=moveLabel(planningPositions,match.id,direction);
    return `<button type="button" data-move="${direction}" data-match="${match.id}" aria-label="${esc(option.label)}" title="${esc(option.label)}" ${!option.allowed||!planningReady||!planningConnected||planningController?.isBusy()?'disabled':''}>${direction==='up'?'↑':direction==='down'?'↓':match.court===0?'→':'←'}</button>`;
  }).join('')}</div>`:'';
  return `<article style="--court-column:${match.court+1}" class="match-card court-${match.court} ${match.id === 'F' ? 'highlight' : ''}" data-match="${match.id}" aria-label="${esc(match.title)}">
    <div class="match-meta"><span class="match-id">${matchLabel(match)}</span><span class="match-time">${time(match.start)}</span></div>
    <div class="match-court court-label court-${match.court}">${esc(match.courtName)}</div>
    ${match.participants.map(p => `<div class="match-team ${p.pending ? 'pending' : ''} ${match.result?.winnerId===p.id ? 'winner' : ''}"><div><strong>${esc(p.name)}</strong></div>${p.seed ? `<span class="match-seed">TS ${p.seed}</span>` : ''}</div>`).join('')}
    ${match.result ? `<div class="match-score">✓ ${esc(match.result.score)}</div>` : liveValid(activeScores().live?.[match.id],match) ? `<div class="match-score">${wins(activeScores().live[match.id].sets).includes(2) ? 'À confirmer' : 'En cours'} · ${esc(scoreText(activeScores().live[match.id].sets.concat(wins(activeScores().live[match.id].sets).includes(2)?[]:[activeScores().live[match.id].current])))}</div>` : ''}
    ${controls}
  </article>`;
}

function render(draw) {
  if (!$('chronologicalMatches')) return;
  const matches = schedule(draw,activeScores().results,planningPositions);
  displayedMatches = matches;
  const byId = Object.fromEntries(matches.map(m => [m.id,m]));
  const round = (title, css, ids) => `<section class="schedule-round"><h3>${title}</h3><div class="schedule-round-body ${css}">${ids.map(id => card(byId[id])).join('')}</div></section>`;
  if ($('mainTree')) $('mainTree').innerHTML = round('Quarts de finale','quarters',['QF1','QF2','QF3','QF4']) + round('Demi-finales','semis',['DF1','DF2']) + round('Finale & 3e place','finals',['F','P3']);
  if ($('classificationTree')) $('classificationTree').innerHTML = round('Classement 5–8','semis',['CL1','CL2']) + round('Places 5 et 7','finals',['P5','P7']);
  $('chronologicalMatches').innerHTML = [...new Set(matches.map(m => m.start))].sort((a,b)=>a-b).map(start => `<section class="schedule-time-group"><h3 class="schedule-time-heading">${time(start)} <span>→ ${time(start+DURATION)}</span></h3><div class="schedule-court-grid">${matches.filter(m => m.start === start).sort((a,b)=>a.court-b.court).map(m=>card(m,admin)).join('')}</div></section>`).join('');
  requestAnimationFrame(drawConnections);
  controller?.render();
}

const tabs = admin ? [['Chronologique','chronologique'],['Resultats','resultats']] : [['Tableau','tableau'],['Chronologique','chronologique']];
function selectTab(view,updateHash=true,focus=false){
  const selected=tabs.find(t=>t[1]===view)||tabs[0];
  for(const [id,key] of tabs){
    const active=key===selected[1],button=$('tab'+id);
    button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
    $('panel'+id).hidden=!active;if(active&&focus)button.focus();
  }
  if(updateHash)history.replaceState(null,'','#'+selected[1]);
  if(selected[1]==='tableau')requestAnimationFrame(drawConnections);
}
function notify(text,error=false){
  if(!$('scheduleStatus'))return;
  $('scheduleStatus').textContent=text;$('scheduleStatus').classList.toggle('error',error);
}
function refresh(){
  render(currentDraw);
  if(!planningReady){notify(planningError?'Impossible de charger la programmation enregistrée.':'Chargement de la programmation…',planningError);return;}
  if(!drawReady||!resultsReady)return;
  const count=currentDraw?.slots.filter(Boolean).length||0;
  notify(!drawConnected||!resultsConnected||!planningConnected?'Connexion en cours…':count===8?'Tirage complet · résultats actualisés.':count?`Tirage en cours · ${count}/8 équipes placées.`:'Programme prévisionnel · tirage à venir.');
}
async function boot(){
  if(admin){const {requireAdmin}=await import('./admin-session.js');if(!requireAdmin())return;}
  tabs.forEach(([id,key],index)=>{
    $('tab'+id).onclick=()=>selectTab(key);
    $('tab'+id).onkeydown=event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();selectTab(tabs[event.key==='Home'?0:event.key==='End'?1:1-index][1],true,true);
    };
  });
  window.addEventListener('hashchange',()=>selectTab(location.hash.slice(1),false));
  selectTab(location.hash.slice(1),false);render(null);
  const observer=new ResizeObserver(drawConnections);
  for(const id of ['mainTree','classificationTree'])if($(id))observer.observe($(id));
  const [{db},{doc,onSnapshot}]=await Promise.all([import('./firebase.js'),import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')]);
  const drawRef=doc(db,'events',EVENT_ID,'config','draw');
  const resultsRef=doc(db,'events',EVENT_ID,'config','results');
  const planningRef=doc(db,'events',EVENT_ID,'config','programming');
  if(admin){
    const {createPlanning}=await import('./planning-admin.js?v=20261001-1');
    planningController=createPlanning({db,planningRef,getContext:()=>({positions:planningPositions,ready:planningReady&&planningConnected}),onUpdate:refresh,onSaved:saved=>{planningPositions=saved.positions;refresh();}});
    const {createScoring}=await import('./scoring-admin.js?v=20261001-1');
    controller=createScoring({db,drawRef,resultsRef,getContext:()=>({draw:currentDraw,drawRevision,positions:planningPositions,document:resultsDocument,ready:planningReady&&drawReady&&resultsReady&&drawConnected&&resultsConnected}),onUpdate:refresh,onSaved:saved=>{if(saved.drawKey===drawKey(currentDraw,drawRevision)&&(resultsDocument?.revision||0)<=saved.revision){resultsDocument=saved;refresh();}}});
  }
  onSnapshot(planningRef,{includeMetadataChanges:true},snapshot=>{
    if(snapshot.metadata.hasPendingWrites)return;
    try{
      const data=snapshot.exists()?snapshot.data():null;
      if(data&&(data.version!==1||!Number.isInteger(data.revision)||!data.positions))throw Error('Programmation invalide.');
      planningPositions=validatePlanning(data?.positions||{});planningReady=true;planningError=false;planningConnected=!snapshot.metadata.fromCache;refresh();
    }catch(e){planningReady=false;planningError=true;refresh();}
  },()=>{planningReady=false;planningError=true;planningConnected=false;refresh();});
  onSnapshot(drawRef,{includeMetadataChanges:true},snapshot=>{
    if(snapshot.metadata.hasPendingWrites)return;
    const data=snapshot.exists()?snapshot.data():{draw:null,revision:0};
    if((data.draw!==null&&!valid(data.draw))||!Number.isInteger(data.revision)){
      drawReady=false;currentDraw=null;render(null);notify('Le tirage enregistré est invalide.',true);return;
    }
    currentDraw=data.draw;drawRevision=data.revision;drawReady=true;drawConnected=!snapshot.metadata.fromCache;refresh();
  },()=>{drawReady=false;render(currentDraw);notify('Impossible d’actualiser le tirage. Recharge la page une fois connecté.',true);});
  onSnapshot(resultsRef,{includeMetadataChanges:true},snapshot=>{
    if(snapshot.metadata.hasPendingWrites)return;
    const data=snapshot.exists()?snapshot.data():null;
    if(data&&(data.version!==1||typeof data.results!=='object'||!data.results||Array.isArray(data.results)||typeof data.live!=='object'||!data.live||Array.isArray(data.live))){
      resultsReady=false;resultsDocument=null;render(currentDraw);notify('Les résultats enregistrés sont invalides.',true);return;
    }
    resultsDocument=scoreDocument(data);resultsReady=true;resultsConnected=!snapshot.metadata.fromCache;refresh();
  },()=>{resultsReady=false;render(currentDraw);notify('Impossible de charger les résultats. Vérifie la connexion et les autorisations Firestore.',true);});
}
boot().catch(error=>{console.error('Programmation :',error);notify('Impossible de charger la programmation. Recharge la page une fois connecté.',true);});
