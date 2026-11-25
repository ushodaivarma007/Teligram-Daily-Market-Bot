// ===================== DAILY EDITOR PANEL (not part of the image) =====================
const CLOSE_T = window.TEMPLATE === "close";
const STORE = "rupayi-market-" + (window.TEMPLATE || "open") + "-data-v4", PHOTO_STORE = "rupayi-market-open-photo-v2", PANEL_STORE = "rupayi-market-open-panel";
const clone = o => JSON.parse(JSON.stringify(o));
const isObj = o => o && typeof o === "object" && !Array.isArray(o);
function merge(base, over) {
  for (const k in over) base[k] = isObj(base[k]) && isObj(over[k]) ? merge(base[k], over[k]) : over[k];
  return base;
}
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) {} };

let state = clone(MARKET_DATA);
let savedPhoto = null;
if (!EXPORT_MODE) {
  try { const s = JSON.parse(lsGet(STORE)); if (s) state = merge(clone(MARKET_DATA), s); } catch (e) {}
  savedPhoto = lsGet(PHOTO_STORE);
}
const defaultPhoto = typeof BSE_PHOTO !== "undefined" ? BSE_PHOTO : null;
setPhoto(savedPhoto || defaultPhoto);
render(state);

if (EXPORT_MODE) { document.body.classList.add("export"); fit(); }
else buildPanel();

