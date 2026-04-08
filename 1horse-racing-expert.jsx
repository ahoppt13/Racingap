import { useState, useEffect, useCallback } from "react";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const today = new Date().toLocaleDateString("en-GB", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});

async function callClaude(prompt, systemMsg) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemMsg || "You are a horse racing data assistant.",
      messages: [{ role: "user", content: prompt }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

function extractJSON(raw) {
  if (!raw) return null;
  let c = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "");
  try { const p = JSON.parse(c.trim()); if (Array.isArray(p)) return p; } catch {}
  const m = c.match(/\[[\s\S]*\]/);
  if (m) {
    try { return JSON.parse(m[0]); } catch {}
    try { return JSON.parse(m[0].replace(/,\s*([}\]])/g, "$1")); } catch {}
  }
  return null;
}

if (!document.getElementById("pf2")) {
  const fl = document.createElement("link"); fl.id = "pf2";
  fl.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
  fl.rel = "stylesheet"; document.head.appendChild(fl);
}

const C = {
  bg: "#0a0c10", card: "#12151c", cardHov: "#181c26", bdr: "#1e2330",
  acc: "#c8a44e", grn: "#34d399", red: "#f87171", org: "#fb923c",
  blu: "#60a5fa", pur: "#a78bfa", txt: "#e8e6e1", dim: "#8a8d96", mut: "#555a66",
};
const rc = (r) => r >= 8 ? C.grn : r >= 6 ? C.acc : r >= 4 ? C.org : C.red;
const rl = (r) => r >= 9 ? "STRONG" : r >= 7 ? "CONTENDER" : r >= 5 ? "IN MIX" : r >= 3 ? "OUTSIDER" : "LONGSHOT";

function Ring({ rating, size = 44 }) {
  const r = size / 2, n = r - 3, ci = 2 * Math.PI * n, col = rc(rating);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={r} cy={r} r={n} fill="none" stroke={C.bdr} strokeWidth={3} />
        <circle cx={r} cy={r} r={n} fill="none" stroke={col} strokeWidth={3}
          strokeDasharray={ci} strokeDashoffset={ci - (rating / 10) * ci} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Playfair Display", fontWeight: 900, fontSize: size * 0.38, color: col }}>{rating}</div>
    </div>
  );
}

function Badge({ children, color = C.acc }) {
  return <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 4,
    background: color + "18", color, fontSize: 10, fontWeight: 600, fontFamily: "JetBrains Mono",
    letterSpacing: 0.4, textTransform: "uppercase" }}>{children}</span>;
}

function HorseRow({ h }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)} style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 8,
      padding: "10px 12px", cursor: "pointer", borderLeft: `3px solid ${rc(h.rating || 5)}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {h.rating && <Ring rating={h.rating} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "Playfair Display", fontWeight: 700, fontSize: 14, color: C.txt }}>{h.name}</span>
            {h.rating && <Badge color={rc(h.rating)}>{rl(h.rating)}</Badge>}
          </div>
          <div style={{ fontFamily: "DM Sans", fontSize: 11, color: C.dim, marginTop: 2, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {h.jockey && <span>🏇 {h.jockey}</span>}
            {h.trainer && <span>🎯 {h.trainer}</span>}
            {h.odds && <span style={{ color: C.acc, fontWeight: 600 }}>💰 {h.odds}</span>}
            {h.form && <span style={{ fontFamily: "JetBrains Mono" }}>📊 {h.form}</span>}
          </div>
        </div>
      </div>
      {open && h.analysis && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.bdr}`,
          fontSize: 12, color: C.dim, lineHeight: 1.6 }}>{h.analysis}</div>
      )}
    </div>
  );
}

