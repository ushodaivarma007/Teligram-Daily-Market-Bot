// ===================== DESIGN: layout + CSS of the 1920x1080 graphic =====================
// Shared by index.html (Market Open) and close.html (Market Close). Edit here to restyle both.
const CLOSE = window.TEMPLATE === "close";
const DESIGN_CSS = String.raw`
#stage{
  --navy:#07122b; --blue:#1e6bff; --red:#e5232d; --yellow:#ffc619; --ink:#0a1228;
  position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;overflow:hidden;
  display:grid;grid-template-rows:110px 1fr 64px 80px;
  font-family:"Inter","Segoe UI",Roboto,Arial,sans-serif;color:#fff;background:#050d22;
  -webkit-font-smoothing:antialiased;
}
#stage *{box-sizing:border-box;margin:0;padding:0}
#stage svg{display:block}

/* ---------- header ---------- */
#stage .hdr{position:relative;z-index:3;background:linear-gradient(180deg,#14306a 0%,#08142f 100%);border-bottom:4px solid var(--blue);box-shadow:0 6px 20px rgba(0,0,0,.55)}
#stage .rb-accent,#stage .ribbon{position:absolute;left:0;top:0;height:106px;clip-path:polygon(0 0,100% 0,calc(100% - 72px) 100%,0 100%)}
#stage .rb-accent{width:964px;background:linear-gradient(180deg,#ffd84d,#e6a800)}
#stage .ribbon{
  width:940px;display:flex;align-items:center;gap:24px;padding-left:38px;
  background:linear-gradient(180deg,#ff4c56 0%,#e5232d 52%,#b0111b 100%);
  font-size:80px;font-weight:900;letter-spacing:3px;line-height:1;text-shadow:0 4px 10px rgba(0,0,0,.4);
}
#stage .ribbon.close{background:linear-gradient(180deg,#4f97ff 0%,#1e6bff 52%,#0e3fa6 100%)}
#stage .ribbon::before{content:"";position:absolute;inset:0 0 52% 0;background:linear-gradient(180deg,rgba(255,255,255,.26),rgba(255,255,255,0))}
#stage .ribbon span{position:relative}
#stage .ribbon .word{padding:4px 22px 6px;border-radius:14px;background:#050d22;border:3px solid;line-height:1;text-shadow:none}
#stage .ribbon .wo{color:#19e06b;border-color:#19e06b;box-shadow:0 0 18px rgba(25,224,107,.55),inset 0 0 14px rgba(0,0,0,.6)}
#stage .ribbon .wc{color:#ff4d57;border-color:#ff4d57;box-shadow:0 0 18px rgba(255,77,87,.55),inset 0 0 14px rgba(0,0,0,.6)}
#stage .live{position:relative;flex:none;width:26px;height:26px;border-radius:50%;background:#fff;box-shadow:0 0 0 8px rgba(255,255,255,.28),0 0 22px rgba(255,255,255,.9)}
#stage .meta{position:absolute;right:36px;top:0;height:106px;display:flex;align-items:center;gap:22px}
#stage .meta-item{
  display:flex;align-items:center;gap:16px;padding:9px 26px 9px 18px;border-radius:16px;white-space:nowrap;
  font-size:46px;font-weight:800;line-height:1;
  background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.05));
  border:1.5px solid rgba(255,255,255,.26);box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 8px 16px rgba(0,0,0,.4);
}
#stage .meta-item svg{width:50px;height:50px;color:var(--yellow)}

/* ---------- left: BSE photo + index cards ---------- */
#stage main{display:grid;grid-template-columns:864px 1fr;min-height:0}
#stage .left{position:relative;overflow:hidden;background:#9fdcf7}
#stage #bg{position:absolute;inset:0;background-color:#0b3f93;background-size:1000px auto;background-position:-22px -110px;background-repeat:no-repeat}
#stage #bg svg{width:100%;height:100%}
#stage .left::after{content:"";position:absolute;inset:0;pointer-events:none;   /* photo fades into the navy base behind the cards */
  background:linear-gradient(180deg,rgba(6,16,42,0) 0,rgba(6,16,42,0) 250px,rgba(6,16,42,.55) 295px,rgba(6,16,42,.92) 335px,#06102a 380px),
                          radial-gradient(700px 260px at 50% 100%,rgba(30,107,255,.25),rgba(30,107,255,0)),
             linear-gradient(90deg,rgba(0,0,0,0) 94%,rgba(0,0,0,.35) 100%)}
#stage .cards{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;justify-content:flex-end;gap:14px;padding:0 40px 16px}

#stage .card{
  --accent:#19e06b; --accent-dark:#0a3d22;
  position:relative;height:214px;display:grid;grid-template-columns:1fr 244px;column-gap:20px;
  padding:14px 14px 14px 28px;border-radius:22px;
  background:linear-gradient(180deg,#10254f 0%,#060f27 100%);
  border:2.5px solid var(--accent);
  box-shadow:0 0 30px color-mix(in srgb,var(--accent) 40%,transparent),0 22px 40px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.22);
}
#stage .card.down{--accent:#ff4d57;--accent-dark:#45121a}
#stage .card.flat{--accent:#9aa6b8;--accent-dark:#2a3140}
#stage .card::before{content:"";position:absolute;left:24px;right:24px;top:-1px;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent)}
#stage .card .txt{min-width:0;display:flex;flex-direction:column;justify-content:center}
#stage .card .lbl{display:flex;align-items:center;gap:12px;white-space:nowrap;font-size:30px;font-weight:800;letter-spacing:2px;line-height:1;color:#bcd0f7}
#stage .card .lbl::before{content:"";width:7px;height:26px;border-radius:4px;background:var(--accent)}
#stage .card .val{margin-top:4px;font-size:102px;font-weight:900;line-height:.92;letter-spacing:-2px;white-space:nowrap;text-shadow:0 4px 14px rgba(0,0,0,.5)}
#stage .card .chg{margin-top:9px;display:flex;align-items:center;gap:12px;white-space:nowrap;font-size:36px;font-weight:800;line-height:1;color:var(--accent)}
#stage .card .chg svg{width:26px;height:26px;flex:none}
#stage .card .pill{font-size:30px;font-weight:900;padding:4px 12px;border-radius:12px;color:#04210f;
  background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 70%,#fff),var(--accent));box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 4px 10px rgba(0,0,0,.35)}
#stage .card.down .pill{color:#fff}
#stage .card .chart{position:relative;border-radius:14px;overflow:hidden;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.1)}
#stage .card .chart svg{position:absolute;inset:0;width:100%;height:100%}
#stage .card .gap{position:absolute;left:10px;top:9px;font-size:16px;font-weight:800;letter-spacing:.5px;line-height:1;color:#c3d3f3}
#stage .card .st{margin-left:auto;display:flex;align-items:center;gap:7px;white-space:nowrap;font-size:18px;font-weight:900;letter-spacing:.3px;line-height:1;padding:6px 10px;border-radius:10px;box-shadow:0 3px 8px rgba(0,0,0,.4)}
#stage .card .st svg{width:15px;height:15px}
#stage .card .st.up{background:#19e06b;color:#04210f}#stage .card .st.down{background:#ff4d57;color:#fff}#stage .card .st.flat{background:#9aa6b8;color:#0a1228}
#stage .card .cap{position:absolute;left:10px;right:10px;bottom:7px;display:flex;justify-content:space-between;white-space:nowrap;font-size:16px;font-weight:800;line-height:1;color:#9fb6e6}
#stage .card .hl{position:absolute;left:10px;font-size:17px;font-weight:800;line-height:1;color:#c3d3f3}
#stage .card .hl.top{top:9px}#stage .card .hl.topr{top:9px;left:auto;right:10px}
#stage .card .pcl{position:absolute;right:10px;font-size:15px;font-weight:800;line-height:1;color:#9fb6e6;transform:translateY(-130%)}

/* ---------- right: sector heatmap ---------- */
#stage .right{display:flex;flex-direction:column;gap:10px;min-height:0;padding:10px 16px 14px;
  background:radial-gradient(900px 600px at 15% 0%,rgba(30,107,255,.24),rgba(7,18,43,0) 70%),#07122b}
#stage .hm-head{height:44px;display:flex;align-items:center;justify-content:space-between;white-space:nowrap}
#stage .hm-title{display:flex;align-items:center;gap:12px;font-size:27px;font-weight:900;letter-spacing:2.5px}
#stage .hm-title::before{content:"";width:8px;height:28px;border-radius:4px;background:var(--yellow)}
#stage .scale{display:flex;align-items:center;gap:12px;font-size:22px;font-weight:800}
#stage .scale .l{color:#ff7b82}#stage .scale .g{color:#4fe38e}
#stage .scale .bar{display:flex;height:18px;border-radius:6px;overflow:hidden;border:1px solid rgba(255,255,255,.35)}
#stage .scale .bar i{width:24px;height:100%}
#stage .adv{display:flex;gap:10px}
#stage .adv span{display:flex;align-items:center;gap:8px;padding:6px 14px;border-radius:10px;font-size:22px;font-weight:900;line-height:1}
#stage .adv svg{width:16px;height:16px}
#stage .adv .up{background:rgba(25,224,107,.16);color:#4fe38e;border:1px solid rgba(25,224,107,.45)}
#stage .adv .dn{background:rgba(255,77,87,.16);color:#ff7b82;border:1px solid rgba(255,77,87,.45)}
#stage .grid{flex:1;min-height:0;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);gap:10px}
#stage .tile{
  position:relative;min-width:0;min-height:0;overflow:hidden;border-radius:14px;padding:8px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;
  border:2px solid rgba(0,0,0,.28);box-shadow:0 5px 0 rgba(0,0,0,.35);
}
#stage .tile svg{width:58px;height:58px;flex:none;stroke-width:2.2}
#stage .tile .nm{max-width:100%;white-space:nowrap;font-size:30px;font-weight:800;line-height:1.1}
#stage .tile .pc{max-width:100%;white-space:nowrap;font-size:52px;font-weight:900;line-height:1;letter-spacing:-.5px}

/* ---------- info bar ---------- */
#stage .info{position:relative;z-index:3;display:flex;align-items:center;padding:0 30px;white-space:nowrap;
  background:linear-gradient(180deg,#152c60,#0a1838);border-top:2px solid rgba(255,255,255,.22);box-shadow:0 -6px 18px rgba(0,0,0,.45)}
#stage .info .tag{font-size:25px;font-weight:900;letter-spacing:1.5px;color:var(--ink);background:var(--yellow);padding:8px 14px;border-radius:8px;line-height:1}
#stage .info .day{margin-left:14px;font-size:32px;font-weight:800;color:var(--yellow)}
#stage .info .sep{width:2px;height:34px;margin:0 20px;background:rgba(255,255,255,.22)}
#stage .info .k{font-size:26px;font-weight:800;letter-spacing:1px;color:#9fb6e6;margin-right:12px}
#stage .info .v{font-size:34px;font-weight:800}
#stage .info .src{margin-left:auto;padding-left:20px;font-size:22px;font-weight:700;color:#a9bbe0}

/* ---------- disclaimer + brand ---------- */
#stage .disc{display:flex;align-items:stretch;overflow:hidden;color:var(--ink);
  background:linear-gradient(180deg,#ffe066 0%,#ffc619 55%,#eaa900 100%);box-shadow:inset 0 2px 0 rgba(255,255,255,.6)}
#stage .dtext{flex:1;min-width:0;display:flex;align-items:center;padding-left:30px;white-space:normal;font-size:25px;line-height:1.18;font-weight:800;padding-right:60px}
#stage .brand{display:flex;align-items:center;justify-content:center;gap:16px;width:590px;padding-left:56px;white-space:nowrap;
  background:linear-gradient(180deg,#17336f,#07122b);color:#66ad5b;font-size:46px;font-weight:900;letter-spacing:3px;
  clip-path:polygon(52px 0,100% 0,100% 100%,0 100%);text-shadow:0 3px 8px rgba(0,0,0,.6)}
#stage .coin{width:68px;height:68px;flex:none;display:block;filter:drop-shadow(0 3px 6px rgba(0,0,0,.55))}

/* ---------- US markets (small cards) ---------- */
#stage .us{display:grid;grid-template-columns:1fr 1fr;gap:14px}
#stage .ucard{
  --accent:#19e06b;position:relative;height:98px;padding:10px 14px 10px 16px;border-radius:16px;min-width:0;
  display:flex;flex-direction:column;justify-content:space-between;
  background:linear-gradient(180deg,#10254f 0%,#060f27 100%);border:2px solid var(--accent);
  box-shadow:0 0 18px color-mix(in srgb,var(--accent) 32%,transparent),0 12px 22px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.2)}
#stage .ucard.down{--accent:#ff4d57}#stage .ucard.flat{--accent:#9aa6b8}
#stage .ucard .r1{display:flex;align-items:center;justify-content:space-between;gap:8px;white-space:nowrap}
#stage .ucard .nm{font-size:21px;font-weight:800;letter-spacing:1.5px;line-height:1;color:#bcd0f7;display:flex;align-items:center;gap:10px}
#stage .ucard .nm::before{content:"";width:6px;height:20px;border-radius:3px;background:var(--accent)}
#stage .ucard .nm small{font-size:15px;font-weight:800;letter-spacing:1px;color:#8195bd}
#stage .ucard .pill{font-size:21px;font-weight:900;line-height:1;padding:4px 10px;border-radius:9px;color:#04210f;background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 70%,#fff),var(--accent))}
#stage .ucard.down .pill{color:#fff}
#stage .ucard .r2{display:flex;align-items:baseline;justify-content:space-between;gap:10px;white-space:nowrap}
#stage .ucard .val{font-size:40px;font-weight:900;line-height:1;letter-spacing:-.5px}
#stage .ucard .chg{display:flex;align-items:center;gap:5px;font-size:22px;font-weight:800;line-height:1;color:var(--accent)}
#stage .ucard .chg svg{width:18px;height:18px}
`;
const STAGE_HTML = `<div id="stage">
  <header class="hdr">
    <div class="rb-accent"></div>
    <div class="ribbon ${CLOSE ? "close" : ""}"><i class="live"></i><span>MARKET</span><span class="word ${CLOSE ? "wc" : "wo"}">${CLOSE ? "CLOSE" : "OPEN"}</span></div>
    <div class="meta">
      <div class="meta-item"><span id="icoCal"></span><b id="mDate"></b></div>
      <div class="meta-item"><span id="icoClock"></span><b id="mTime"></b></div>
    </div>
  </header>
  <main>
    <section class="left"><div id="bg"></div><div class="cards" id="cards"></div></section>
    <section class="right"><div class="hm-head" id="hmHead"></div><div class="grid" id="grid"></div></section>
  </main>
  <div class="info" id="info"></div>
  <footer class="disc">
    <div class="dtext" id="dText"></div>
    <div class="brand"><img class="coin" id="coin" alt=""><span id="brand"></span></div>
  </footer>
</div>`;
document.head.insertAdjacentHTML("beforeend", `<style id="design-css">${DESIGN_CSS}</style>`);
document.body.insertAdjacentHTML("afterbegin", STAGE_HTML);
