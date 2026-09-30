import { EVENT_ID, visible, compare, publicTeam, teamFingerprint, start, next, valid, matches } from './draw-core.mjs?v=20260930-3';

const admin = document.body.dataset.admin === 'true';
// This reuses the site's existing UI session. Firestore rules remain the authority
// for writes; the local session flag must not be treated as server authentication.
async function boot() {
  if (admin) {
    const { requireAdmin } = await import('./admin-session.js');
    if (!requireAdmin()) return;
  }
  const [{ db }, firestore] = await Promise.all([
    import('./firebase.js'),
    import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js'),
  ]);
  const { collection, doc, onSnapshot, runTransaction, serverTimestamp } = firestore;
  const $ = id => document.getElementById(id);
  const drawRef = doc(db, 'events', EVENT_ID, 'config', 'draw');
  const teamsRef = collection(db, 'events', EVENT_ID, 'teams');
  let draw = null;
  let revision = 0;
  let teams = [];
  let drawReady = false;
  let teamsReady = false;
  let busy = false;
  let lastError = '';
  let changedTeamList = false;
  let serverConnected = false;
  let teamsConnected = false;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
  const fingerprint = teamFingerprint;

  function status(text, error = false) {
    if (!$('status')) return; // The maintenance screen may have replaced the page.
    $('status').textContent = text;
    $('status').classList.toggle('error', error);
  }

  function render() {
    if (!$('quarters')) return;
    const slots = draw?.slots || Array(8).fill(null);
    const count = slots.filter(Boolean).length;
    changedTeamList = !!draw && teamsReady && fingerprint(teams.map(publicTeam)) !== fingerprint(draw.teams);
    $('progress').value = count;
    $('progressText').textContent = `${count} équipes placées sur 8`;
    $('quarters').innerHTML = [0,1,2,3].map(q => `
      <div class="match"><div class="match-title">QF${q+1} · Lignes ${q*2+1}–${q*2+2}</div>
      ${[q*2,q*2+1].map(i => {
        const team = draw?.teams.find(t => t.id === slots[i]);
        const seed = team && (team.id === draw.seed1 ? 1 : team.id === draw.seed2 ? 2 : null);
        return `<div class="slot ${team ? '' : 'pending'} ${draw && i === slots.indexOf(null) ? 'active' : ''}">
          <span class="slot-number">${i+1}</span><div>
          <span class="slot-name">${team ? esc(team.name) : i === 0 ? 'Tête de série 2' : i === 7 ? 'Tête de série 1' : 'En attente du tirage'}</span>
          ${team ? `<span class="slot-players">${team.players.map(esc).join(' · ')}</span>` : ''}</div>
          ${seed ? `<span class="seed">TS ${seed}</span>` : ''}</div>`;
      }).join('')}</div>`).join('');

    if (admin) {
      $('preparation').hidden = false;
      $('seedControls').hidden = !!draw;
      $('seedHelp').hidden = !!draw;
      $('start').hidden = !!draw;
      const locked = busy || !drawReady || !teamsReady || !serverConnected || !teamsConnected;
      $('start').disabled = locked || teams.length !== 8 || $('seed1').value === $('seed2').value;
      $('seed1').disabled = $('seed2').disabled = locked;
      $('next').hidden = !draw || count === 8;
      $('next').disabled = locked || changedTeamList;
      $('next').textContent = busy ? 'Enregistrement…' : `Tirer la ligne ${slots.indexOf(null)+1}`;
      $('reset').hidden = !draw;
      $('reset').disabled = busy || !drawReady || !serverConnected;
      const remaining = draw ? draw.teams.filter(t => !slots.includes(t.id)) : teams.map(publicTeam);
      $('poolPanel').hidden = !remaining.length;
      $('poolTitle').textContent = draw ? `${remaining.length} équipe${remaining.length > 1 ? 's' : ''} à tirer` : `${remaining.length} équipes inscrites`;
      $('pool').innerHTML = remaining.map(t => `<span class="draw-chip">${esc(t.name)}</span>`).join('');
    }

    if (lastError) status(lastError, true);
    else if (busy) status('Enregistrement du tirage…');
    else if (!drawReady) status('Chargement du tableau…');
    else if (!serverConnected || (admin && !teamsConnected)) status('Connexion en cours. Le tableau affiché sera actualisé dès la reconnexion.');
    else if (admin && changedTeamList) status('Les équipes ou leurs classements ont changé depuis le début du tirage. Vérifie la liste ; rétablis-la ou efface le tirage pour repartir avec les équipes actuelles.', true);
    else if (draw) status(count === 8 ? 'Tirage terminé · Les quatre quarts de finale sont définis.' : `Tirage en cours · ${count}/8 équipes placées. Prochain tirage : ligne ${slots.indexOf(null)+1}.`);
    else if (!admin) status('Le tableau sera publié ici au fur et à mesure du tirage.');
    else if (!teamsReady) status('Chargement des équipes…');
    else if (teams.length !== 8) status(`${teams.length} équipes inscrites : il faut exactement 8 équipes pour démarrer. Ajuste la liste dans l’onglet Équipes.`, true);
    else status('8 équipes chargées. Vérifie les deux têtes de série, puis commence le tirage.');
  }

  // Fixed candidate before the transaction: retries never reroll a random choice.
  async function persist(candidate, expectedRevision, checkTeams) {
    if (busy) return;
    busy = true;
    lastError = '';
    render();
    try {
      const { isAdminConnected } = await import('./admin-session.js');
      if (!isAdminConnected()) throw Error('Session organisateur terminée. Reconnecte-toi.');
      await runTransaction(db, async transaction => {
        const snapshot = await transaction.get(drawRef);
        const currentRevision = snapshot.exists() ? snapshot.data().revision : 0;
        if (currentRevision !== expectedRevision) throw Error('Un autre appareil a modifié le tirage. Attends sa mise à jour avant de continuer.');
        if (checkTeams && candidate) {
          const currentTeams = await Promise.all(candidate.teams.map(t => transaction.get(doc(teamsRef, t.id))));
          const normalized = currentTeams.map(s => s.exists() ? { ...s.data(), id: s.id } : null);
          if (normalized.some(t => !t || !visible(t)) || fingerprint(normalized.map(publicTeam)) !== fingerprint(candidate.teams)) {
            throw Error('Une équipe a changé. Vérifie les équipes avant de continuer.');
          }
        }
        transaction.set(drawRef, {
          revision: expectedRevision + 1,
          draw: candidate ? { ...candidate, matches: matches(candidate) } : null,
          updatedAt: serverTimestamp(),
        });
      });
      // The listener is authoritative, but apply the committed version if it
      // has not arrived yet. Never overwrite a newer remote revision.
      if (revision <= expectedRevision) { draw = candidate; revision = expectedRevision + 1; }
    } catch (error) {
      console.error('Tirage :', error.code || error.message);
      lastError = error.code === 'permission-denied'
        ? 'Enregistrement refusé par Firestore. Le tableau n’a pas été modifié. Vérifie les autorisations de la base.'
        : error.code === 'unavailable'
          ? 'Connexion interrompue. Le tirage n’a pas été enregistré ; réessaie une fois connecté.'
          : error.message || 'Impossible d’enregistrer le tirage.';
    } finally {
      busy = false;
      render();
    }
  }

  if (admin) {
    $('seed1').onchange = $('seed2').onchange = render;
    $('start').onclick = () => {
      if ($('start').disabled) return;
      try { void persist(start(teams, $('seed1').value, $('seed2').value), revision, true); }
      catch (error) { lastError = error.message; render(); }
    };
    $('next').onclick = () => {
      if ($('next').disabled) return;
      try { void persist(next(draw), revision, true); }
      catch (error) { lastError = error.message; render(); }
    };
    $('reset').onclick = () => {
      if ($('reset').disabled || !confirm('Effacer le tirage pour tous les visiteurs et recommencer ? Cette action ne peut pas être annulée.')) return;
      void persist(null, revision, false);
    };
    onSnapshot(teamsRef, { includeMetadataChanges: true }, snapshot => {
      teams = snapshot.docs.map(s => ({ ...s.data(), id: s.id })).filter(visible).sort(compare);
      teamsReady = true;
      teamsConnected = !snapshot.metadata.fromCache;
      const first = $('seed1').value, second = $('seed2').value;
      for (const id of ['seed1','seed2']) {
        $(id).innerHTML = teams.map(t => {
          const p = publicTeam(t);
          return `<option value="${esc(t.id)}">${esc(p.name)} · poids ${p.rank ?? 'inconnu'}</option>`;
        }).join('');
      }
      $('seed1').value = teams.some(t => t.id === first) ? first : teams[0]?.id || '';
      $('seed2').value = teams.some(t => t.id === second) ? second : teams[1]?.id || '';
      render();
    }, () => {
      teamsReady = false;
      lastError = 'Impossible de charger les équipes. Vérifie ta connexion et les autorisations Firestore, puis recharge la page.';
      render();
    });
  }

  onSnapshot(drawRef, { includeMetadataChanges: true }, snapshot => {
    // Don't expose optimistic local writes as a saved public draw.
    if (snapshot.metadata.hasPendingWrites) return;
    const data = snapshot.exists() ? snapshot.data() : { revision: 0, draw: null };
    if (!Number.isInteger(data.revision) || data.revision < 0 || (data.draw !== null && !valid(data.draw))) {
      drawReady = false;
      lastError = 'Le tableau enregistré est invalide. Aucun nouveau tirage ne peut être effectué.';
      render();
      return;
    }
    draw = data.draw;
    revision = data.revision;
    drawReady = true;
    serverConnected = !snapshot.metadata.fromCache;
    render();
  }, () => {
    drawReady = false;
    lastError = 'Impossible de charger le tableau. Vérifie ta connexion et les autorisations Firestore, puis recharge la page.';
    render();
  });
  render();
}

boot().catch(error => {
  console.error('Chargement du tirage :', error);
  const status = document.getElementById('status');
  if (status) { status.textContent = 'Impossible de charger le tirage. Recharge la page lorsque la connexion est rétablie.'; status.classList.add('error'); }
});
