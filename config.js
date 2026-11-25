// Symbols used to fetch live data. Edit here if a sector fails the dry-run check.
// nse = name in NSE's allIndices feed; yahoo = Yahoo Finance symbol (fallback).
module.exports = {
  indices: {
    sensex: { yahoo: "^BSESN" }, nifty: { yahoo: "^NSEI" },
    dowjones: { yahoo: "^DJI" }, nasdaq: { yahoo: "^IXIC" },
    gold: { yahoo: "GC=F" }, silver: { yahoo: "SI=F" },
  },
  sectors: {
    "Banking":        { nse: "NIFTY BANK",               yahoo: "^NSEBANK" },
    "Financials":     { nse: "NIFTY FINANCIAL SERVICES", yahoo: "NIFTY_FIN_SERVICE.NS" },
    "IT":             { nse: "NIFTY IT",                 yahoo: "^CNXIT" },
    "Auto":           { nse: "NIFTY AUTO",               yahoo: "^CNXAUTO" },
    "Energy":         { nse: "NIFTY ENERGY",             yahoo: "^CNXENERGY" },
    "Pharma":         { nse: "NIFTY PHARMA",             yahoo: "^CNXPHARMA" },
    "FMCG":           { nse: "NIFTY FMCG",               yahoo: "^CNXFMCG" },
    "Telecom":        { nse: "NIFTY INDIA DIGITAL",      yahoo: null },
    "Metals":         { nse: "NIFTY METAL",              yahoo: "^CNXMETAL" },
    "Industrials":    { nse: "NIFTY INDIA MANUFACTURING", yahoo: null },
    "Realty":         { nse: "NIFTY REALTY",             yahoo: "^CNXREALTY" },
    "Chemicals":      { nse: "NIFTY CHEMICALS",          yahoo: null },
    "PSU":            { nse: "NIFTY PSE",                yahoo: "^CNXPSE" },
    "Consumption":    { nse: "NIFTY INDIA CONSUMPTION",  yahoo: "^CNXCONSUM" },
    "Infrastructure": { nse: "NIFTY INFRASTRUCTURE",     yahoo: "^CNXINFRA" },
    "Media":          { nse: "NIFTY MEDIA",              yahoo: "^CNXMEDIA" },
  },
};
