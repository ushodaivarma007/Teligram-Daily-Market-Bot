// ============================================================
//  DEFAULT DATA — MARKET CLOSE template (close.html, 3:30 PM)
//  value = today's closing value; spark = the day's price movement (line chart).
//  (All numbers below are SAMPLE values — replace them every day.)
// ============================================================
const MARKET_DATA = {
  date: "25 NOV 2026",
  time: "3:30 PM IST",

  // spark = intraday values, evenly spaced from 9:15 to 3:30 (about one every 15 min). Paste your real ones in the panel.
  sensex: { value: 83905, change: 1469, percent: 1.78, open: 83640, high: 84112, low: 83521,
            spark: [83640, 83627, 83573, 83577, 83583, 83521, 83591, 83577, 83592, 83627, 83675, 83713, 83754, 83809, 83979, 83992, 84079, 84024, 84112, 84112, 84095, 84083, 83998, 83994, 83958, 83905] },
  nifty:  { value: 25702, change: 353,  percent: 1.39, open: 25610, high: 25741, low: 25590,
            spark: [25610, 25622, 25590, 25590, 25609, 25617, 25590, 25598, 25596, 25622, 25626, 25642, 25670, 25675, 25674, 25700, 25727, 25723, 25741, 25741, 25733, 25736, 25716, 25721, 25701, 25702] },

  // Gold & silver at 3:30 PM. Sample = MCX-style rupee prices. Change the unit label if you use another source.
  showUS: true,
  gold:   { value: 128450, change: 920,  percent: 0.72, unit: "₹/10g" },
  silver: { value: 164800, change: -1350, percent: -0.81, unit: "₹/kg" },

  previousClose: { day: "Monday, 23 November", sensex: 82435.99, nifty: 25349.65 },

  sectors: {
    "Banking": 1.62,  "Financials": 1.48,  "IT": 0.92,           "Auto": 1.75,
    "Energy": 0.66,   "Pharma": -0.34,     "FMCG": 0.21,         "Telecom": 1.31,
    "Metals": 2.38,   "Industrials": 1.64, "Realty": 0.47,       "Chemicals": -0.12,
    "PSU": 1.96,      "Consumption": 0.93, "Infrastructure": 1.52, "Media": -0.81,
  },

  source: "Source: Business Standard, NSE, BSE.",
  disclaimer: "Educational information only. Not investment advice or a recommendation. I am not a SEBI-registered Investment Adviser or Research Analyst. Data may be delayed; verify on NSE/BSE.",
  brand: "RUPAYI TELUGU",
};
