export async function onRequest(context) {
  const API_KEY = context.env.FOOTBALL_API_KEY;
  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };
  
  if (!API_KEY) {
    return new Response(JSON.stringify({ 
      matches: [
        {homeTeam:"Man City",awayTeam:"Arsenal",league:"Premier League",status:"FT",score:"2-1",ht_score:"1-0"},
        {homeTeam:"Barcelona",awayTeam:"Real Madrid",league:"LaLiga",status:"FT",score:"3-2",ht_score:"1-1"},
        {homeTeam:"Liverpool",awayTeam:"Chelsea",league:"Premier League",status:"FT",score:"1-0",ht_score:"0-0"}
      ],
      demo:true 
    }), { headers });
  }

  try {
    // Live matches
    let res = await fetch("https://api.live-football-api.com/matches?status=live", {
      headers: { "x-api-key": API_KEY }
    });
    let data = await res.json();
    let matches = data.data || data.matches || [];
    
    // Format to HT/FT
    let formatted = matches.map(m => ({
      homeTeam: m.homeTeam?.name || m.home?.name || m.homeTeam || "Home",
      awayTeam: m.awayTeam?.name || m.away?.name || m.awayTeam || "Away",
      league: m.league?.name || m.competition || "",
      status: m.status || m.time || "LIVE",
      score: (m.score ? `${m.score.home}-${m.score.away}` : m.ft_score) || "0-0",
      ht_score: m.ht_score || (m.halftime ? `${m.halftime.home}-${m.halftime.away}` : "0-0")
    }));

    // If no live, get today's finished for FULL TIME RESULTS tab
    if (formatted.length === 0) {
      let res2 = await fetch("https://api.live-football-api.com/matches?date=today", {
        headers: { "x-api-key": API_KEY }
      });
      let data2 = await res2.json();
      let m2 = data2.data || data2.matches || [];
      formatted = m2.map(m => ({
        homeTeam: m.homeTeam?.name || m.home?.name || "Home",
        awayTeam: m.awayTeam?.name || m.away?.name || "Away",
        league: m.league?.name || "",
        status: m.status || "FT",
        score: m.score ? `${m.score.home}-${m.score.away}` : (m.ft_score || "0-0"),
        ht_score: m.ht_score || (m.halftime ? `${m.halftime.home}-${m.halftime.away}` : "0-0")
      }));
    }

    return new Response(JSON.stringify({ matches: formatted }), { headers });
  } catch (e) {
    return new Response(JSON.stringify({ matches: [], error: e.message }), { headers });
  }
}
