// Sleeps until HH:MM IST (if that time is still ahead today). GitHub's scheduler can be late,
// so the workflow starts early and waits for the exact minute.
const [h, m] = process.argv[2].split(":").map(Number);
const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
const cur = (+p.find(x => x.type === "hour").value % 24) * 60 + +p.find(x => x.type === "minute").value;
const wait = (h * 60 + m - cur) * 60;
if (wait > 0 && wait < 3600) { console.log("waiting", wait, "s"); setTimeout(() => {}, wait * 1000); } else console.log("no wait");
