import { planningKey, swapPlanning } from './planning-core.mjs?v=20261001-2';
import { isAdminConnected } from './admin-session.js';
import { runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

export function createPlanning({db,planningRef,getContext,onUpdate,onSaved}){
  let busy=false;
  const notice=document.getElementById('planningNotice');
  function message(text,error=false){notice.textContent=text;notice.classList.toggle('error',error);}
  document.getElementById('chronologicalMatches').addEventListener('click',async event=>{
    const button=event.target.closest('button[data-move]');
    const context=getContext();
    if(!button||button.disabled||busy||!context.ready)return;
    const id=button.dataset.match,direction=button.dataset.move;
    const expected=planningKey(context.positions);
    busy=true;message('Enregistrement…');onUpdate();
    try{
      if(!isAdminConnected())throw Error('Reconnecte-toi à l’administration.');
      const saved=await runTransaction(db,async transaction=>{
        const snapshot=await transaction.get(planningRef),raw=snapshot.exists()?snapshot.data():null;
        if(raw&&(raw.version!==1||!Number.isInteger(raw.revision)||!raw.positions))throw Error('Programmation enregistrée invalide.');
        if(planningKey(raw?.positions||{})!==expected)throw Error('La programmation a changé sur un autre appareil. Vérifie les nouveaux créneaux avant de réessayer.');
        const moved=swapPlanning(raw?.positions||{},id,direction);
        const output={version:1,revision:(raw?.revision||0)+1,positions:moved.positions};
        transaction.set(planningRef,{...output,updatedAt:serverTimestamp()});return output;
      });
      onSaved(saved);message('Programmation enregistrée et publiée.');
    }catch(e){message(e.code==='permission-denied'?'Enregistrement refusé par Firestore. La programmation reste inchangée.':e.code==='unavailable'?'Connexion interrompue. Réessaie une fois connecté.':e.message,true);}
    finally{
      busy=false;onUpdate();
      document.querySelector(`#chronologicalMatches button[data-match="${id}"][data-move="${direction}"]`)?.focus({preventScroll:true});
    }
  });
  return {isBusy:()=>busy};
}
