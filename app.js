// ===================== LOGIC: turns the data into the graphic =====================
const $ = id => document.getElementById(id);
const EXPORT_MODE = new URLSearchParams(location.search).has("export");

// Fixed layout (order + icons). Data only supplies the numbers.
const SECTORS = [
  ["Banking", "banking"], ["Financials", "financials"], ["IT", "it"], ["Auto", "auto"],
  ["Energy", "energy"], ["Pharma", "pharma"], ["FMCG", "fmcg"], ["Telecom", "telecom"],
  ["Metals", "metals"], ["Industrials", "industrials"], ["Realty", "realty"], ["Chemicals", "chemicals"],
  ["PSU", "psu"], ["Consumption", "consumption"], ["Infrastructure", "infrastructure"], ["Media", "media"],
];
const IS_CLOSE = window.TEMPLATE === "close";
const INDICES = [["sensex", "SENSEX"], ["nifty", "NIFTY 50"]];

/* ---------- formatting ---------- */
const num = v => (typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""))) || 0;
const sgn = n => (n > 0 ? "+" : n < 0 ? "−" : "");
const fInt = n => Math.round(Math.abs(n)).toLocaleString("en-IN");
const f2 = n => Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fPct = p => sgn(Math.round(p * 100)) + f2(p) + "%";
const fUS = n => Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });   // US indices use 1,234,567 grouping
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ---------- heatmap colour scale (thresholds from the brief) ---------- */
const HEAT = [
  { min:  1.50, bg: "#0b7a38" },     // +1.50% and above : dark, saturated green
  { min:  1.00, bg: "#1f9a4b" },     // +1.00 … +1.49    : medium green
  { min:  0.50, bg: "#6fcb8b" },     // +0.50 … +0.99    : light green
  { min:  0.01, bg: "#bfeacb" },     // +0.01 … +0.49    : very light green
  { min:  0.00, bg: "#8c95a3" },     //  0.00            : neutral grey
  { min: -0.49, bg: "#f6b9b9" },     // −0.01 … −0.49    : light red
  { min: -0.99, bg: "#e56d6d" },     // −0.50 … −0.99    : medium red
  { min: -1.49, bg: "#cf3030" },     // −1.00 … −1.49    : strong red
  { min: -Infinity, bg: "#8a1212" }, // −1.50 and below  : dark red
];
const heatColour = pct => { const p = Math.round(num(pct) * 100) / 100; return HEAT.find(h => p >= h.min).bg; };
function lum(hex) {
  return [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
}
const DARK = "#0a1228";
const textOn = bg => (1.05 / (lum(bg) + 0.05) >= (lum(bg) + 0.05) / (lum(DARK) + 0.05) ? "#ffffff" : DARK);

/* ---------- small SVG helpers ---------- */
const tri = (up, c) => `<svg viewBox="0 0 24 24"><path d="${up ? "M12 4 22 20H2z" : "M12 20 2 4h20z"}" fill="${c || "currentColor"}"/></svg>`;

// Line chart of the price movement (used by both templates). `series` = prices evenly spaced over the time range.
// Without pasted data it falls back to a plain straight line open -> now (no invented movement).
let gid = 0;
function lineChartSVG(series, base, col, marks) {
  const W = 244, H = 186, pl = 14, pr = 20, pt = 42, pb = 30, n = series.length;
  const hi = Math.max(...series), lo = Math.min(...series), last = series[n - 1];
  const span = Math.max(hi - lo, Math.abs(last) * 0.004), mid = (hi + lo) / 2, mn = mid - span / 2;
  const X = i => pl + i * (W - pl - pr) / (n - 1), Y = v => pt + (1 - (v - mn) / span) * (H - pt - pb);
  const line = series.map((v, i) => X(i).toFixed(1) + "," + Y(v).toFixed(1)).join(" ");
  const id = "cg" + gid++, lx = X(n - 1), ly = Y(last), by = Y(base), inside = base >= mn && base <= mn + span;
  const grid = [0, 1, 2, 3].map(k => { const y = pt + k * (H - pt - pb) / 3; return `<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.07)"/>`; }).join("");
  const dot = i => `<circle cx="${X(i)}" cy="${Y(series[i])}" r="5" fill="#fff" stroke="${col}" stroke-width="3"/>`;
  const small = i => `<circle cx="${X(i)}" cy="${Y(series[i])}" r="4.5" fill="${col}" stroke="#fff" stroke-width="2"/>`;
  const hl = marks && n > 3 ? dot(series.indexOf(hi)) + dot(series.indexOf(lo)) : (n <= 8 ? series.map((_, i) => small(i)).join("") : "");
  const pcl = inside ? `<line x1="0" x2="${W}" y1="${by}" y2="${by}" stroke="rgba(255,255,255,.5)" stroke-width="1.5" stroke-dasharray="5 5"/>` : "";
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".45"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
    ${grid}${pcl}
    <polygon points="${X(0)},${H - pb} ${line} ${lx},${H - pb}" fill="url(#${id})"/>
    <polyline points="${line}" fill="none" stroke="${col}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" style="filter:drop-shadow(0 0 5px ${col})"/>
    ${hl}<circle cx="${lx}" cy="${ly}" r="12" fill="${col}" fill-opacity=".25"/>
    <circle cx="${lx}" cy="${ly}" r="6.5" fill="#fff" stroke="${col}" stroke-width="3.5"/></svg>`;
}

// OPEN chart: yesterday's close -> today's open, joined by a dotted line (the opening gap).
function gapChartSVG(base, open, col) {
  const W = 244, H = 186, xl = 40, xr = W - 40, pt = 62, pb = 66;
  const hi = Math.max(base, open), lo = Math.min(base, open), span = Math.max(hi - lo, Math.abs(base) * 0.004);
  const mid = (hi + lo) / 2, mn = mid - span / 2;
  const Y = v => pt + (1 - (v - mn) / span) * (H - pt - pb), yb = Y(base), yo = Y(open);
  const lab = (left, y, above, t) => `<text x="${left ? 12 : W - 12}" y="${above ? y - 15 : y + 28}" text-anchor="${left ? "start" : "end"}" font-size="${t.length > 7 ? 16 : 19}" font-weight="800" fill="#fff" font-family="Inter,Arial,sans-serif">${t}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <line x1="${xl}" x2="${W - 6}" y1="${yb}" y2="${yb}" stroke="rgba(255,255,255,.35)" stroke-width="1.5" stroke-dasharray="4 5"/>
    <line x1="${xl}" y1="${yb}" x2="${xr}" y2="${yo}" stroke="${col}" stroke-width="5" stroke-dasharray="1 11" stroke-linecap="round" style="filter:drop-shadow(0 0 5px ${col})"/>
    <circle cx="${xl}" cy="${yb}" r="7.5" fill="#cfd8ea" stroke="#0a1228" stroke-width="2.5"/>
    <circle cx="${xr}" cy="${yo}" r="13" fill="${col}" fill-opacity=".25"/>
    <circle cx="${xr}" cy="${yo}" r="7.5" fill="#fff" stroke="${col}" stroke-width="4"/>
    ${lab(true, yb, base >= open, fInt(base))}${lab(false, yo, open > base, fInt(open))}</svg>`;
}

// Shrink text that would overflow its box (keeps the template safe for any value).
function fitText(el, min) {
  let fs = parseFloat(getComputedStyle(el).fontSize);
  while (el.scrollWidth > el.clientWidth + 0.5 && fs > min) el.style.fontSize = (fs -= 1) + "px";
}
function fitAll() {
  document.querySelectorAll("#stage .card .val").forEach(e => fitText(e, 60));
  document.querySelectorAll("#stage .ucard .r2").forEach(r => {      // shrink value, then change, until the row fits
    const v = r.querySelector(".val"), c = r.querySelector(".chg");
    let a = parseFloat(getComputedStyle(v).fontSize), b = parseFloat(getComputedStyle(c).fontSize);
    while (r.scrollWidth > r.clientWidth + 0.5 && (a > 24 || b > 14)) { if (a > 24) v.style.fontSize = (--a) + "px"; if (b > 14 && r.scrollWidth > r.clientWidth + 0.5) c.style.fontSize = (--b) + "px"; }
  });
  document.querySelectorAll("#stage .card .chg").forEach(e => fitText(e, 26));
  document.querySelectorAll("#stage .tile .nm").forEach(e => fitText(e, 16));
  document.querySelectorAll("#stage .tile .pc").forEach(e => fitText(e, 28));
  document.querySelectorAll("#stage .dtext").forEach(e => fitText(e, 18));
}

/* ---------- photo ---------- */
function bseVector() {   // fallback if no photo is available
  let w = "";
  for (let r = 0; r < 34; r++) for (let c = 0; c < 9; c++)
    w += `<rect x="${236 + c * 40}" y="${r * 22}" width="22" height="13" fill="${(r * 7 + c * 3) % 5 ? "#2c4a6e" : "#9fc4e6"}"/>`;
  return `<svg viewBox="0 0 864 846" preserveAspectRatio="xMidYMid slice"><rect width="864" height="846" fill="#7cc8f2"/>
    <rect x="216" y="0" width="432" height="760" fill="#1d3552"/>${w}<rect x="0" y="690" width="864" height="156" fill="#c9d3dd"/></svg>`;
}
function setPhoto(url) {
  const bg = $("bg");
  if (url) { bg.innerHTML = ""; bg.style.backgroundImage = `url("${url}")`; }
  else { bg.style.backgroundImage = "none"; bg.innerHTML = bseVector(); }
}

/* ---------- render everything from one data object ---------- */
function render(D) {
  $("mDate").textContent = D.date;
  $("mTime").textContent = D.time;
  $("icoCal").innerHTML = icon("calendar");
  $("icoClock").innerHTML = icon("clock");
  $("dText").textContent = D.disclaimer;
  $("brand").textContent = D.brand;
  $("coin").src = LOGO;

  const pc = D.previousClose;
  $("info").innerHTML =
    `<span class="tag">PREVIOUS CLOSE</span><span class="day">${esc(pc.day)}</span><i class="sep"></i>` +
    `<span class="k">SENSEX</span><span class="v">${f2(num(pc.sensex))}</span><i class="sep"></i>` +
    `<span class="k">NIFTY 50</span><span class="v">${f2(num(pc.nifty))}</span>` +
    `<span class="src">${esc(D.source)}</span>`;

  const dirOf = (ch, p) => (ch > 0 || (ch === 0 && p > 0) ? "up" : ch < 0 || (ch === 0 && p < 0) ? "down" : "flat");
  const COL = { up: "#19e06b", down: "#ff4d57", flat: "#9aa6b8" };
  const tEnd = String(D.time).replace(/\s*(AM|PM|IST)/gi, "").trim() || "now";
  const mainCards = INDICES.map(([key, name]) => {
    const ix = D[key], v = num(ix.value), ch = num(ix.change), p = num(ix.percent);
    const dir = dirOf(ch, p), col = COL[dir], base = num(pc[key]) || v - ch;
    const open = ix.open !== undefined && ix.open !== "" ? num(ix.open) : v;
    const hasOpen = ix.open !== undefined && ix.open !== "";
    let chart, badge = "";
    if (IS_CLOSE) {   // full-day line 9:15 -> 3:30 with day high / low
      let series = Array.isArray(ix.spark) && ix.spark.length > 1 ? ix.spark.map(num) : null;     // real intraday points
      if (series && Math.abs(series[series.length - 1] - v) > 1e-9) series = series.concat(v);   // always end on the closing value
      if (!series) series = [hasOpen ? open : v, v];
      const hi = ix.high !== undefined && ix.high !== "" ? num(ix.high) : Math.max(...series);
      const lo = ix.low !== undefined && ix.low !== "" ? num(ix.low) : Math.min(...series);
      chart = `${lineChartSVG(series, base, col, true)}<span class="hl top">H ${fInt(hi)}</span><span class="hl topr">L ${fInt(lo)}</span><span class="cap"><span>9:15</span><span>3:30</span></span>`;
    } else {          // open: today's open vs yesterday's close
      const first = hasOpen ? open : v, diff = first - base;
      const gp = base ? diff / base * 100 : 0, gd = Math.round(gp * 100) === 0 ? "flat" : gp > 0 ? "up" : "down";
      badge = `<span class="st ${gd}">${gd === "flat" ? "" : tri(gd === "up")}${gd === "up" ? "OPENED UP" : gd === "down" ? "OPENED DOWN" : "FLAT OPEN"} ${gd === "flat" ? "" : fPct(gp)}</span>`;
      chart = `${gapChartSVG(base, first, COL[gd])}<span class="hl top">GAP ${gd === "down" ? "\u2212" : gd === "up" ? "+" : ""}${fInt(diff)} pts</span><span class="cap"><span>YEST. CLOSE</span><span>TODAY OPEN</span></span>`;
    }
    return `<div class="card ${dir}">
      <div class="txt">
        <div class="lbl">${name}${badge}</div>
        <div class="val">${fInt(v)}</div>
        <div class="chg">${dir === "flat" ? "" : tri(dir === "up")}<span>${sgn(Math.round(ch))}${fInt(ch)}</span><span class="pill">${fPct(p)}</span></div>
      </div>
      <div class="chart">${chart}</div>
    </div>`;
  }).join("");
  const US = IS_CLOSE ? [["gold", "GOLD"], ["silver", "SILVER"]] : [["dowjones", "DOW JONES"], ["nasdaq", "NASDAQ"]];
  const usCards = D.showUS === false ? "" : `<div class="us">` + US.map(([key, name]) => {
    const ix = D[key] || { value: 0, change: 0, percent: 0 }, v = num(ix.value), ch = num(ix.change), p = num(ix.percent), dir = dirOf(ch, p);
    const unit = IS_CLOSE ? (ix.unit || "") : "US", rupee = unit.startsWith("₹"), fv = rupee ? (n => "₹" + fInt(n)) : fUS, fc = rupee ? fInt : fUS;
    return `<div class="ucard ${dir}">
      <div class="r1"><span class="nm">${name}<small>${unit}</small></span><span class="pill">${fPct(p)}</span></div>
      <div class="r2"><span class="val">${fv(v)}</span><span class="chg">${dir === "flat" ? "" : tri(dir === "up")}${sgn(Math.round(ch * 100))}${fc(ch)}</span></div>
    </div>`;
  }).join("") + `</div>`;
  $("cards").innerHTML = mainCards + usCards;

  const vals = SECTORS.map(([n]) => num(D.sectors[n]));
  const up = vals.filter(v => Math.round(v * 100) > 0).length, dn = vals.filter(v => Math.round(v * 100) < 0).length;
  $("hmHead").innerHTML =
    `<div class="hm-title">SECTOR HEATMAP</div>` +
    `<div class="scale"><span class="l">Losers</span><span class="bar">${HEAT.slice().reverse().map(h => `<i style="background:${h.bg}"></i>`).join("")}</span><span class="g">Gainers</span></div>` +
    `<div class="adv"><span class="up">${tri(true)}${up}</span><span class="dn">${tri(false)}${dn}</span></div>`;

  $("grid").innerHTML = SECTORS.map(([name, ic], i) => {
    const bg = heatColour(vals[i]), fg = textOn(bg);
    return `<div class="tile" style="background:${bg};color:${fg}">
      ${icon(ic, 58)}<div class="nm">${name}</div><div class="pc">${fPct(vals[i])}</div></div>`;
  }).join("");

  fitAll();
  document.fonts.ready.then(fitAll);
}

/* ---------- scale the 1920×1080 stage into the window ---------- */
function fit() {
  const st = $("stage");
  if (EXPORT_MODE) { st.style.transform = "none"; return; }
  const pw = document.body.classList.contains("panel-open") ? ($("panel")?.offsetWidth || 0) : 0;
  const aw = innerWidth - pw, ah = innerHeight, s = Math.min(aw / 1920, ah / 1080);
  st.style.transform = `scale(${s})`;
  st.style.left = (aw - 1920 * s) / 2 + "px";
  st.style.top = (ah - 1080 * s) / 2 + "px";
}
addEventListener("resize", fit);
