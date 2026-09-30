import {EVENT_ID} from './draw-core.mjs?v=20260930-3';
// The primary links remain available even when Firestore is unreachable.
async function boot(){
  const [{db},{doc,onSnapshot}]=await Promise.all([import('./firebase.js'),import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')]);
  onSnapshot(doc(db,'events',EVENT_ID,'config','status'),snapshot=>{
    const state=snapshot.exists()?snapshot.data().state:null;
    const badge=document.getElementById('tournamentState');
    if(badge)badge.textContent=state==='finished'?'🏁 Tournoi terminé · Retrouvez les résultats':state==='live'?'🎾 Tournoi en cours':'🎾 Programmation disponible';
  },()=>{});
}
boot().catch(()=>{});
