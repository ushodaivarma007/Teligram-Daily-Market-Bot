// Builds the data file for a template from live data. NEVER invents numbers:
// if anything is missing it throws, so nothing wrong gets posted.
// Usage: node fetch-data.js open|close [--check]
const fs = require("fs"), path = require("path"), cfg = require("./config");
const live = require("./live");
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
  // TEST_NOW lets a past trading day be re-checked by hand; the workflow never sets it.
  const now = process.env.TEST_NOW ? new Date(process.env.TEST_NOW) : new Date(), today = istDate(now);

  // --- Sensex / Nifty: live figures; holiday if nothing traded today ---
  // The close must be stamped after 3:30 PM and unchanged between two readings.
  let idx = await live.indexQuotes(today, mode === "close" ? "15:30" : "09:15", mode === "close");
  if (!idx) { console.log(`HOLIDAY_OR_NO_TRADING (no trading on ${today})`); fs.writeFileSync("skip.flag", "holiday"); return; }

  // The close is posted only when NSE's own Nifty figure agrees, so a stale feed cannot slip through.
  let nse = await nseIndices(today);
  for (let i = 1; mode === "close"; i++) {
    const n = nse["NIFTY 50"];
    if (n && Math.abs(n.last - idx.nifty.value) < 0.05) { console.log(`Nifty close confirmed by NSE: ${n.last}`); break; }
    const seen = `NSE ${n && n.last}, live feed ${idx.nifty.value}`;
    if (i >= 8) throw new Error(`Nifty close not confirmed (${seen}) - nothing posted`);
    console.log(`waiting for NSE to agree (try ${i}): ${seen}`);
    await live.sleep(60000);
    idx = await live.indexQuotes(today, "15:30", true);
    nse = await nseIndices(today);
  }

  const build = async k => {
    const q = idx[k], out = { value: q.value, change: q.change, percent: q.percent, open: q.open };
    if (mode === "close") { out.high = q.high; out.low = q.low; out.spark = await live.intradayLine(k, q, today); }
    return out;
  };
  const sx = await build("sensex"), nf = await build("nifty");
  const at = process.env.TEST_NOW ? now : new Date(); // the moment the figures were read

  // Date of the previous session, for the label. Shown only if that day's close agrees.
  let prevDay = "Last session";
  try {
    const u = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cfg.indices.nifty.yahoo)}?range=10d&interval=1d`;
    const res = (await live.retry("previous day", () => getJSON(u))).chart.result[0], close = res.indicators.quote[0].close;
    const i = res.timestamp.map(t => istDate(new Date(t * 1000))).reduce((a, d, n) => (d < today ? n : a), -1);
    if (i >= 0 && close[i] != null && Math.abs(close[i] / idx.nifty.prevClose - 1) < 0.0005)
      prevDay = new Intl.DateTimeFormat("en-GB", { ...IST, weekday: "long", day: "numeric", month: "long" }).format(new Date(res.timestamp[i] * 1000)).replace(",", "");
    else console.warn("previous-day date could not be confirmed");
  } catch (e) { console.warn(e.message); }
  const fmt = (o) => new Intl.DateTimeFormat("en-GB", { ...IST, ...o }).format(now);
  const timeStr = new Intl.DateTimeFormat("en-US", { ...IST, hour: "numeric", minute: "2-digit", hour12: true }).format(at);

  // --- sectors: NSE first, Yahoo second; any gap = abort (no fake zeros) ---
  const sectors = {}, missing = [];
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
    sensex: sx, nifty: nf, sectors,
    previousClose: { day: prevDay, sensex: idx.sensex.prevClose, nifty: idx.nifty.prevClose },
    source: mode === "close" ? "Source: NSE, BSE, MCX." : "Source: NSE, BSE.",
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
    // Gold & silver: MCX rupee price at the moment of posting.
    data.showUS = true;
    data.gold = await live.mcxPrice("GOLD", "₹/10g", at);
    data.silver = await live.mcxPrice("SILVER", "₹/kg", at);
  }

  const file = path.join(__dirname, mode === "open" ? "data.js" : "data-close.js");
  if (!check) fs.writeFileSync(file, "const MARKET_DATA = " + JSON.stringify(data, null, 2) + ";\n");
  console.log(JSON.stringify(data, null, 2).slice(0, 1500));
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
