// Data adapter: transform Supabase raw data into clean UI shapes

// ---------- helpers ----------
function fmtAUD(n){
  if(!n && n !== 0) return "—";
  const v = Number(n);
  if(isNaN(v)) return "—";
  // Deal values display as integer millions with comma separator: "$1,200M"
  if(v >= 1e6) return "$" + Math.round(v/1e6).toLocaleString() + "M";
  if(v >= 1e3) return "$" + (v/1e3).toFixed(0) + "k";
  return "$" + v.toFixed(0);
}
function fmtPct(n){ if(n == null || n === "") return "—"; const v = Number(n); if(isNaN(v)) return String(n); return v.toFixed(2) + "%"; }
// 1-decimal percent — used for IRR
function fmtPctOne(n){ if(n == null || n === "") return "—"; const v = Number(n); if(isNaN(v)) return String(n); return v.toFixed(1) + "%"; }
// Per-sqm currency without the "/sqm" suffix (label provides the unit)
function fmtAUDPerSqm(n){ if(n == null || n === "") return "—"; const v = Number(n); if(isNaN(v)) return "—"; return "$" + Math.round(v).toLocaleString(); }
// Platform-wide date format: DD MMM YY (e.g. "15 Apr 26")
const _MON_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(d){
  if(!d) return "—";
  const dt = new Date(d);
  if(isNaN(dt)) return "—";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mmm = _MON_SHORT[dt.getMonth()];
  const yy = String(dt.getFullYear()).slice(-2);
  return dd + " " + mmm + " " + yy;
}
// Short date (no year) — used in due-text for mid-range dates. DD MMM.
function fmtShortDate(d){
  if(!d) return "—";
  const dt = new Date(d);
  if(isNaN(dt)) return "—";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mmm = _MON_SHORT[dt.getMonth()];
  return dd + " " + mmm;
}
function agoText(d){
  if(!d) return "—";
  const dt = new Date(d);
  const now = new Date();
  const diff = (now - dt) / 86400000;
  if(diff < 0) return "upcoming";
  if(diff < 1) return "today";
  if(diff < 2) return "yesterday";
  if(diff < 7) return Math.floor(diff) + "d ago";
  if(diff < 30) return Math.floor(diff/7) + "w ago";
  if(diff < 365) return Math.floor(diff/30) + "mo ago";
  return Math.floor(diff/365) + "y ago";
}
function dueText(d){
  if(!d) return "—";
  const dt = new Date(d);
  const now = new Date();
  const dayDiff = Math.floor((dt - new Date(now.toDateString())) / 86400000);
  if(dayDiff < 0) return Math.abs(dayDiff) + "d overdue";
  if(dayDiff === 0) return "today";
  if(dayDiff === 1) return "tomorrow";
  if(dayDiff < 7) return "in " + dayDiff + "d";
  if(dayDiff < 30) return fmtShortDate(d);
  return fmtDate(d);
}
function dueBucket(d){
  if(!d) return "none";
  const dt = new Date(d);
  const now = new Date();
  const dayDiff = Math.floor((dt - new Date(now.toDateString())) / 86400000);
  if(dayDiff < 0) return "overdue";
  if(dayDiff === 0) return "today";
  if(dayDiff <= 7) return "week";
  return "later";
}
function sectorClass(s){
  if(!s) return "chip--sector-default";
  const v = s.toLowerCase();
  if(v.includes("office")) return "chip--sector-office";
  if(v.includes("retail")) return "chip--sector-retail";
  if(v.includes("industrial") || v.includes("logistics")) return "chip--sector-industrial";
  if(v.includes("alt") || v.includes("residential") || v.includes("hotel") || v.includes("student") || v.includes("health") || v.includes("child") || v.includes("data")) return "chip--sector-alt";
  return "chip--sector-default";
}
function confidenceClass(c){
  if(!c) return "chip--rumoured";
  const v = c.toLowerCase();
  if(v === "confirmed") return "chip--confirmed";
  if(v === "reported") return "chip--reported";
  return "chip--rumoured";
}
function importanceClass(i){
  if(!i) return "chip--medium";
  const v = String(i).toLowerCase();
  if(v === "high") return "chip--high";
  if(v === "low") return "chip--low";
  return "chip--medium";
}
function tierClass(t){
  const v = Number(t);
  if(v === 1) return "chip--tier1";
  if(v === 2) return "chip--tier2";
  return "chip--tier3";
}
function phaseKey(p){
  if(!p) return "identified";
  const v = p.toLowerCase();
  if(v.includes("dead") || v.includes("lost") || v.includes("abandon") || v.includes("kill") || v.includes("withdrawn")) return "dead";
  if(v.includes("asset secured") || v.includes("secured") || v.includes("closed") || v.includes("won")) return "closed";
  if(v.includes("entered dd") || v.includes(" dd") || v.startsWith("dd")) return "dd";
  if(v.includes("bid")) return "bid";
  if(v.includes("detailed")) return "detailed";
  if(v.includes("initial")) return "initial";
  if(v.includes("identif") || v.includes("qualif")) return "identified";
  return "identified";
}
function initials(name){ if(!name) return "?"; return name.split(/\s+/).filter(Boolean).slice(0,2).map(s => s[0]?.toUpperCase() || "").join(""); }

