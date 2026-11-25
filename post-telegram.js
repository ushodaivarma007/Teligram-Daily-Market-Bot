// Posts a PNG to the Telegram group. Needs env TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.
const fs = require("fs");
(async () => {
  const [img, mode] = [process.argv[2], process.argv[3]];
  const { TELEGRAM_BOT_TOKEN: tok, TELEGRAM_CHAT_ID: chat } = process.env;
  if (!tok || !chat) throw new Error("Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID secrets");
  const title = mode === "close" ? "Market Close" : "Market Open";
  const caption = title; // short heading only; the full disclaimer is printed on the image
  const fd = new FormData();
  fd.append("chat_id", chat); fd.append("caption", caption);
  fd.append("photo", new Blob([fs.readFileSync(img)], { type: "image/png" }), "market.png");
  const r = await fetch(`https://api.telegram.org/bot${tok}/sendPhoto`, { method: "POST", body: fd });
  const j = await r.json();
  if (!j.ok) throw new Error("Telegram error: " + JSON.stringify(j));
  console.log("Posted to Telegram, message id", j.result.message_id);
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
