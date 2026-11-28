// Live prices for the Indian indices and MCX bullion.
// Source: Groww's public website data. Yahoo's BSE feed runs ~15 minutes late
// (it posted a wrong Sensex close), so it is not used for these figures.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const GROWW = "https://groww.in";
const IDX = { sensex: ["BSE", "SENSEX"], nifty: ["NSE", "NIFTY"] };

const sleep = ms => new Promise(r => setTimeout(r, ms));
const istDate = d => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d); // YYYY-MM-DD
const istTime = d => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d); // HH:MM
const r2 = x => Math.round(x * 100) / 100;
const isNum = x => typeof x === "number" && Number.isFinite(x);

async function retry(label, fn, tries = 4, gap = 4000) {
  for (let i = 1; ; i++) {
    try { return await fn(); }
    catch (e) {
      console.warn(`${label}: attempt ${i} failed:`, e.message, (e.cause && e.cause.code) || "");
      if (i >= tries) throw new Error(`${label}: ${e.message}`);
      await sleep(gap * i);
    }
  }
}
async function get(url, as = "json") {
  const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(url + " -> HTTP " + r.status);
  return r[as]();
}

// ---------- Sensex / Nifty ----------
async function indexQuote(key) {
  const [ex, sym] = IDX[key];
  const q = await retry(key + " live", () => get(`${GROWW}/v1/api/stocks_data/v1/tr_live_indices/exchange/${ex}/segment/CASH/${sym}/latest`));
  for (const f of ["value", "close", "open", "high", "low", "tsInMillis"])
    if (!isNum(q[f]) || q[f] <= 0) throw new Error(`${key}: bad "${f}" in live data: ${q[f]}`);
  const at = new Date(q.tsInMillis < 1e12 ? q.tsInMillis * 1000 : q.tsInMillis); // the field is really in seconds
  const change = r2(q.value - q.close);
  return { value: r2(q.value), prevClose: r2(q.close), change, percent: r2(change / q.close * 100),
           open: r2(q.open), high: r2(q.high), low: r2(q.low), at };
}

// Waits until both indices carry today's data from at least `notBefore` (HH:MM IST).
// Returns null when the market has not traded today (holiday).
// For the close, two readings a minute apart must also agree, so a moving figure is never posted.
async function indexQuotes(today, notBefore, mustBeStable, tries = 12, gap = 60000) {
  let last = "";
  for (let i = 1; i <= tries; i++) {
    const q = { sensex: await indexQuote("sensex"), nifty: await indexQuote("nifty") };
    const all = Object.values(q);
    const fresh = all.every(x => istDate(x.at) === today && istTime(x.at) >= notBefore);
    const sig = all.map(x => x.value).join("/");
    if (fresh && (!mustBeStable || sig === last)) return q;
    last = fresh ? sig : "";
    console.log(`indices not ready (try ${i}): ` + all.map(x => `${x.value} @ ${istDate(x.at)} ${istTime(x.at)}`).join(", "));
    if (i < tries) await sleep(gap);
    else if (all.every(x => istDate(x.at) < today)) return null;
  }
  throw new Error("Index prices are not final/fresh - nothing posted");
}

// Today's 15-minute line for the close chart. Ends on the official value.
async function intradayLine(key, quote, today) {
  const [ex, sym] = IDX[key];
  return retry(key + " chart", async () => {
    const j = await get(`${GROWW}/v1/api/charting_service/v2/chart/delayed/exchange/${ex}/segment/CASH/${sym}/daily?intervalInMinutes=15&minimal=true`);
    const rows = (j.candles || []).map(([t, v]) => ({ at: new Date(t * 1000), v }))
      .filter(r => isNum(r.v) && istDate(r.at) === today && istTime(r.at) >= "09:15" && istTime(r.at) <= "15:30");
    if (rows.length < 20 || istTime(rows[rows.length - 1].at) < "15:00") throw new Error("intraday chart is incomplete (" + rows.length + " points)");
    return [quote.open, ...rows.map(r => r2(r.v)), quote.value];
  });
}

// ---------- MCX gold / silver (rupees) ----------
async function pageData(url) {
  const html = await get(url, "text");
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("page data not found at " + url);
  return JSON.parse(m[1]).props.pageProps.staticData;
}

// The live price of the most active contract (highest open interest) among the
// nearest expiries - this avoids showing a contract that is about to expire.
async function mcxPrice(asset, unit, now, maxAgeMin = 20) {
  const today = istDate(now);
  return retry("MCX " + asset, async () => {
    const list = (await pageData(`${GROWW}/commodities/filter?asset=${asset}`)).nameAndDetailsMap[asset] || [];
    const near = list.filter(c => c.symbol === asset && c.exchange === "MCX" && c.instrumentType === "FUTURE" && c.expiryDate >= today)
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)).slice(0, 3);
    if (!near.length) throw new Error("no open contracts listed");
    const quotes = [];
    for (const c of near) {
      const s = await pageData(`${GROWW}/commodities/futures/${c.searchId}`);
      if (!s.contractDetails || s.contractDetails.contractId !== c.contractId) throw new Error("wrong contract page for " + c.contractId);
      quotes.push({ ...c, live: s.livePriceDetails });
    }
    const best = quotes.sort((a, b) => (b.live.openInterest || 0) - (a.live.openInterest || 0))[0], q = best.live;
    for (const f of ["ltp", "close", "tsInMillis"])
      if (!isNum(q[f]) || q[f] <= 0) throw new Error(`bad "${f}" in live data: ${q[f]}`);
    const at = new Date(q.tsInMillis < 1e12 ? q.tsInMillis * 1000 : q.tsInMillis);
    if ((now - at) / 60000 > maxAgeMin) throw new Error(`price is stale (${istDate(at)} ${istTime(at)} IST)`);
    const change = r2(q.ltp - q.close), percent = r2(change / q.close * 100);
    if (Math.abs(percent) > 20) throw new Error("implausible move: " + percent + "%");
    const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(new Date(best.expiryDate + "T00:00:00Z")).toUpperCase();
    console.log(`MCX ${asset}: ${best.contractId} ${q.ltp} (prev ${q.close}) @ ${istDate(at)} ${istTime(at)}, OI ${q.openInterest}`);
    return { value: q.ltp, change, percent, unit: `${unit} · MCX ${month}` };
  });
}

module.exports = { indexQuotes, intradayLine, mcxPrice, retry, get, istDate, istTime, sleep, r2 };
