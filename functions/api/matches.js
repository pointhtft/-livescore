export async function onRequest(context) {
  const API_KEY = context.env.FOOTBALL_API_KEY;
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  if (!API_KEY) return new Response(JSON.stringify({ matches: [], error: "No KEY" }), { headers });

  try {
    const url = new URL(context.request.url);
    let filter = url.searchParams.get('filter') || 'today';
    let dateStr = /^\d{4}-\d{2}-\d{2}$/.test(filter) ? filter : new Date().toISOString().split('T')[0];

    if (filter === 'yesterday') { let d=new Date(); d.setDate(d.getDate()-1); dateStr=d.toISOString().split('T')[0]; }
    if (filter === 'tomorrow') { let d=new Date(); d.setDate(d.getDate()+1); dateStr=d.toISOString().split('T')[0]; }
    if (filter === 'all') { let d=new Date(); dateStr=d.toISOString().split('T')[0]; }

    const apiUrl = `https://www.live-football-api.com/api/v1/matches?api_key=${API_KEY}&date=${dateStr}&lang=en`;
    const res = await fetch(apiUrl);
    const json = await res.json();
    
    let raw = json.data || json.matches || [];
    if (!Array.isArray(raw)) raw = [raw];

    let matches = raw.map(m => ({
      time: m.kickoff_local_time || m.kickoff_time || "",
      homeTeam: m.home_team_name || m.home_team || "",
      awayTeam: m.away_team_name || m.away_team || "",
      league: `${m.country_name || 'World'} - ${m.league_name || 'League'}`,
      status: m.match_status || m.status || 'finished',
      minute: m.minute || "",
      ft_score: `${m.home_goals ?? 0} - ${m.away_goals ?? 0}`,
      ht_score: `${m.half_time_home_goals ?? 0} - ${m.half_time_away_goals ?? 0}`
    })).filter(x=>x.homeTeam);

    return new Response(JSON.stringify({ matches, date: dateStr }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ matches: [], error: e.message }), { headers });
  }
}
