// ============================================================
//  DEFAULT DATA — MARKET OPEN template (index.html, ~9:18 AM)
//
//  Easiest daily routine: open index.html in Chrome and type the
//  numbers into the "Today's data" panel (it remembers them).
//  This file is the starting point, and what `node render.js` uses.
//  (All numbers below are SAMPLE values — replace them every day.)
// ============================================================
const MARKET_DATA = {
  date: "25 NOV 2026",
  time: "9:18 AM IST",

  // open = today's 9:15 AM opening price (compared with yesterday's close on the chart).
  sensex: { value: 83782, change: 1345, percent: 1.63, open: 83640 },
  nifty:  { value: 25658, change: 309,  percent: 1.22, open: 25610 },

  // US markets: last night's close (shown as small cards under Sensex/Nifty)
  showUS: true,
  dowjones: { value: 45980.31, change: 212.40, percent: 0.46 },
  nasdaq:   { value: 23412.70, change: -58.90, percent: -0.25 },

  previousClose: { day: "Monday, 23 November", sensex: 82435.99, nifty: 25349.65 },

  // Sector % change. Tile positions are fixed; just change the numbers.
  sectors: {
    "Banking": 1.85,  "Financials": 1.62,  "IT": 0.74,           "Auto": 1.28,
    "Energy": 0.95,   "Pharma": -0.21,     "FMCG": 0.33,         "Telecom": 1.12,
    "Metals": 2.10,   "Industrials": 1.47, "Realty": 0.58,       "Chemicals": 0.09,
    "PSU": 1.73,      "Consumption": 0.81, "Infrastructure": 1.36, "Media": -0.64,
  },

  source: "Source: Business Standard, NSE, BSE.",
  disclaimer: "Educational information only. Not investment advice or a recommendation. I am not a SEBI-registered Investment Adviser or Research Analyst. Data may be delayed; verify on NSE/BSE.",
  brand: "RUPAYI TELUGU",
};
