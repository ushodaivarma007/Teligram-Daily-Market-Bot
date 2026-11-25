// PNG export inside the browser — no server, no libraries.
// Works when index.html is double-clicked (file://) as well as over http.
// stage → SVG <foreignObject> → <canvas> → PNG download.
async function exportPNG(scale = 1, fileName) {
  await document.fonts.ready;
  const css = ($("font-css")?.textContent || "") + "\n" + $("design-css").textContent;
  const clone = $("stage").cloneNode(true);
  clone.style.transform = "none"; clone.style.left = "0"; clone.style.top = "0";
  const xml = new XMLSerializer().serializeToString(clone);
  const W = 1920 * scale, H = 1080 * scale;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 1920 1080">` +
    `<foreignObject x="0" y="0" width="1920" height="1080"><div xmlns="http://www.w3.org/1999/xhtml" style="width:1920px;height:1080px;position:relative">` +
    `<style><![CDATA[${css}]]></style>${xml}</div></foreignObject></svg>`;
  const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  const load = () => new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = src; });
  await load(); await new Promise(r => setTimeout(r, 350));   // 1st pass lets embedded fonts/photo decode
  const img = await load();
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  cv.getContext("2d").drawImage(img, 0, 0, W, H);
  const blob = await new Promise(r => cv.toBlob(r, "image/png"));
  if (fileName !== false) {
    const a = document.createElement("a");
    a.download = fileName || `market-${window.TEMPLATE || "open"}-${String($("mDate").textContent).trim().replace(/\s+/g, "-")}${scale > 1 ? "-4K" : ""}.png`;
    a.href = URL.createObjectURL(blob); document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  return blob;
}
