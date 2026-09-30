export const EVENT_ID = 'suzini-bt250-mixte-2026-10-02';
export function visible(t) {
  return !['deleted','cancelled','refused'].includes(t.status) && t.stby !== true && t.list !== 'wait';
}
function number(v) {
  if (v == null || String(v).trim() === '') return null;
  const n = Number(String(v).replace(',', '.').trim());
  return Number.isFinite(n) ? n : null;
}
export function rank(t) {
  const a = number((t.woman || t.player1)?.rank ?? t.p1Rank);
  const b = number((t.man || t.player2)?.rank ?? t.p2Rank);
  return a === null || b === null ? null : a + b;
}
export function compare(a,b) {
  const x = rank(a) ?? Infinity, y = rank(b) ?? Infinity;
  return (x === y ? 0 : x < y ? -1 : 1) || ((a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)) || a.id.localeCompare(b.id);
}
function short(p, fallback) {
  return [String(p?.prenom || fallback).trim(), p?.nom ? String(p.nom).trim().charAt(0).toUpperCase() + '.' : ''].filter(Boolean).join(' ');
}
export function publicTeam(t) {
  const players = [short(t.woman || t.player1,'Joueuse'),short(t.man || t.player2,'Joueur')];
  return { id:t.id, name:String(t.teamName || players.join(' & ')), players, rank:rank(t) };
}
// Firestore may return map fields in a different order. Compare explicit values,
// not the serialization order of the objects returned by the database.
export function teamFingerprint(list) {
  return JSON.stringify([...list]
    .sort((a,b) => a.id.localeCompare(b.id))
    .map(t => [t.id, t.name, t.players, t.rank ?? null]));
}
export function start(teams, seed1, seed2) {
  const ids = teams.map(t => t.id);
  if (ids.length !== 8 || new Set(ids).size !== 8) throw Error('Il faut exactement 8 équipes distinctes.');
  if (seed1 === seed2 || !ids.includes(seed1) || !ids.includes(seed2)) throw Error('Choisis deux têtes de série différentes.');
  return {version:1,eventId:EVENT_ID,teams:teams.map(publicTeam),seed1,seed2,slots:[seed2,null,null,null,null,null,null,seed1]};
}
export function valid(d) {
  if (!d || d.version !== 1 || d.eventId !== EVENT_ID || !Array.isArray(d.teams) || d.teams.length !== 8 || !Array.isArray(d.slots) || d.slots.length !== 8) return false;
  if (!d.teams.every(t => t && typeof t.id === 'string' && typeof t.name === 'string' && Array.isArray(t.players) && t.players.every(p => typeof p === 'string'))) return false;
  const ids = new Set(d.teams.map(t=>t.id)), used = d.slots.filter(x=>x!==null);
  if (!ids.has(d.seed1) || !ids.has(d.seed2)) return false;
  if (ids.size !== 8 || used.some(x=>!ids.has(x)) || new Set(used).size !== used.length || d.seed1 === d.seed2 || d.slots[0] !== d.seed2 || d.slots[7] !== d.seed1) return false;
  let empty = false;
  for (const id of d.slots.slice(1,7)) { if (id === null) empty = true; else if (empty) return false; }
  return true;
}
export function randomIndex(n) {
  const a = new Uint32Array(1), limit = Math.floor(4294967296 / n) * n;
  do { globalThis.crypto.getRandomValues(a); } while (a[0] >= limit);
  return a[0] % n;
}
export function next(d, choose = randomIndex) {
  if (!valid(d)) throw Error('Tirage invalide.');
  const line = d.slots.indexOf(null);
  if (line === -1) throw Error('Le tirage est terminé.');
  const remaining = d.teams.filter(t=>!d.slots.includes(t.id));
  const index = choose(remaining.length);
  if (!Number.isInteger(index) || index < 0 || index >= remaining.length) throw Error('Sélection invalide.');
  const slots = [...d.slots]; slots[line] = remaining[index].id;
  return {...d,slots};
}
export function matches(d) {
  return [0,1,2,3].map(i=>({id:`QF${i+1}`,round:'quarterfinal',team1Id:d.slots[i*2],team2Id:d.slots[i*2+1]}));
}
