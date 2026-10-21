export async function onRequest(c){
const key=c.env.FOOTBALL_API_KEY;
const headers={"Content-Type":"application/json","Access-Control-Allow-Origin":"*"};
try{
const url=new URL(c.request.url);
let filter=url.searchParams.get('filter')||'today';
let date=new Date();
if(filter==='yesterday') date.setDate(date.getDate()-1);
if(filter==='tomorrow') date.setDate(date.getDate()+1);

let dateStr=date.toISOString().split('T')[0]; // YYYY-MM-DD

let apiUrl=`https://www.live-football-api.com/api/v1/matches?api_key=${key}&date=${dateStr}`;
let r=await fetch(apiUrl);
let j=await r.json();

let arr=j.data||j.matches||[];
if(!Array.isArray(arr)) arr=[];

let matches=arr.map(m=>({
time:(m.kickoff_time||m.time||'').toString().slice(0,5),
homeTeam:m.home_team_name||m.home_team||'Home',
awayTeam:m.away_team_name||m.away_team||'Away',
league:(m.country_name||'')+' - '+(m.league_name||m.league||''),
status:(m.match_status||m.status||'scheduled').toLowerCase(),
ft_score:`${m.home_goals??m.home_score??0} - ${m.away_goals??m.away_score??0}`
}));

// LIVE filter
if(filter==='live'){
matches=matches.filter(x=>x.status.includes('live')||x.status.includes('inplay')||x.status.includes('1h')||x.status.includes('2h'));
}
// FINISHED filter
if(filter==='finished'){
matches=matches.filter(x=>x.status.includes('fin')||x.status.includes('ft')||x.status.includes('full'));
}

return new Response(JSON.stringify({matches,date:dateStr,total:matches.length,api_count:arr.length}),{headers});
}catch(e){
return new Response(JSON.stringify({matches:[],error:e.message}),{headers});
}
}
