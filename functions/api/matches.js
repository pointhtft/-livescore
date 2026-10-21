export async function onRequest(context) {
  const API_KEY = context.env.FOOTBALL_API_KEY;
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  if (!API_KEY) return new Response(JSON.stringify({ matches: [], error: "No API KEY" }), { headers });

  try {
    const url = new URL(context.request.url);
    let filter = url.searchParams.get('filter') || 'today';
    
    // DATE LOGIC: 3 days back, 4 days future
    let d = new Date();
    if (filter === 'yesterday') d.setDate(d.getDate()-1);
    if (filter === 'all' || filter === 'today') d.setDate(d.getDate());
    if (filter === 'tomorrow') d.setDate(d.getDate()+1);
    // If filter is like 18/10, 19/10 etc from UI
    if (filter.match(/\d{1,2}\/\d{1,2}/)) {
      let [day,mon] = filter.split('/')[0].split('/').length ? filter.replace(/[^0-9\/]/g,'').split('/') : [0,0];
      // fallback to today, real date is handled in frontend
    }
    // Allow frontend to pass YYYY-MM-DD directly
    let dateStr = /^\d{4}-\d{2}-\d{2}$/.test(filter) ? filter : d.toISOString().split('T')[0];

    // YOUR REAL ENDPOINT - from your screenshot
    const apiUrl = `https://www.live-football-api.com/api/v1/matches?api_key=${API_KEY}&date=${dateStr}&lang=en`;
    const res = await fetch(apiUrl);
    const json = await res.json();
    
    let raw = json.data || json.matches || json.result || [];

    let matches = raw.map(m => {
      let country = m.league?.country || m.competition?.country || m.country_name || m.country || 'World';
      let leagueName = m.league?.name || m.competition?.name || m.league_name || 'League';
      let time = m.time || m.kickoff_time || '';
      if (m.date && String(m.date).includes('T')) time = String(m.date).split('T')[1].substring(0,5);
      
      return {
        time: time || (m.status==='FT' ? 'FT' : ''),
        homeTeam: m.home_team || m.homeTeam?.name || m.home?.name || '',
        awayTeam: m.away_team || m.awayTeam?.name || m.away?.name || '',
        league: `${country} - ${leagueName}`, // COUNTRY + LEAGUE
        status: m.status || m.match_status || 'FT',
        minute: m.minute || m.live_minute || '',
        ft_score: m.score ? `${m.score.home}-${m.score.away}` : `${m.home_score ?? 0} - ${m.away_score ?? 0}`,
        ht_score: m.halftime_score ? `${m.halftime_score.home}-${m.halftime_score.away}` : (m.ht_score || '0-0')
      };
    }).filter(x=>x.homeTeam);

    // Frontend filter LIVE/FINISHED
    return new Response(JSON.stringify({ matches, date: dateStr }), { headers });

  } catch (e) {
    return new Response(JSON.stringify({ matches: [], error: e.message }), { headers });
  }
}
