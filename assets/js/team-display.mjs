import {publicTeam} from './draw-core.mjs?v=20260930-3';
// Refresh labels only. The saved draw, seeds, rankings and score identity stay fixed.
export function displayDraw(draw,teams=[]){
  if(!draw)return draw;
  const byId=new Map(teams.map(team=>[team.id,team]));
  return {...draw,teams:draw.teams.map(saved=>{
    const current=byId.get(saved.id);
    if(!current)return saved;
    const label=publicTeam(current);
    return {...saved,name:label.name,players:label.players};
  })};
}
