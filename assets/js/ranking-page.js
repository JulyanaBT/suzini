import {displayDraw} from './team-display.mjs?v=20261002-1';
import {ranking} from './ranking-core.mjs?v=20261001-4';
import {EVENT_ID,valid} from './draw-core.mjs?v=20260930-3';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let rawDraw=null,currentTeams=[];
let draw=null,revision=0,results=null,drawReady=false,resultsReady=false,drawOnline=false,resultsOnline=false;
function render(){
  if(!$('rankingRows'))return;
  if(!drawReady||!resultsReady)return;
  const state=ranking(draw,revision,results);
  $('rankingTitle').textContent=state.complete?'Classement final':'Classement du tournoi';
  $('rankingStatus').textContent=(!drawOnline||!resultsOnline?'Hors connexion · dernières données disponibles. ': '')+`${state.validated}/12 matchs validés · ${state.placed}/8 places attribuées`;
  $('rankingStatus').classList.remove('error');
  $('rankingRows').innerHTML=state.rows.map(row=>`<li class="ranking-row ${row.team?'confirmed':'pending'} ${row.team&&row.place<=3?'podium place-'+row.place:''}"><span class="ranking-place" aria-label="${row.place===1?'1re':row.place+'e'} place">${row.team&&row.place<=3?['🥇','🥈','🥉'][row.place-1]:row.place}</span><div class="ranking-team"><strong>${row.team?esc(row.team.name):'À déterminer'}</strong><small>${row.team?'Place confirmée':esc(row.waiting)}</small></div>${row.team?'<span class="ranking-check" aria-label="Confirmée">✓</span>':''}</li>`).join('');
}
function error(message){$('rankingStatus').textContent=message;$('rankingStatus').classList.add('error');}
async function boot(){
  if(document.body.dataset.admin==='true'){
    const {requireAdmin}=await import('./admin-session.js');if(!requireAdmin())return;
  }
  const [{db},{doc,collection,onSnapshot}]=await Promise.all([import('./firebase.js'),import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')]);
  onSnapshot(collection(db,'events',EVENT_ID,'teams'),{includeMetadataChanges:true},snapshot=>{
    if(snapshot.metadata.hasPendingWrites)return;
    currentTeams=snapshot.docs.map(s=>({...s.data(),id:s.id}));draw=displayDraw(rawDraw,currentTeams);render();
  },()=>error('Impossible d’actualiser les noms des équipes. Recharge la page.'));
  onSnapshot(doc(db,'events',EVENT_ID,'config','draw'),{includeMetadataChanges:true},snapshot=>{
    if(snapshot.metadata.hasPendingWrites)return;
    const data=snapshot.exists()?snapshot.data():{draw:null,revision:0};
    if((data.draw!==null&&!valid(data.draw))||!Number.isInteger(data.revision)){drawReady=false;error('Le tirage enregistré est invalide.');return;}
    rawDraw=data.draw;draw=displayDraw(rawDraw,currentTeams);revision=data.revision;drawReady=true;drawOnline=!snapshot.metadata.fromCache;render();
  },()=>{drawReady=false;error('Impossible de charger le tirage. Recharge la page une fois connecté.');});
  onSnapshot(doc(db,'events',EVENT_ID,'config','results'),{includeMetadataChanges:true},snapshot=>{
    if(snapshot.metadata.hasPendingWrites)return;
    const data=snapshot.exists()?snapshot.data():null;
    if(data&&(data.version!==1||!data.results||typeof data.results!=='object'||Array.isArray(data.results))){resultsReady=false;error('Les résultats enregistrés sont invalides.');return;}
    results=data;resultsReady=true;resultsOnline=!snapshot.metadata.fromCache;render();
  },()=>{resultsReady=false;error('Impossible d’actualiser les résultats. Recharge la page une fois connecté.');});
}
boot().catch(()=>error('Impossible de charger le classement. Réessaie une fois connecté.'));