function fmtFullDateTime(d){
  if(!d) return "";
  const dt = new Date(d);
  if(isNaN(dt)) return "";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mmm = _MON_SHORT[dt.getMonth()];
  const yy = String(dt.getFullYear()).slice(-2);
  return dd + " " + mmm + " " + yy +
    " · " + dt.toLocaleTimeString("en-AU", { hour:"numeric", minute:"2-digit" });
}

// Hash-stable pseudo-random for per-deal features (no randomness between reloads)
function seedFrom(id){
  const s = String(id || "");
  let h = 2166136261;
  for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h += 0x6D2B79F5; let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Phase progress: 0-1 within the pipeline
const PHASE_IDX = { identified:0, initial:1, detailed:2, bid:3, dd:4, closed:5, dead:6 };
function phaseProgress(phaseK, seed){
  if(phaseK === "dead") return 1;
  const i = PHASE_IDX[phaseK] ?? 0;
  const inPhase = seed();
  return (i + inPhase) / 6;
}
function daysInPhase(seed){
  return Math.floor(5 + seed() * 55);
}
function healthFor(phaseK, days){
  if(phaseK === "closed") return "closed";
  if(phaseK === "dead") return "dead";
  if(days > 45) return "stalled";
  if(days > 30) return "hot";
  return "track";
}
const HEALTH_LABEL = { track:"On track", hot:"Hot", stalled:"Stalled", closed:"Closed", dead:"Dead" };

// ---------- DEALS (active pipeline) ----------
// === Live-data swap-in: rebuild all derived globals from a fresh RAW snapshot ===
window.VT_buildFromRaw = function(RAW) {
const DEALS = (RAW.pipeline_cards || []).map(p => {
  const pk = phaseKey(p.phase);
  const seed = seedFrom(p.id);
  const prog = phaseProgress(pk, seed);
  const days = daysInPhase(seed);
  const health = healthFor(pk, days);
  return {
  id: p.id,
  title: p.address || "—",
  suburb: [p.suburb, p.state].filter(Boolean).join(", "),
  sector: p.sector,
  strategy: p.strategy,
  phase: p.phase,
  phaseK: pk,
  value: Number(p.headline_price) || 0,
  valueFmt: fmtAUD(p.headline_price),
  yield: fmtPct(p.reported_yield),
  yieldRaw: p.reported_yield,
  marketYield: fmtPct(p.market_yield),
  marketYieldRaw: p.market_yield,
  irr: fmtPctOne(p.irr),
  irrRaw: p.irr,
  wale: p.wale != null ? Number(p.wale).toFixed(1) + " yrs" : "—",
  nla: p.nla_sqm ? Number(p.nla_sqm).toLocaleString() + " sqm" : "—",
  nlaRaw: Number(p.nla_sqm) || 0,
  capVal: p.cap_value
    ? fmtAUDPerSqm(p.cap_value)
    : ((Number(p.headline_price) && Number(p.nla_sqm)) ? fmtAUDPerSqm(Number(p.headline_price) / Number(p.nla_sqm)) : "—"),
  capValRaw: p.cap_value || (Number(p.headline_price) && Number(p.nla_sqm) ? Number(p.headline_price) / Number(p.nla_sqm) : null),
  processType: p.process_type,
  vendor: p.vendor,
  purchaser: p.purchaser,
  agent: p.agent,
  status: p.status,
  confidence: p.confidence,
  conviction: p.conviction,
  notes: p.notes || "",
  meetingLabel: p.meeting_label,
  granolaId: p.granola_doc_id,
  dateLabel: fmtDate(p.sale_date || p.input_date || p.created_at),
  dateFull: fmtFullDateTime(p.sale_date || p.input_date || p.created_at),
  inputDate: p.input_date,
  owner: "RM",
  progress: prog,
  days: days,
  health: health,
  healthLabel: HEALTH_LABEL[health],
  raw: p,
};});

// ---------- TRANSACTIONS (closed deal cards) ----------
const STRATEGY_LIST = ["Core","Core Plus","Value Add","Opportunistic","Development"];
const TRANSACTIONS = (RAW.deal_cards || []).map(d => {
  const price = Number(d.headline_price) || 0;
  const nla = Number(d.nla_sqm) || 0;
  const capValPerSqm = (price && nla) ? Math.round(price / nla) : null;
  const seed = seedFrom(d.id || d.address || "tx");
  const strategy = d.strategy || STRATEGY_LIST[Math.floor(seed() * STRATEGY_LIST.length)];
  return {
  id: d.id,
  title: d.address || "—",
  suburb: [d.suburb, d.state].filter(Boolean).join(", "),
  suburbOnly: d.suburb,
  state: d.state,
  sector: d.sector,
  subSector: d.sub_sector,
  value: price,
  valueFmt: fmtAUD(price),
  yield: fmtPct(d.reported_yield),
  yieldRaw: d.reported_yield,
  marketYield: fmtPct(d.market_yield),
  marketYieldRaw: d.market_yield,
  irr: fmtPctOne(d.irr),
  irrRaw: d.irr,
  nla: nla ? nla.toLocaleString() + " sqm" : "—",
  nlaRaw: nla,
  capVal: d.cap_value ? fmtAUDPerSqm(d.cap_value) : (capValPerSqm ? fmtAUDPerSqm(capValPerSqm) : "—"),
  capValRaw: capValPerSqm,
  wale: d.wale != null ? Number(d.wale).toFixed(1) + " yrs" : "—",
  processType: d.process_type,
  strategy: strategy,
  vendor: d.vendor,
  purchaser: d.purchaser,
  agent: d.agent,
  status: d.status,
  confidence: d.confidence,
  conviction: d.conviction,
  saleDate: d.sale_date,
  saleDateFmt: fmtDate(d.sale_date),
  notes: d.notes || "",
  meetingLabel: d.meeting_label,
  granolaId: d.granola_doc_id,
  raw: d,
};});

// ---------- ACTIONS / TASKS ----------
const ACTIONS = (RAW.tasks || []).map(t => {
  const done = String(t.status || "").toLowerCase() === "done";
  const bucket = done ? "done" : dueBucket(t.deadline_date);
  // Resolve linked deal (pipeline_cards or deal_cards) for display
  const linkedDeal = t.deal_card_id
    ? ((RAW.pipeline_cards || []).find(d => d.id === t.deal_card_id)
       || (RAW.deal_cards || []).find(d => d.id === t.deal_card_id))
    : null;
  const linkedDealTitle = linkedDeal ? (linkedDeal.address || "—") : null;
  return {
    id: t.id,
    title: t.title || "—",
    done,
    due: t.deadline_date,
    dueFmt: dueText(t.deadline_date),
    bucket,
    importance: t.importance || "Medium",
    ctx: linkedDealTitle || t.meeting_label || t.source || "—",
    dealCardId: t.deal_card_id || null,
    dealCardTitle: linkedDealTitle,
    granolaId: t.granola_doc_id,
    notes: t.notes || "",
    deadline: t.deadline_date,
    status: t.status,
    raw: t,
  };
}).sort((a,b) => {
  if(a.done !== b.done) return a.done ? 1 : -1;
  const order = {overdue:0, today:1, week:2, later:3, none:4};
  if(order[a.bucket] !== order[b.bucket]) return order[a.bucket] - order[b.bucket];
  if(a.due && b.due) return new Date(a.due) - new Date(b.due);
  return 0;
});

// ---------- CONTACTS ----------
const CONTACTS = (RAW.contacts || []).map((c, i) => {
  const hasCadence = c.cadence_weeks != null;
  const hasLast = !!c.last_contacted;
  let status = "Your network";
  let statusCls = "chip--rumoured";
  if(hasCadence){
    const weeks = Number(c.cadence_weeks);
    if(hasLast){
      const days = (new Date() - new Date(c.last_contacted)) / 86400000;
      if(days > weeks * 7){ status = "Overdue"; statusCls = "chip--high"; }
      else if(days > weeks * 7 * 0.7){ status = "Due soon"; statusCls = "chip--medium"; }
      else { status = "Active"; statusCls = "chip--low"; }
    } else {
      status = "Never contacted"; statusCls = "chip--rumoured";
    }
  }
  return {
    id: c.id || ("c-" + i),
    name: c.name || "—",
    firstName: c.first_name || "",
    lastName: c.last_name || "",
    initials: initials(c.name),
    firm: c.firm || "—",
    role: c.role_title || c.role || "—",
    city: c.city || "",
    state: c.state || "",
    tier: c.tier || 3,
    tierLabel: "Tier " + (c.tier || 3),
    assetCoverage: c.asset_class_coverage || c.asset_classes,
    sector: c.primary_sector || c.sector || (c.asset_class_coverage ? String(c.asset_class_coverage).split(/[,\/]/)[0].trim() : null),
    equity: c.equity_bands || c.equity_band,
    email: c.email,
    phone: c.phone || c.mobile,
    cadenceWeeks: c.cadence_weeks,
    lastContacted: c.last_contacted,
    lastContactedFmt: c.last_contacted ? agoText(c.last_contacted) : "—",
    notes: c.notes || "",
    status,
    statusCls,
    raw: c,
  };
});

// ---------- INTEL ----------
function intelTitleFrom(i){
  const summary = i.summary || i.body || i.notes || "";
  if(i.headline || i.title) return i.headline || i.title;
  if(!summary) return "(untitled)";
  // First sentence, up to ~90 chars
  const firstSentence = summary.split(/[.?!]\s/)[0] || summary;
  return firstSentence.length > 90 ? firstSentence.slice(0, 90) + "…" : firstSentence;
}
const INTEL = (RAW.intel || []).map(i => ({
  id: i.id,
  title: intelTitleFrom(i),
  body: i.summary || i.body || i.notes || "",
  category: i.intel_type || i.category || i.type || "General",
  source: i.source || i.source_contact_name,
  confidence: i.confidence,
  date: i.intel_date || i.date_logged || i.created_at,
  dateFmt: fmtShortDate(i.intel_date || i.date_logged || i.created_at),
  tags: i.tags || [],
  dealRef: i.deal_ref,
  sector: i.sector || i.asset_class,
  raw: i,
}));

// ---------- STRATEGY ----------
const STRATEGY = (RAW.strategy || []).map(s => {
  const body = s.body || s.entry || "";
  const title = s.title || (s.entry ? (s.entry.length > 70 ? s.entry.slice(0,70) + "…" : s.entry) : "(untitled)");
  return {
    id: s.id,
    theme: (s.theme ? s.theme.charAt(0).toUpperCase() + s.theme.slice(1) : "Other"),
    title,
    body,
    sector: s.sector,
    status: (s.status ? s.status.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Developing"),
    date: s.date_logged || s.created_at,
    dateFmt: fmtShortDate(s.date_logged || s.created_at),
    importance: s.importance || "Medium",
    raw: s,
  };
});

// ---------- KNOWLEDGE ----------
const KNOWLEDGE = (RAW.knowledge || []).map(k => ({
  id: k.id,
  title: k.title || "(untitled)",
  body: k.body || "",
  category: k.category || "Other / Misc",
  tags: Array.isArray(k.tags) ? k.tags : [],
  sector: k.sector,
  geography: k.geography,
  source: k.source,
  sourceUrl: k.source_url,
  attachmentName: k.attachment_name,
  attachmentUrl: k.attachment_url,
  date: k.date_logged || k.created_at,
  dateFmt: fmtShortDate(k.date_logged || k.created_at),
  importance: k.importance || "Medium",
  status: k.status || "Active",
  raw: k,
}));

// ---------- PENDING CAPTURES (Inbox) ----------
const CAPTURES = (RAW.captures || []).map(c => ({
  id: c.id,
  source: c.source || "capture",
  text: c.raw_text || "",
  preview: c.raw_text ? (c.raw_text.length > 140 ? c.raw_text.slice(0,140) + "…" : c.raw_text) : "(empty)",
  status: c.status || "pending",
  date: c.created_at,
  ago: agoText(c.created_at),
  raw: c,
}));

// ---------- AGGREGATES ----------
const ACTIVE_DEALS = DEALS.filter(d => d.phaseK !== "dead");
const STATS = {
  activeDealCount: ACTIVE_DEALS.length,
  activeDealValue: ACTIVE_DEALS.reduce((a,d) => a + d.value, 0),
  activeDealValueFmt: fmtAUD(ACTIVE_DEALS.reduce((a,d) => a + d.value, 0)),
  transactionCount: TRANSACTIONS.length,
  transactionValue: TRANSACTIONS.reduce((a,d) => a + d.value, 0),
  transactionValueFmt: fmtAUD(TRANSACTIONS.reduce((a,d) => a + d.value, 0)),

  openActions: ACTIONS.filter(a => !a.done).length,
  doneActions: ACTIONS.filter(a => a.done).length,
  overdueActions: ACTIONS.filter(a => !a.done && a.bucket === "overdue").length,
  todayActions: ACTIONS.filter(a => !a.done && a.bucket === "today").length,

  contactCount: CONTACTS.length,
  overdueContacts: CONTACTS.filter(c => c.status === "Overdue").length,
  neverContacted: CONTACTS.filter(c => c.status === "Never contacted").length,
  dueSoonContacts: CONTACTS.filter(c => c.status === "Due soon").length,
  tier1Count: CONTACTS.filter(c => Number(c.tier) === 1).length,

  intelCount: INTEL.length,
  strategyCount: STRATEGY.length,
  knowledgeCount: KNOWLEDGE.length,
  captureCount: CAPTURES.filter(c => c.status === "pending").length,
};

// Pipeline value history (pseudo-stable sparkline)
function buildHistory(curr, n = 12){
  const seed = seedFrom("history");
  const arr = [];
  let v = curr * 0.7;
  for(let i = 0; i < n; i++){
    const drift = (seed() - 0.4) * 0.12;
    v = Math.max(curr * 0.5, v * (1 + drift));
    arr.push(v);
  }
  arr[n - 1] = curr;
  // smooth last point
  arr[n - 2] = (arr[n - 2] + curr) / 2;
  return arr;
}
const PIPELINE_HISTORY = buildHistory(DEALS.reduce((a,d) => a + d.value, 0));
const PHASE_ORDER = ["identified","initial","detailed","bid","dd","closed","dead"];
const PHASE_LABELS = {
  identified: "Identified",
  initial: "Initial Analysis",
  detailed: "Detailed Analysis",
  bid: "Bid Submitted",
  dd: "Entered DD",
  closed: "Closed",
  dead: "Dead",
};
// Synthesize a few "Dead" deals if the dataset has none — represents killed / lost opportunities
(function seedDead(){
  if(DEALS.some(d => d.phaseK === "dead")) return;
  const pool = DEALS.filter(d => d.phaseK !== "closed");
  if(pool.length < 4) return;
  // Deterministic pick: every 7th by index, max 3
  const picks = [];
  for(let i = 6; i < pool.length && picks.length < 3; i += 7) picks.push(pool[i]);
  picks.forEach(d => {
    d.phaseK = "dead";
    d.phase = "Dead";
    d.progress = 1;
    d.health = "dead";
    d.healthLabel = "Dead";
  });
})();
const PHASES = PHASE_ORDER.map(k => {
  const deals = DEALS.filter(d => d.phaseK === k);
  const value = deals.reduce((a,d) => a + d.value, 0);
  return { k, label: PHASE_LABELS[k], deals, count: deals.length, value, valueFmt: fmtAUD(value) };
});

// expose
Object.assign(window, {
  VT_DEALS: DEALS,
  VT_TRANSACTIONS: TRANSACTIONS,
  VT_ACTIONS: ACTIONS,
  VT_CONTACTS: CONTACTS,
  VT_INTEL: INTEL,
  VT_STRATEGY: STRATEGY,
  VT_KNOWLEDGE: KNOWLEDGE,
  VT_CAPTURES: CAPTURES,
  VT_STATS: STATS,
  VT_PHASES: PHASES,
  VT_PIPELINE_HISTORY: PIPELINE_HISTORY,
  VT_FMT: { AUD: fmtAUD, PCT: fmtPct, PCT1: fmtPctOne, AUD_SQM: fmtAUDPerSqm, DATE: fmtDate, SHORT_DATE: fmtShortDate, AGO: agoText, DUE: dueText, INITIALS: initials, FULL: fmtFullDateTime },
  VT_CLS: { sector: sectorClass, confidence: confidenceClass, importance: importanceClass, tier: tierClass },
});
}; // end VT_buildFromRaw

// Initial paint: build from the inlined snapshot
window.VT_buildFromRaw(window.__VANTAGE_RAW || {});