function RaceCard({ race }) {
  const [open, setOpen] = useState(false);
  const horses = [...(race.horses || [])].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const top = horses[0];
  return (
    <div style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 12, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{
        padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center",
        justifyContent: "space-between", background: open ? C.cardHov : "transparent" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: C.acc, fontWeight: 600 }}>{race.time}</span>
            <span style={{ fontFamily: "Playfair Display", fontWeight: 700, fontSize: 15, color: C.txt }}>{race.name}</span>
          </div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span>📍 {race.venue}</span>
            {race.distance && <span>📏 {race.distance}</span>}
            {race.going && <span>🌱 {race.going}</span>}
            {race.raceClass && <span>🏆 {race.raceClass}</span>}
            {race.runners && <span>🐎 {race.runners}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {top?.rating && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: C.mut, fontFamily: "JetBrains Mono" }}>TOP PICK</div>
              <div style={{ fontFamily: "Playfair Display", fontWeight: 700, color: rc(top.rating), fontSize: 12 }}>{top.name}</div>
            </div>
          )}
          <span style={{ color: C.dim, transform: open ? "rotate(180deg)" : "none", transition: "0.2s" }}>▾</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {horses.length ? horses.map((h, i) => <HorseRow key={i} h={h} />) :
            <p style={{ color: C.dim, fontSize: 12, padding: 8 }}>No runner details available.</p>}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("races");
  const [races, setRaces] = useState([]);
  const [reddit, setReddit] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingR, setLoadingR] = useState(false);
  const [phase, setPhase] = useState("");
  const [venue, setVenue] = useState("All");

  const log = useCallback((m, t = "info") => {
    const ts = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(p => [...p.slice(-40), { m, t, ts }]);
  }, []);

  const go = useCallback(async () => {
    setLoading(true); setLogs([]); setRaces([]); setPhase("meetings");
    log("Searching racingpost.com for today's meetings...");

    let meets = [];
    try {
      const raw = await callClaude(
        `Search racingpost.com for today's horse racing fixtures (${today}). Find ALL meetings including UK, Ireland, and international (France, USA, Brazil, UAE, South Africa, Hong Kong, Australia, Japan, etc). Include meetings like Turf Paradise, Gavea, Meydan, etc if they are running today.

Return ONLY a JSON array — no other text at all:
[{"venue":"Ascot","country":"UK","going":"Good to Soft","races":7,"first":"13:15"}]`,
        `Extract horse racing fixture data. Return ONLY valid JSON. No markdown. No backticks. No explanation. Today is ${today}.`
      );
      meets = extractJSON(raw) || [];
      log(meets.length ? `Found ${meets.length} meetings` : "Parse failed — check log tab", meets.length ? "ok" : "err");
      if (!meets.length) console.log("RAW:", raw);
    } catch (e) { log("Meeting search failed: " + e.message, "err"); }

    if (!meets.length) {
      log("Trying simpler search...");
      try {
        const raw2 = await callClaude(
          `Go to racingpost.com and find every racecourse that has horse racing today ${today}. Return a JSON array of venue names and countries: [{"venue":"Name","country":"UK","races":6,"first":"13:00"}]. ONLY the JSON array, nothing else.`,
          "Return ONLY JSON arrays."
        );
        meets = extractJSON(raw2) || [];
        log(meets.length ? `Retry found ${meets.length} meetings` : "Still no data", meets.length ? "ok" : "err");
        if (!meets.length) console.log("RAW2:", raw2);
      } catch (e) { log("Retry failed: " + e.message, "err"); }
    }

    if (!meets.length) { setPhase("done"); setLoading(false); return; }

    // Fetch racecards
    setPhase("racecards");
    const allRaces = [];
    for (const mt of meets.slice(0, 8)) {
      log(`Loading ${mt.venue} racecard...`);
      try {
        const raw = await callClaude(
          `Search racingpost.com for today's racecard at ${mt.venue} (${today}). List every race and the runners.

Return ONLY a JSON array:
[{"time":"14:15","name":"Race Name","venue":"${mt.venue}","distance":"1m2f","going":"Good","raceClass":"Class 3","runners":8,"horses":[{"name":"Horse","jockey":"Jockey","trainer":"Trainer","odds":"3/1","form":"1-2-3","draw":4}]}]

ONLY JSON. No other text.`,
          "Return ONLY JSON arrays."
        );
        const p = extractJSON(raw) || [];
        if (p.length) { allRaces.push(...p); log(`${mt.venue}: ${p.length} races`, "ok"); }
        else {
          log(`${mt.venue}: no data parsed`, "err"); console.log(`RAW ${mt.venue}:`, raw);
          allRaces.push({ time: mt.first || "?", name: mt.venue + " Racing", venue: mt.venue, horses: [] });
        }
      } catch (e) { log(`${mt.venue}: ${e.message}`, "err"); }
      setRaces([...allRaces]);
    }

    // Rate horses
    setPhase("ratings");
    log("Generating ratings...");
    const rated = [];
    for (const race of allRaces) {
      if (!race.horses?.length) { rated.push(race); continue; }
      try {
        const hl = race.horses.map(h => `${h.name} (${h.odds||"?"}, form:${h.form||"?"})`).join("; ");
        const raw = await callClaude(
          `Rate these runners in ${race.time} ${race.name} at ${race.venue}. Going: ${race.going||"?"}. Distance: ${race.distance||"?"}.
Horses: ${hl}
Rate 1-10 (realistic: most 3-7, only standouts 8+). Return ONLY JSON:
[{"name":"Horse","rating":6,"analysis":"Brief analysis"}]`,
          "Return ONLY JSON."
        );
        const ratings = extractJSON(raw) || [];
        rated.push({
          ...race,
          horses: race.horses.map(h => {
            const r = ratings.find(x => x.name?.toLowerCase().trim() === h.name?.toLowerCase().trim());
            return { ...h, rating: r?.rating || 5, analysis: r?.analysis || "" };
          })
        });
        log(`Rated ${race.venue} ${race.time}`, "ok");
      } catch { rated.push(race); }
      setRaces([...rated, ...allRaces.slice(rated.length)]);
    }

    setRaces(rated);
    setPhase("done"); setLoading(false);
    log("Complete ✓", "ok");
  }, [log]);

  const goReddit = useCallback(async () => {
    setLoadingR(true);
    log("Scanning Reddit...");
    try {
      const raw = await callClaude(
        `Search Reddit for today's horse racing tips from r/HorseRacingUK, r/horseracing, r/HorseBetting, r/Sportsbook. Find posts from the last 24 hours about tips, NAPs, each-way picks, accumulators.

Return ONLY JSON:
[{"title":"Post title","sub":"HorseRacingUK","upvotes":"12","time":"3h ago","summary":"Key points","horses":["Horse A"]}]

Up to 10 posts. If none found return []. ONLY JSON.`,
        "Return ONLY JSON arrays."
      );
      const p = extractJSON(raw) || [];
      setReddit(p);
      log(`Reddit: ${p.length} posts`, p.length ? "ok" : "info");
    } catch (e) { log("Reddit: " + e.message, "err"); }
    setLoadingR(false);
  }, [log]);

  useEffect(() => { go(); goReddit(); }, []);

  const venues = ["All", ...new Set(races.map(r => r.venue).filter(Boolean))];
  const shown = venue === "All" ? races : races.filter(r => r.venue === venue);
  const picks = races
    .flatMap(r => (r.horses || []).filter(h => h.rating >= 7).map(h => ({ ...h, venue: r.venue, rt: r.time, rn: r.name })))
    .sort((a, b) => b.rating - a.rating).slice(0, 12);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.txt, fontFamily: "DM Sans,sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box;margin:0}
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-thumb{background:${C.bdr};border-radius:3px}`}</style>

      <div style={{ borderBottom: `1px solid ${C.bdr}`, padding: "14px 18px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h1 style={{ fontFamily: "Playfair Display", fontWeight: 900, fontSize: 24,
                background: `linear-gradient(135deg,${C.acc},#e8d5a0)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                🏇 PADDOCK INTEL
              </h1>
              <p style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{today}</p>
            </div>
            <button onClick={() => { go(); goReddit(); }} disabled={loading} style={{
              padding: "7px 14px", borderRadius: 8, border: `1px solid ${C.acc}`, background: "transparent",
              color: C.acc, fontSize: 12, fontWeight: 600, cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.5 : 1, fontFamily: "DM Sans" }}>⟳ Refresh</button>
          </div>
          <div style={{ display: "flex", gap: 3, marginTop: 12 }}>
            {[
              { id: "races", l: `Races (${races.length})`, i: "🏇" },
              { id: "picks", l: `Picks (${picks.length})`, i: "⭐" },
              { id: "reddit", l: `Reddit (${reddit.length})`, i: "💬" },
              { id: "log", l: "Log", i: "📡" },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "6px 12px", borderRadius: "6px 6px 0 0", border: "none",
                background: tab === t.id ? C.card : "transparent",
                color: tab === t.id ? C.acc : C.dim,
                fontSize: 11, fontWeight: 600, cursor: "pointer",
                borderBottom: tab === t.id ? `2px solid ${C.acc}` : "2px solid transparent",
              }}>{t.i} {t.l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "14px 18px" }}>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
            background: C.acc + "10", border: `1px solid ${C.acc}25`, borderRadius: 8, marginBottom: 12 }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${C.acc}`, borderTopColor: "transparent",
              borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.acc }}>
              {phase === "meetings" ? "Finding meetings..." : phase === "racecards" ? `Loading racecards (${races.length} so far)...` : "Rating runners..."}
            </span>
          </div>
        )}

        {tab === "races" && <>
          {venues.length > 2 && (
            <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
              {venues.map(v => (
                <button key={v} onClick={() => setVenue(v)} style={{
                  padding: "4px 11px", borderRadius: 16, border: `1px solid ${venue === v ? C.acc : C.bdr}`,
                  background: venue === v ? C.acc + "18" : "transparent",
                  color: venue === v ? C.acc : C.dim, fontSize: 11, fontWeight: 600, cursor: "pointer",
                }}>{v}</button>
              ))}
            </div>
          )}
          {!loading && !races.length && (
            <div style={{ textAlign: "center", padding: 36, color: C.dim }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🏇</div>
              <p>No races loaded. Check the 📡 Log tab for details.</p>
              <button onClick={go} style={{ marginTop: 10, padding: "7px 18px", borderRadius: 8,
                border: `1px solid ${C.acc}`, background: C.acc + "12", color: C.acc, cursor: "pointer", fontSize: 12 }}>
                Try Again</button>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {shown.map((r, i) => <RaceCard key={i} race={r} />)}
          </div>
        </>}

        {tab === "picks" && <>
          <div style={{ padding: "10px 14px", background: C.acc + "10", borderRadius: 8, marginBottom: 12,
            fontSize: 12, color: C.acc }}>⭐ Rated 7+/10 across all meetings</div>
          {!picks.length && <p style={{ color: C.dim, textAlign: "center", padding: 28, fontSize: 13 }}>
            {loading ? "Still loading..." : "No strong picks today."}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {picks.map((h, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 10,
                padding: "11px 14px", display: "flex", alignItems: "center", gap: 12,
                borderLeft: `3px solid ${rc(h.rating)}` }}>
                <Ring rating={h.rating} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "Playfair Display", fontWeight: 700, fontSize: 15, color: C.txt }}>{h.name}</div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
                    {h.rt} — {h.rn} @ {h.venue}
                    {h.odds && <span style={{ marginLeft: 8, color: C.acc, fontWeight: 600 }}>{h.odds}</span>}
                  </div>
                  {h.analysis && <p style={{ fontSize: 11, color: C.dim, marginTop: 4, lineHeight: 1.5 }}>{h.analysis}</p>}
                </div>
              </div>
            ))}
          </div>
        </>}

        {tab === "reddit" && <>
          <div style={{ padding: "10px 14px", background: C.pur + "10", borderRadius: 8, marginBottom: 12,
            fontSize: 12, color: C.pur }}>💬 r/HorseRacingUK · r/horseracing · r/HorseBetting · r/Sportsbook</div>
          {loadingR && <div style={{ display: "flex", gap: 8, padding: 14, alignItems: "center" }}>
            <div style={{ width: 14, height: 14, border: `2px solid ${C.pur}`, borderTopColor: "transparent",
              borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: 12, color: C.dim }}>Scanning...</span></div>}
          {!loadingR && !reddit.length && <p style={{ color: C.dim, textAlign: "center", padding: 28, fontSize: 13 }}>No recent posts found.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {reddit.map((p, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "11px 14px" }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: C.txt }}>{p.title}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 3, fontSize: 10, color: C.dim, fontFamily: "JetBrains Mono" }}>
                  <span style={{ color: C.pur }}>r/{p.sub}</span>
                  {p.upvotes && <span>⬆ {p.upvotes}</span>}
                  {p.time && <span>{p.time}</span>}
                </div>
                {p.summary && <p style={{ marginTop: 5, fontSize: 11, color: C.dim, lineHeight: 1.5 }}>{p.summary}</p>}
                {p.horses?.length > 0 && (
                  <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
                    {p.horses.map((h, j) => <Badge key={j} color={C.grn}>{h}</Badge>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>}

        {tab === "log" && (
          <div style={{ background: "#0d0f14", border: `1px solid ${C.bdr}`, borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 10, color: C.mut, fontFamily: "JetBrains Mono", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
              Debug Log — check browser console (F12) for raw API responses
            </div>
            {logs.map((l, i) => (
              <div key={i} style={{ fontSize: 11, fontFamily: "JetBrains Mono", padding: "2px 0", lineHeight: 1.5,
                color: l.t === "err" ? C.red : l.t === "ok" ? C.grn : C.dim }}>
                <span style={{ color: C.mut }}>{l.ts} </span>{l.m}
              </div>
            ))}
            {!logs.length && <p style={{ color: C.dim, fontSize: 12 }}>No logs yet — hit Refresh.</p>}
          </div>
        )}

        <div style={{ marginTop: 28, paddingTop: 10, borderTop: `1px solid ${C.bdr}`,
          fontSize: 10, color: C.mut, textAlign: "center" }}>
          ⚠️ AI-generated ratings for entertainment only. Not financial advice. Gamble responsibly. 🔞 18+
        </div>
      </div>
    </div>
  );
}
