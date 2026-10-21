export async function onRequest(context) {
  const API_KEY = context.env.FOOTBALL_API_KEY;
  const headers = { 
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "No API_KEY set", matches: [] }), { headers });
  }

  try {
    const url = new URL(context.request.url);
    const filter = url.searchParams.get('filter') || 'yesterday';

    let date = 'today';
    if (filter === 'yesterday' || filter === '10-17') date = 'yesterday';
    if (filter === 'today' || filter === '10-18') date = 'today';

    // REAL ENDPOINT - API brings time + clubs by itself
    let apiUrl = `https://api.live-football-api.com/matches?date=${date}`;
    if (filter === 'live') apiUrl = `https://api.live-football-api.com/matches?status=live`;
    if (filter === 'finished') apiUrl = `https://api.live-football-api.com/matches?status=finished&date=${date}`;

    const res = await fetch(apiUrl, {
      headers: { "x-api-key": API_KEY }
    });

    const json = await res.json();
    const data = json.data || json.matches || [];

    // Let API do time + club - just forward it
    const matches = data.map(m => ({
      time: m.time || m.kickoff_time || m.start_time || (m.date ? m.date.split('T')[1]?.substring(0,5) : 'FT') || '',
      homeTeam: m.homeTeam?.name || m.home_team || m.home?.name || m.teams?.home || '',
      awayTeam: m.awayTeam?.name || m.away_team || m.away?.name || m.teams?.away || '',
      league: m.league?.name || m.competition || m.league_name || '',
      status: m.status || '',
      ft_score: m.scores?.ft ? `${m.scores.ft.home}-${m.scores.ft.away}` : m.score || m.ft_score || '',
      ht_score: m.scores?.ht ? `${m.scores.ht.home}-${m.scores.ht.away}` : m.ht_score || '',
      minute: m.minute || ''
    })).filter(x => x.homeTeam && x.awayTeam);

    return new Response(JSON.stringify({ matches }), { headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, matches: [] }), { headers });
  }
}
