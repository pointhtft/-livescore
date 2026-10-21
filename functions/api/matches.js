export async function onRequest(context) {
  const API_KEY = context.env.FOOTBALL_API_KEY;
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  if (!API_KEY) {
    return new Response(JSON.stringify({ matches: [], error: "Add FOOTBALL_API_KEY in Cloudflare Variables" }), { headers });
  }

  try {
    const url = new URL(context.request.url);
    let filter = url.searchParams.get('filter') || 'today';

    // BUILD DATE: 3 days back / 4 days future
    const today = new Date();
    let targetDate = new Date(today);

    if (filter === 'yesterday' || filter.includes('Yesterday') || filter === '20/10') {
      targetDate.setDate(today.getDate() - 1);
    } else if (filter === 'today' || filter === 'Today') {
      targetDate.setDate(today.getDate());
    } else if (filter === 'live' || filter === 'finished' || filter === 'all') {
      targetDate.setDate(today.getDate());
    } else if (filter.includes('/')) {
      // filter like 18/10 (-3) or 2026-10-21
      let parts = filter.split(' ')[0].split('/');
      if (parts.length === 2) {
        let day = parseInt(parts[0]);
        let month = parseInt(parts[1]) - 1;
        targetDate = new Date(today.getFullYear(), month, day);
      }
    }

    let dateStr = targetDate.toISOString().split('T')[0]; // 2026-10-21 format
    // If filter is -3 days etc
    if (filter === '18/10 (-3)') { let d=new Date(); d.setDate(d.getDate()-3); dateStr=d.toISOString().split('T')[0]; }
    if (filter === '19/10 (-2)') { let d=new Date(); d.setDate(d.getDate()-2); dateStr=d.toISOString().split('T')[0]; }

    // REAL ENDPOINT FROM YOUR SCREENSHOT
    const apiUrl = `https://www.live-football-api.com/api/v1/matches?api_key=${API_KEY}&date=${dateStr}&lang=en`;

    const res = await fetch(apiUrl);
    const json = await res.json();

    // Your API returns { data: [...] } or { matches: [...] } or array
    const raw = json.data || json.matches || json.result || (Array.isArray(json) ? json : []);

    if (!raw || raw.length === 0) {
      return new Response(JSON.stringify({ matches: [], info: `No matches for ${dateStr}`, raw: json }), { headers });
    }

    const matches = raw.map(m => {
      // Time from API
      let time = m.time || m.kickoff || m.start_time || '';
      if (m.date && m.date.includes('T')) time = m.date.split('T')[1].substring(0,5);
      if (!time && m.kickoff_time) time = m.kickoff_time.substring(0,5);
      
      // Country + League from API
      let country = m.league?.country || m.competition?.country || m.country || 'World';
      let leagueName = m.league?.name || m.competition?.name || m.league_name || 'League';
      let leagueFull = `${country} - ${leagueName}`;

      return {
        time: time || 'FT',
        homeTeam: m.home_team || m.homeTeam?.name || m.home?.name || m.teams?.home || '',
        awayTeam: m.away_team || m.awayTeam?.name || m.away?.name || m.teams?.away || '',
        league: leagueFull,
        status: m.status || m.match_status || 'FT',
        minute: m.minute || m.live_minute || '',
        ft_score: m.score ? `${m.score.home || 0} - ${m.score.away || 0}` : (m.ft_score || `${m.home_score||0} - ${m.away_score||0}`),
        ht_score: m.ht_score || (m.halftime_score ? `${m.halftime_score.home} - ${m.halftime_score.away}` : '0 - 0')
      };
    }).filter(x => x.homeTeam);

    return new Response(JSON.stringify({ matches }), { headers });

  } catch (e) {
    return new Response(JSON.stringify({ matches: [], error: e.message }), { headers });
  }
}
