export async function onRequest(context) {
  const API_KEY = context.env.FOOTBALL_API_KEY;
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  if (!API_KEY) {
    return new Response(JSON.stringify({ matches: [] }), { headers });
  }

  try {
    const url = new URL(context.request.url);
    const filter = url.searchParams.get('filter') || 'today';
    let dateStr = filter;

    if (filter === 'today' || filter === 'yesterday' || filter === 'tomorrow' || filter === 'live' || filter === 'finished') {
      let d = new Date();
      if (filter === 'yesterday') d.setDate(d.getDate() - 1);
      if (filter === 'tomorrow') d.setDate(d.getDate() + 1);
      dateStr = d.toISOString().split('T')[0];
    }

    const apiUrl = `https://www.live-football-api.com/api/v1/matches?api_key=${API_KEY}&date=${dateStr}`;
    const res = await fetch(apiUrl);
    const json = await res.json();
    let raw = json.data || json.matches || [];
    if (!Array.isArray(raw)) raw = [raw];

    const matches = raw.map(m => ({
      time: m.kickoff_time || "",
      homeTeam: m.home_team_name || "Home",
      awayTeam: m.away_team_name || "Away",
      league: `${m.country_name || 'World'} - ${m.league_name || 'League'}`,
      status: (m.match_status || 'finished').toLowerCase(),
      ft_score: `${m.home_goals ?? 0} - ${m.away_goals ?? 0}`,
      ht_score: `${m.half_time_home_goals ?? 0} - ${m.half_time_away_goals ?? 0}`
    }));

    return new Response(JSON.stringify({ matches, date: dateStr }), { headers });

  } catch (e) {
    return new Response(JSON.stringify({ matches: [], error: e.message }), { headers });
  }
}
