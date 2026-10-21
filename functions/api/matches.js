export async function onRequest(c){
const k=c.env.FOOTBALL_API_KEY;
const h={"Content-Type":"application/json","Access-Control-Allow-Origin":"*"};
try{
const u=new URL(c.request.url);
let f=u.searchParams.get('filter')||'today';
let d=new Date();
if(f=='yesterday')d.setDate(d.getDate()-1);
f=d.toISOString().split('T')[0];
let r=await fetch(`https://www.live-football-api.com/api/v1/matches?api_key=${k}&date=${f}`);
let j=await r.json();
let a=j.data||[];
let m=a.map(x=>({
time:x.kickoff_time||'',
homeTeam:x.home_team_name,
awayTeam:x.away_team_name,
league:x.country_name+' - '+x.league_name,
status:(x.match_status||'').toLowerCase(),
ft_score:`${x.home_goals??0} - ${x.away_goals??0}`,
ht_score:`${x.half_time_home_goals??0} - ${x.half_time_away_goals??0}`
}));
return new Response(JSON.stringify({matches:m}),{headers:h});
}catch(e){return new Response(JSON.stringify({matches:[]}),{headers:h});}
}