function buildPanel() {
  const f = (path, label, type = "number", step) =>
    `<label class="f"><span>${label}</span><input data-path="${path}" type="${type}" ${step ? `step="${step}"` : ""} inputmode="${type === "number" ? "decimal" : "text"}"></label>`;
  const indexFields = k => `<div class="row3">${f(k + ".value", CLOSE ? "Close" : "Value", "number", "0.01")}${f(k + ".change", "Change", "number", "0.01")}${f(k + ".percent", "% change", "number", "0.01")}</div>` +
    (CLOSE ? `<div class="row3">${f(k + ".open", "Open", "number", "0.01")}${f(k + ".high", "High (optional)", "number", "0.01")}${f(k + ".low", "Low (optional)", "number", "0.01")}</div>`
           : f(k + ".open", "Today's opening price (9:15) — compared with yesterday's close", "number", "0.01")) +
    (CLOSE ? `<label class="f"><span>Day's price movement: paste values evenly spaced from 9:15 to 3:30 (one per 15 min works well)</span><textarea data-spark="${k}" rows="3" placeholder="blank = straight line (no invented movement)"></textarea></label>` : "");
  const sectorInputs = SECTORS.map(([n]) => f("sectors." + n, n, "number", "0.01")).join("");
  document.body.insertAdjacentHTML("beforeend", `
  <aside id="panel">
    <div class="p-head"><div><b>Today's data</b><small>${CLOSE ? "MARKET CLOSE" : "MARKET OPEN"} · edits save automatically in this browser</small></div><button class="x" id="pClose" title="Hide panel">×</button></div>
    <div class="p-body">
      <section><h4>Date &amp; time <button class="mini" id="btnNow">Use now (IST)</button></h4>
        <div class="row2">${f("date", "Date", "text")}${f("time", "Time", "text")}</div></section>
      <section><h4>Sensex</h4>${indexFields("sensex")}</section>
      <section><h4>Nifty 50</h4>${indexFields("nifty")}
        <button class="wide" id="btnCalc">Calculate change &amp; % from previous close</button></section>
      ${CLOSE_T ? `<section><h4>Gold &amp; Silver (price at 3:30)</h4>
        <label class="chk"><input type="checkbox" id="showUS"> Show Gold &amp; Silver cards</label>
        <div class="usf"><b>Gold</b>${f("gold.value", "Price", "number", "0.01")}${f("gold.change", "Change", "number", "0.01")}${f("gold.percent", "% change", "number", "0.01")}${f("gold.unit", "Unit label (e.g. ₹/10g)", "text")}</div>
        <div class="usf"><b>Silver</b>${f("silver.value", "Price", "number", "0.01")}${f("silver.change", "Change", "number", "0.01")}${f("silver.percent", "% change", "number", "0.01")}${f("silver.unit", "Unit label (e.g. ₹/kg)", "text")}</div></section>` : `<section><h4>US markets (last night's close)</h4>
        <label class="chk"><input type="checkbox" id="showUS"> Show Dow Jones &amp; Nasdaq cards</label>
        <div class="usf"><b>Dow Jones</b>${f("dowjones.value", "Value", "number", "0.01")}${f("dowjones.change", "Change", "number", "0.01")}${f("dowjones.percent", "% change", "number", "0.01")}</div>
        <div class="usf"><b>Nasdaq</b>${f("nasdaq.value", "Value", "number", "0.01")}${f("nasdaq.change", "Change", "number", "0.01")}${f("nasdaq.percent", "% change", "number", "0.01")}</div></section>`}
      <section><h4>Previous close</h4>${f("previousClose.day", "Day label", "text")}
        <div class="row2">${f("previousClose.sensex", "Sensex", "number", "0.01")}${f("previousClose.nifty", "Nifty 50", "number", "0.01")}</div></section>
      <section><h4>Sectors (% change)</h4><div class="row2 sectors">${sectorInputs}</div></section>
      <section><h4>Footer</h4>${f("source", "Source line", "text")}</section>
      <section><h4>Background photo</h4><div class="row2">
        <label class="btn2">Choose photo…<input type="file" id="photoIn" accept="image/*" hidden></label>
        <button class="btn2" id="photoReset">Use default BSE photo</button></div></section>
    </div>
    <div class="p-foot">
      <button class="primary" id="exp1">⬇ Export PNG 1920×1080</button>
      <div class="row2"><button id="exp2">⬇ PNG 4K</button><button id="saveJs">Save as data.js</button></div>
      <button class="ghost" id="reset">Reset all to data.js</button>
      <div id="msg"></div>
    </div>
  </aside>
  <button id="pOpen">✎ Edit &amp; export</button>`);

  const get = p => p.split(".").reduce((o, k) => (o == null ? o : o[k]), state);
  const set = (p, v) => { const ks = p.split("."), last = ks.pop(); ks.reduce((o, k) => (o[k] ??= {}), state)[last] = v; };
  const inputs = [...document.querySelectorAll("#panel [data-path]")];
  const fill = () => inputs.forEach(i => { const v = get(i.dataset.path); i.value = v ?? ""; });
  let t;
  const commit = () => { render(state); clearTimeout(t); t = setTimeout(() => lsSet(STORE, JSON.stringify(state)), 250); };
  const msg = (s, ms = 2500) => { const m = $("msg"); m.textContent = s; clearTimeout(m._t); m._t = setTimeout(() => (m.textContent = ""), ms); };
  const usBox = $("showUS");
const sparks = [...document.querySelectorAll("#panel [data-spark]")];
  const fill2 = () => { fill(); usBox.checked = state.showUS !== false; sparks.forEach(t => { const v = state[t.dataset.spark].spark; t.value = Array.isArray(v) ? v.join(", ") : ""; }); };
  sparks.forEach(t => t.addEventListener("input", () => {
    const nums = t.value.replace(/(\d),(\d{3})(?!\d)/g, "$1$2").split(/[\s,;]+/).map(x => parseFloat(x.replace(/,/g, ""))).filter(x => !isNaN(x));
    if (nums.length > 1) state[t.dataset.spark].spark = nums; else delete state[t.dataset.spark].spark;
    commit();
  }));
  usBox.onchange = () => { state.showUS = usBox.checked; commit(); };
  fill2();

  inputs.forEach(i => i.addEventListener("input", () => {
    if (i.type === "number") {
      if (i.value === "" && /\.(open|high|low)$/.test(i.dataset.path)) { const [k, f2k] = i.dataset.path.split("."); delete state[k][f2k]; }   // blank = default
      else if (i.value === "" || isNaN(+i.value)) return; else set(i.dataset.path, +i.value);
    }
    else set(i.dataset.path, i.value);
    commit();
  }));

  $("btnNow").onclick = () => {
    const d = new Date(), tz = "Asia/Kolkata";
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "2-digit", month: "short", year: "numeric" }).formatToParts(d).map(x => [x.type, x.value]));
    state.date = `${p.day} ${p.month.toUpperCase().slice(0, 3)} ${p.year}`;
    state.time = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(d) + " IST";
    fill2(); commit();
  };
  $("btnCalc").onclick = () => {
    for (const k of ["sensex", "nifty"]) {
      const v = num(state[k].value), pc = num(state.previousClose[k]);
      if (!pc) continue;
      state[k].change = Math.round((v - pc) * 100) / 100;
      state[k].percent = Math.round((v - pc) / pc * 10000) / 100;
    }
    fill2(); commit(); msg("Change and % calculated from previous close");
  };

  $("photoIn").onchange = e => {
    const file = e.target.files[0]; if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      const im = new Image();
      im.onload = () => {   // downscale so it stays small enough to remember
        const s = Math.min(1, 1920 / im.width), c = document.createElement("canvas");
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        const url = c.toDataURL("image/jpeg", 0.9);
        setPhoto(url);
        msg(lsSet(PHOTO_STORE, url) ? "Photo saved" : "Photo applied (too large to remember after closing)");
      };
      im.src = rd.result;
    };
    rd.readAsDataURL(file); e.target.value = "";
  };
  $("photoReset").onclick = () => { lsDel(PHOTO_STORE); setPhoto(defaultPhoto); msg("Default photo restored"); };

  const busy = async (btn, fn) => { const tx = btn.textContent; btn.disabled = true; btn.textContent = "Exporting…"; try { await fn(); msg("PNG downloaded"); } catch (e) { msg("Export failed: " + e.message, 6000); } btn.disabled = false; btn.textContent = tx; };
  $("exp1").onclick = e => busy(e.currentTarget, () => exportPNG(1));
  $("exp2").onclick = e => busy(e.currentTarget, () => exportPNG(2));
  $("saveJs").onclick = () => {
    const txt = "// Saved from the editor panel. Replace data.js with this file to make these the defaults.\nconst MARKET_DATA = " + JSON.stringify(state, null, 2) + ";\n";
    const a = document.createElement("a"); a.download = "data.js";
    a.href = URL.createObjectURL(new Blob([txt], { type: "text/javascript" })); a.click();
  };
  $("reset").onclick = () => {
    if (!confirm("Discard your saved edits and reload the values from data.js?")) return;
    lsDel(STORE); state = clone(MARKET_DATA); fill2(); render(state); msg("Reset to data.js");
  };

  const open = on => { document.body.classList.toggle("panel-open", on); lsSet(PANEL_STORE, on ? "1" : "0"); fit(); };
  $("pClose").onclick = () => open(false);
  $("pOpen").onclick = () => open(true);
  open(lsGet(PANEL_STORE) !== "0" && innerWidth > 900);
}
