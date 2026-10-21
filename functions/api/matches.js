export async function onRequest(c){
const k=c.env.FOOTBALL_API_KEY;
const h={"Content-Type":"application/json","Access-Control-Allow-Origin":"*"};
try{
const u=new URL(c.request.url);
let d=new Date();
let f=u.searchParams.get('filter')||'today';
if(f=='yesterday')d.setDate(d.getDate()-1);
let dateStr=d.toISOString().split('T')[0];
let res=await fetch(`https://www.live-football-api.com/api/v1/matches?api_key=${k}&date=${dateStr}`);
let data=await res.json();
let list=(data.data||[]).map(x=>({
time:(x.kickoff_time||'').slice(0,5),
homeTeam:x.home_team_name,
awayTeam:x.away_team_name,
league:x.country_name+' - '+x.league_name,
status:(x.match_status||'').toLowerCase(),
ft_score:`${x.home_goals??0} - ${x.away_goals??0}`
}));
return new Response(JSON.stringify({matches:list}),{headers:h});
}catch(e){return new Response(JSON.stringify({matches:[]}),{headers:h});}
}
