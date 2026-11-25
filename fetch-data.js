// Builds the data file for a template from live data. NEVER invents numbers:
// if anything is missing it throws, so nothing wrong gets posted.
// Usage: node fetch-data.js open|close [--check]
const fs = require("fs"), path = require("path"), cfg = require("./config");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const IST = { timeZone: "Asia/Kolkata" };
const istDate = d => new Intl.DateTimeFormat("en-CA", IST).format(d); // YYYY-MM-DD
const getJSON = async (url, headers = {}) => {
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json", ...headers }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(url + " -> HTTP " + r.status);
  return r.json();
};
async function yahoo(sym, range, interval) {
  const u = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=${interval}`;
  const j = await getJSON(u), res = j.chart && j.chart.result && j.chart.result[0];
  if (!res) throw new Error("no Yahoo data for " + sym);
  const q = res.indicators.quote[0], ts = res.timestamp || [];
  const rows = ts.map((t, i) => ({ t: t * 1000, o: q.open[i], h: q.high[i], l: q.low[i], c: q.close[i] })).filter(r => r.c != null);
  return { meta: res.meta, rows };
}
const r2 = x => Math.round(x * 100) / 100;

// NSE drops connections now and then, so retry. The homepage cookie is optional:
// a failed homepage request must not stop the data request.
async function nseIndices(today) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      let cookie = "";
      if (attempt % 2 === 0) {
        try {
          const h = await fetch("https://www.nseindia.com/", { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
          cookie = (h.headers.getSetCookie ? h.headers.getSetCookie() : []).map(c => c.split(";")[0]).join("; ");
        } catch (e) { console.warn("NSE homepage failed:", e.message); }
      }
      const j = await getJSON("https://www.nseindia.com/api/allIndices", { Referer: "https://www.nseindia.com/", ...(cookie ? { Cookie: cookie } : {}) });
      // Never accept another day's numbers. NSE timestamps look like "25-Nov-2026 15:30".
      const stamp = new Date(String(j.timestamp).slice(0, 11).replace(/-/g, " ") + " 12:00 GMT+0530");
      if (Number.isNaN(stamp.getTime()) || istDate(stamp) !== today) throw new Error("NSE data is not from today: " + j.timestamp);
      return Object.fromEntries(j.data.map(d => [d.index.toUpperCase(), d]));
    } catch (e) {
      console.warn(`NSE feed attempt ${attempt} failed:`, e.message, (e.cause && e.cause.code) || "");
      await new Promise(r => setTimeout(r, 3000 * attempt));
    }
  }
  return {};
}

(async () => {
  const mode = process.argv[2], check = process.argv.includes("--check");
  if (!["open", "close"].includes(mode)) throw new Error("mode must be open|close");
  const now = new Date(), today = istDate(now);

  // --- main indices (+ market-holiday detection: last traded date must be today) ---
  const daily = {}, intra = {};
  for (const k of ["sensex", "nifty"]) {
    daily[k] = await yahoo(cfg.indices[k].yahoo, "10d", "1d");
    intra[k] = await yahoo(cfg.indices[k].yahoo, "1d", mode === "close" ? "15m" : "1m");
  }
  const lastTrade = istDate(new Date(intra.nifty.meta.regularMarketTime * 1000));
  if (lastTrade !== today) { console.log(`HOLIDAY_OR_NO_TRADING (last trade ${lastTrade}, today ${today})`); fs.writeFileSync("skip.flag", "holiday"); return; }

  const build = k => {
    const rows = intra[k].rows, first = rows[0], last = rows[rows.length - 1];
    const days = daily[k].rows.filter(r => istDate(new Date(r.t)) < today);
    const prev = days[days.length - 1];
    if (!first || !prev) throw new Error("incomplete data for " + k);
    const value = r2(last.c), change = r2(value - prev.c), out = { value, change, percent: r2(change / prev.c * 100), open: r2(first.o ?? first.c) };
    if (mode === "close") {
      out.high = r2(Math.max(...rows.map(r => r.h))); out.low = r2(Math.min(...rows.map(r => r.l)));
      out.spark = rows.map(r => r2(r.c));
    }
    return { out, prev };
  };
  const sx = build("sensex"), nf = build("nifty");
  const prevDate = new Date(daily.nifty.rows.filter(r => istDate(new Date(r.t)) < today).pop().t);
  const fmt = (o) => new Intl.DateTimeFormat("en-GB", { ...IST, ...o }).format(now);
  const timeStr = new Intl.DateTimeFormat("en-US", { ...IST, hour: "numeric", minute: "2-digit", hour12: true }).format(now);

  // --- sectors: NSE first, Yahoo second; any gap = abort (no fake zeros) ---
  const nse = await nseIndices(today), sectors = {}, missing = [];
  for (const [name, s] of Object.entries(cfg.sectors)) {
    let pct = null;
    const d = nse[(s.nse || "").toUpperCase()];
    if (d && d.percentChange != null) pct = +d.percentChange;
    else if (s.yahoo) { try { const y = await yahoo(s.yahoo, "5d", "1d"); const rr = y.rows; if (rr.length >= 2 && istDate(new Date(rr[rr.length - 1].t)) === today) pct = (rr[rr.length - 1].c / rr[rr.length - 2].c - 1) * 100; } catch (e) {} }
    if (pct == null || Number.isNaN(pct)) missing.push(name); else sectors[name] = r2(pct);
  }
  if (missing.length) throw new Error("No data for sectors: " + missing.join(", ") + " — fix config.js");

  const data = {
    date: fmt({ day: "2-digit", month: "short", year: "numeric" }).toUpperCase().replace(/,/g, ""),
    time: timeStr + " IST",
    sensex: sx.out, nifty: nf.out, sectors,
    previousClose: { day: new Intl.DateTimeFormat("en-GB", { ...IST, weekday: "long", day: "numeric", month: "long" }).format(prevDate).replace(",", ""),
                     sensex: r2(sx.prev.c), nifty: r2(nf.prev.c) },
    source: "Source: NSE, BSE.",
    disclaimer: "Educational information only. Not investment advice or a recommendation. I am not a SEBI-registered Investment Adviser or Research Analyst. Data may be delayed; verify on NSE/BSE.",
    brand: "RUPAYI TELUGU",
  };
  if (mode === "open") {
    data.showUS = true;
    for (const k of ["dowjones", "nasdaq"]) {
      const d = await yahoo(cfg.indices[k].yahoo, "5d", "1d"), rr = d.rows, v = r2(rr[rr.length - 1].c), p = rr[rr.length - 2].c;
      data[k] = { value: v, change: r2(v - p), percent: r2((v / p - 1) * 100) };
    }
  } else {
    // Gold & silver: international futures in US$/oz (Yahoo). NOT the MCX rupee price - see AUTOMATION.md.
    data.showUS = true;
    for (const [k, unit] of [["gold", "US$/oz"], ["silver", "US$/oz"]]) {
      const d = await yahoo(cfg.indices[k].yahoo, "5d", "1d"), rr = d.rows, v = r2(rr[rr.length - 1].c), p = rr[rr.length - 2].c;
      data[k] = { value: v, change: r2(v - p), percent: r2((v / p - 1) * 100), unit };
    }
  }

  const file = path.join(__dirname, mode === "open" ? "data.js" : "data-close.js");
  if (!check) fs.writeFileSync(file, "const MARKET_DATA = " + JSON.stringify(data, null, 2) + ";\n");
  console.log(JSON.stringify(data, null, 2).slice(0, 1500));
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
