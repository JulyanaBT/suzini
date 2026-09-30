import { schedule, time, DURATION } from './schedule-core.mjs?v=20260930-2';
import { EVENT_ID, valid } from './draw-core.mjs?v=20260930-3';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const admin = document.body.dataset.admin === 'true';
let displayedMatches = [];

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

function card(match) {
  return `<article style="--court-column:${match.court+1}" class="match-card court-${match.court} ${match.id === 'F' ? 'highlight' : ''}" data-match="${match.id}" aria-label="${esc(match.title)}">
    <div class="match-meta"><span class="match-id">${matchLabel(match)}</span><span class="match-time">${time(match.start)}</span></div>
    <div class="match-court court-label court-${match.court}">${esc(match.courtName)}</div>
    ${match.participants.map(p => `<div class="match-team ${p.pending ? 'pending' : ''}"><div><strong>${esc(p.name)}</strong></div>${p.seed ? `<span class="match-seed">TS ${p.seed}</span>` : ''}</div>`).join('')}
  </article>`;
}

function render(draw) {
  if (!$('mainTree')) return;
  const matches = schedule(draw);
  displayedMatches = matches;
  const byId = Object.fromEntries(matches.map(m => [m.id,m]));
  const round = (title, css, ids) => `<section class="schedule-round"><h3>${title}</h3><div class="schedule-round-body ${css}">${ids.map(id => card(byId[id])).join('')}</div></section>`;
  $('mainTree').innerHTML = round('Quarts de finale','quarters',['QF1','QF2','QF3','QF4']) + round('Demi-finales','semis',['DF1','DF2']) + round('Finale & 3e place','finals',['F','P3']);
  $('classificationTree').innerHTML = round('Classement 5–8','semis',['CL1','CL2']) + round('Places 5 et 7','finals',['P5','P7']);
  $('chronologicalMatches').innerHTML = [...new Set(matches.map(m => m.start))].map(start => `<section class="schedule-time-group"><h3 class="schedule-time-heading">${time(start)} <span>→ ${time(start+DURATION)}</span></h3><div class="schedule-court-grid">${matches.filter(m => m.start === start).map(card).join('')}</div></section>`).join('');
  requestAnimationFrame(drawConnections);
}

function selectTab(view, updateHash = true, focus = false) {
  const chrono = view === 'chronologique';
  for(const [id,selected] of [['Tableau',!chrono],['Chronologique',chrono]]) {
    const button = $(`tab${id}`);
    button.setAttribute('aria-selected',String(selected));
    button.tabIndex = selected ? 0 : -1;
    $(`panel${id}`).hidden = !selected;
    if(selected && focus)button.focus();
  }
  if(updateHash)history.replaceState(null,'',`#${chrono ? 'chronologique' : 'tableau'}`);
  if (!chrono) requestAnimationFrame(drawConnections);
}

async function boot() {
  if(admin){const {requireAdmin}=await import('./admin-session.js');if(!requireAdmin())return;}
  $('tabTableau').onclick=()=>selectTab('tableau');
  $('tabChronologique').onclick=()=>selectTab('chronologique');
  for(const id of ['tabTableau','tabChronologique'])$(id).onkeydown=event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const view=event.key==='Home'?'tableau':event.key==='End'?'chronologique':id==='tabTableau'?'chronologique':'tableau';
    selectTab(view,true,true);
  };
  window.addEventListener('hashchange',()=>selectTab(location.hash.slice(1),false));
  selectTab(location.hash.slice(1),false);
  render(null);
  const resizeObserver = new ResizeObserver(drawConnections);
  resizeObserver.observe($('mainTree'));
  resizeObserver.observe($('classificationTree'));
  const [{db},{doc,onSnapshot}]=await Promise.all([import('./firebase.js'),import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')]);
  onSnapshot(doc(db,'events',EVENT_ID,'config','draw'),{includeMetadataChanges:true},snapshot=>{
    if(!$('scheduleStatus')||snapshot.metadata.hasPendingWrites)return;
    const draw=snapshot.exists()?snapshot.data().draw:null;
    if(draw!==null&&!valid(draw)){
      render(null);
      $('scheduleStatus').textContent='Le tirage ne peut pas être lu. Les créneaux sont affichés sans les équipes.';
      $('scheduleStatus').classList.add('error');return;
    }
    render(draw);
    $('scheduleStatus').classList.remove('error');
    const count=draw?.slots.filter(Boolean).length||0;
    $('scheduleStatus').textContent=snapshot.metadata.fromCache?'Connexion en cours · les données seront actualisées dès la reconnexion.':count===8?'Tirage complet · les quarts de finale sont prêts.':count?`Tirage en cours · ${count}/8 équipes placées. Les quarts se complètent automatiquement.`:'Programme prévisionnel · les équipes apparaîtront au fur et à mesure du tirage.';
  },()=>{
    if(!$('scheduleStatus'))return;
    $('scheduleStatus').textContent='Impossible d’actualiser le tirage. Les horaires restent consultables ; recharge la page pour retrouver les équipes à jour.';
    $('scheduleStatus').classList.add('error');
  });
}
boot().catch(error=>{
  console.error('Programmation :',error);
  if($('scheduleStatus')){$('scheduleStatus').textContent='Impossible de charger les équipes. Vérifie ta connexion puis recharge la page.';$('scheduleStatus').classList.add('error');}
});
