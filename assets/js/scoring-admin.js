import { scoreDocument } from './score-values.mjs?v=20260930-4';
import { schedule, drawKey } from './schedule-core.mjs?v=20260930-4';
import { blankLive, liveValid, wins, scoreText, reduceScore, matchStateKey } from './scoring-core.mjs?v=20260930-4';
import { isAdminConnected } from './admin-session.js';
import { runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);

export function createScoring({db,drawRef,resultsRef,getContext,onUpdate,onSaved}){
  let busy=false,notice='',error=false,ticket=null;
  const context=()=>{
    const c=getContext(),key=drawKey(c.draw,c.drawRevision);
    return {...c,key,state:c.document?.drawKey===key?c.document:{results:{},live:{}}};
  };
  function render(){
    if(!$('resultsMatches'))return;
    const c=context(),matches=schedule(c.draw,c.state.results),locked=busy||!c.ready||!c.key;
    const focused=document.activeElement;
    const focusAction=focused?.dataset?.scoreAction,focusMatch=focused?.dataset?.match,focusTeam=focused?.dataset?.team;
    $('scoreNotice').textContent=notice||(!c.ready?'Chargement des résultats…':!c.key?'Termine le tirage avant de commencer la saisie.':'Chaque modification est enregistrée.');
    $('scoreNotice').classList.toggle('error',error);
    $('resultsMatches').innerHTML=matches.map(match=>{
      const waiting=match.participants.some(p=>p.pending),stored=c.state.live?.[match.id];
      const invalid=!!stored&&!liveValid(stored,match),live=stored&&!invalid?stored:blankLive(match);
      const complete=!invalid&&wins(live.sets).includes(2);
      const disabled=locked||waiting||invalid;
      const button=(action,label,extra='',off=false)=>`<button type="button" class="score-button ${extra}" data-score-action="${action}" data-match="${match.id}" ${disabled||off?'disabled':''}>${label}</button>`;
      const history=(match.result?.sets||live.sets).map((pair,i)=>`<span class="set-chip">${i===2?'STB':`Set ${i+1}`} · ${scoreText([pair])}</span>`).join('');
      return `<article class="score-card court-${match.court}" aria-label="${esc(match.title)}">
        <header class="score-card-head"><strong>${esc(match.title)}</strong><span>${Math.floor(match.start/60)} h ${String(match.start%60).padStart(2,'0')}</span></header>
        <p class="match-court">${esc(match.courtName)}</p>
        ${history?`<div class="set-history">${history}</div>`:''}
        <p class="current-set">${match.result?'Match validé':waiting?'En attente des matchs précédents':invalid?'Saisie invalide':complete?'Deux sets gagnés · résultat à confirmer':live.sets.length===2?'Super tie-break en cours':`Set ${live.sets.length+1} en cours`}</p>
        ${match.participants.map((p,i)=>`<div class="score-team-row"><strong>${esc(p.name)}${match.result?.winnerId===p.id?' ✓':''}</strong>${!match.result&&!waiting&&!invalid?`<div class="score-stepper"><button type="button" data-score-action="minus" data-match="${match.id}" data-team="${i}" aria-label="Retirer un point à ${esc(p.name)}" ${disabled||complete||live.current[i]===0?'disabled':''}>−</button><output aria-label="Score de ${esc(p.name)}">${complete?wins(live.sets)[i]:live.current[i]}</output><button type="button" data-score-action="plus" data-match="${match.id}" data-team="${i}" aria-label="Ajouter un point à ${esc(p.name)}" ${disabled||complete||live.current[i]===99?'disabled':''}>+</button></div>`:''}</div>`).join('')}
        <div class="score-actions">${match.result?button('reopen','Corriger','secondary'):waiting||invalid?'':complete?button('review','Valider le résultat')+button('undoSet','Reprendre le dernier set','secondary'):button('validateSet','Valider le set','',live.current[0]===live.current[1])+ (live.sets.length?button('undoSet','Reprendre le set précédent','secondary',live.current.some(n=>n!==0)):'')}</div>
      </article>`;
    }).join('');
    if(focusAction){
      const selector=`[data-score-action="${focusAction}"][data-match="${focusMatch}"]${focusTeam!==undefined?`[data-team="${focusTeam}"]`:''}`;
      $('resultsMatches').querySelector(selector)?.focus({preventScroll:true});
    }
    if($('scoreDialog').open){
      const unchanged=ticket&&ticket.drawKey===c.key&&ticket.matchKey===matchStateKey(c.state,ticket.id);
      $('scoreDialogConfirm').disabled=busy||!c.ready||!unchanged;
      $('scoreDialogCancel').disabled=busy;
      if(!unchanged)$('scoreDialogError').textContent='Le score a changé sur un autre appareil. Reviens au score avant de confirmer.';
    }
  }
  function review(id){
    const c=context(),match=schedule(c.draw,c.state.results).find(m=>m.id===id),live=c.state.live[id];
    if(!c.ready||!liveValid(live,match)||!wins(live.sets).includes(2))return;
    const winner=match.participants[wins(live.sets)[0]===2?0:1];
    ticket={id,drawKey:c.key,matchKey:matchStateKey(c.state,id)};
    $('scoreDialogSummary').innerHTML=`<p>${esc(match.title)}</p><p class="score-winner">🏆 ${esc(winner.name)}</p><p>Score des sets, dans l’ordre des équipes ci-dessous :</p><p>${esc(match.participants[0].name)} / ${esc(match.participants[1].name)}</p><strong class="score-summary">${esc(scoreText(live.sets))}</strong>`;
    $('scoreDialogError').textContent='';$('scoreDialogConfirm').disabled=false;$('scoreDialogCancel').disabled=false;
    if(!$('scoreDialog').open)$('scoreDialog').showModal();
    $('scoreDialogConfirm').focus();
  }
  async function act(id,action,expected=ticket){
    const c=context();if(busy||!c.ready||!c.key)return;
    const expectedKey=action.type==='confirm'?expected?.matchKey:matchStateKey(c.state,id);
    const expectedDraw=action.type==='confirm'?expected?.drawKey:c.key;
    busy=true;notice='Enregistrement…';error=false;render();
    try{
      if(!isAdminConnected())throw Error('Reconnecte-toi à l’administration.');
      const saved=await runTransaction(db,async transaction=>{
        const [drawSnapshot,resultSnapshot]=await Promise.all([transaction.get(drawRef),transaction.get(resultsRef)]);
        const d=drawSnapshot.exists()?drawSnapshot.data():null;
        if(!d||drawKey(d.draw,d.revision)!==expectedDraw)throw Error('Le tirage a changé. Recharge la page.');
        const raw=resultSnapshot.exists()?scoreDocument(resultSnapshot.data()):null;
        const state=raw?.drawKey===expectedDraw?raw:{results:{},live:{}};
        if(matchStateKey(state,id)!==expectedKey)throw Error('Ce score a changé sur un autre appareil. Vérifie le score affiché avant de réessayer.');
        const updated=reduceScore(d.draw,d.revision,state,id,action);
        const output={version:1,drawKey:expectedDraw,revision:(Number.isInteger(raw?.revision)?raw.revision:0)+1,...updated};
        transaction.set(resultsRef,{...scoreDocument(output,true),updatedAt:serverTimestamp()});return output;
      });
      onSaved(saved);
      notice=action.type==='confirm'?'Résultat du match validé.':action.type==='validateSet'?'Set validé.':action.type==='reopen'?'Résultat rouvert : corrige puis valide à nouveau.':'Score enregistré.';
      if(action.type==='confirm'){$('scoreDialog').close();ticket=null;}
      busy=false;onUpdate();render();
      if(action.type==='validateSet')review(id);
    }catch(e){
      notice=e.code==='permission-denied'?'Firestore refuse l’enregistrement. Le score n’a pas été modifié.':e.code==='unavailable'?'Connexion interrompue. Réessaie une fois connecté.':e.message;
      error=true;busy=false;render();
      if($('scoreDialog').open)$('scoreDialogError').textContent=notice;
    }
  }
  $('resultsMatches').onclick=event=>{
    const button=event.target.closest('button[data-score-action]');if(!button||button.disabled)return;
    const {scoreAction:type,match:id,team}=button.dataset;
    if(type==='review'){review(id);return;}
    if(type==='reopen'&&!confirm('Reprendre le dernier set de ce match ? Le résultat sera retiré jusqu’à sa nouvelle validation.'))return;
    const action=type==='plus'||type==='minus'?{type:'adjust',team:Number(team),delta:type==='plus'?1:-1}:{type};
    void act(id,action);
  };
  $('scoreDialogConfirm').onclick=()=>{if(ticket&&!$('scoreDialogConfirm').disabled)void act(ticket.id,{type:'confirm'},ticket);};
  $('scoreDialogCancel').onclick=()=>{if(!busy)$('scoreDialog').close();};
  $('scoreDialog').addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  return {render};
}
