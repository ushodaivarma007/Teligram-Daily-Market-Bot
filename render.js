// Headless render straight from data.js -> pixel-exact PNG (optional; the Export button in the page does the same).
// Usage:  npm install   then   node render.js [out.png] [scale] [page]
//   node render.js open.png 1            -> Market Open  (index.html)
//   node render.js close.png 1 close.html -> Market Close (close.html)
//   scale 2 gives 3840×2160
// Needs Chrome/Chromium installed. Set CHROME_PATH if it is not found automatically.
const puppeteer = require("puppeteer-core"), path = require("path"), fs = require("fs");
const chrome = process.env.CHROME_PATH || ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(fs.existsSync);
(async () => {
  const out = process.argv[2] || "market-open.png", scale = +process.argv[3] || 1;
  const b = await puppeteer.launch({ executablePath: chrome, args: ["--no-sandbox"] });
  const p = await b.newPage();
  await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: scale });
  await p.goto("file://" + path.resolve(__dirname, process.argv[4] || "index.html") + "?export");
  await p.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 500));
  const bad = await p.evaluate(() => [...document.querySelectorAll("#stage *")]
    .filter(e => e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1 && e.textContent.trim())
    .map(e => e.className + ": " + e.textContent.trim().slice(0, 40))
    .concat([...document.querySelectorAll("#stage .card .txt, #stage .tile")]
      .filter(e => e.scrollHeight > e.clientHeight + 1).map(e => "vertical overflow in " + e.className)));
  if (bad.length) console.warn("⚠ possible overflow:", bad);
  await p.screenshot({ path: out, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  await b.close(); console.log("saved", out);
})();
