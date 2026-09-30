import {schedule,drawKey} from './schedule-core.mjs?v=20261001-2';
import {scoreDocument} from './score-values.mjs?v=20261001-2';
export function ranking(draw,revision,document){
  const key=drawKey(draw,revision);
  const results=key&&document?.drawKey===key?scoreDocument(document).results:{};
  const matches=schedule(draw,results),byId=Object.fromEntries(matches.map(m=>[m.id,m]));
  const rows=['F','P3','P5','P7'].flatMap((id,index)=>{
    const match=byId[id];
    return [true,false].map((winner,offset)=>{
      const team=match.result?match.participants.find(p=>(p.id===match.result.winnerId)===winner):null;
      return {place:index*2+offset+1,team,matchId:id,matchTitle:match.title,score:match.result?.score||null,waiting:`${winner?'Vainqueur':'Perdant'} ${id==='F'?'de la finale':`du match pour la ${id.slice(1)}e place`}`};
    });
  });
  return {rows,complete:rows.every(r=>r.team),placed:rows.filter(r=>r.team).length,validated:matches.filter(m=>m.result).length};
}
