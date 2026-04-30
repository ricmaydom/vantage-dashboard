// Root app
const { useState: useStateA, useEffect: useEffectA, useMemo: useMemoA, useCallback: useCallbackA, useRef: useRefA } = React;

// Australian CRE agencies — used by Agent dropdown across drawers.
const AGENT_OPTS = ["Savills","Colliers","CBRE","Knight Frank","JLL","Cushman & Wakefield","AND Property","CG Property Group","Dawkins Occhiuto","Fitzroys","Leedwell Property","Stonebridge Property Group","Acton Commercial","Agency HQ Commercial","Ainsworth Property","Allard Shelton","Aston Commercial","Bawdens Industrial","Belle Property Commercial","Beller Commercial","Blue Commercial","Buxton Commercial","Cadigal","Century 21 Commercial","Charter Keck Cramer","CI Australia","Comac Retail Property Group","Commercial Collective","Conquest Estate Agency","Crabtrees Real Estate","Crew Commercial","CRS Property","CVA Property Consultants","Cygnet West","Darcy Jarman","Elders Commercial","Facey Property","First National Commercial","Gartland","GJS Property","Gorman Commercial","GormanKelly","GrayJohnson","Gross Waddell ICR","Harcourts Commercial","Industry Property Group","Jellis Craig Commercial","Jones Real Estate","Just Commercial","Karbon Property","LAWD","Lease Equity","Lemon Baxter","LINK Property Services","LJ Hooker Commercial","m3 Property","M5 Industrial Property Services","McGees Property","Melbourne Commercial Group","Metro Commercial","Modus Property Group","MP Burke Commercial Real Estate","Next Commercial","Nichols Crowder","One Commercial","Pace Property","Parkside Commercial","Professionals Commercial","Raine & Horne Commercial","Ratio Commercial","Ray White Commercial","RCL Group","Realmark Commercial","Rutherfords Real Estate","Smith Partners Real Estate","SQM Commercial","Stanton Hillier Parker","Sterling Property","Sutherland Farrelly","Sutton Anderson","Tenant Leasing Group","Tenant Representation Services","Teska Carson","TG Property","The Agency Commercial","Think Commercial","Turner Real Estate","Vinci Carbone","X Commercial","—"];

// UUID generator with fallback for older browsers
const _genUUID = () => (typeof crypto !== 'undefined' && crypto.randomUUID)
  ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c==='x' ? r : (r&0x3|0x8)).toString(16); });

const NAV = [
  { group: "Daily" },
  { id: "dashboard", label: "Dashboard", icon: "dashboard", badge: () => null },
  { id: "actions", label: "Actions", icon: "check", badge: () => window.VT_STATS.openActions || null, badgeTone: () => window.VT_STATS.overdueActions > 0 ? "hot" : null },
  { group: "Relationships" },
  { id: "crm", label: "CRM", icon: "users", badge: () => window.VT_STATS.overdueContacts || null, badgeTone: () => "warm" },
  { group: "Deals & Leasing" },
  { id: "pipeline", label: "Pipeline", icon: "target", badge: () => window.VT_STATS.activeDealCount || null },
  { id: "deals", label: "Deals", icon: "building", badge: () => null },
  { id: "leasing", label: "Leasing", icon: "doc", badge: () => null },
  { group: "Intelligence" },
  { id: "intel", label: "Market Intel", icon: "radar", badge: () => null },
  { id: "strategy", label: "Strategy", icon: "idea", badge: () => null },
  { id: "knowledge", label: "Knowledge", icon: "doc", badge: () => null },
  { group: "System" },
  { id: "review", label: "Review", icon: "check", badge: () => window.VT_PENDING_COUNT || null, badgeTone: () => window.VT_PENDING_COUNT > 0 ? "warm" : null },
];

const TITLES = {
  dashboard: ["Today", "Dashboard"],
  actions: ["Work", "Actions"],
  crm: ["Relationships", "CRM"],
  pipeline: ["Deals & Leasing", "Pipeline"],
  deals: ["Deals & Leasing", "Deals"],
  leasing: ["Deals & Leasing", "Leasing Cards"],
  intel: ["Intelligence", "Market Intel"],
  strategy: ["Intelligence", "Strategy & Ideas"],
  knowledge: ["Intelligence", "Knowledge"],
  review: ["System", "Pending Review"],
};

// Flag keys to surface
const FLAG_KEYS = ["valueHero","statusDots","stickyHeaders","commandK","keyboardNav","emptyCTA","microMotion","relTime","leoStrip","sparkline","pipelineFlow","printView"];

function App(){
  const [view, setView] = useStateA(() => localStorage.getItem("vt:view") || "dashboard");
  useEffectA(() => localStorage.setItem("vt:view", view), [view]);

  const [theme, setTheme] = useStateA(() => localStorage.getItem("vt:theme") || window.TWEAK_DEFAULTS.theme || "light");
  const [density, setDensity] = useStateA(() => localStorage.getItem("vt:density") || window.TWEAK_DEFAULTS.density || "comfortable");

  // flags — each can be toggled in tweaks; default from TWEAK_DEFAULTS, persisted to localStorage
  const readFlag = (k) => {
    const ls = localStorage.getItem("vt:flag:" + k);
    if(ls === null) return !!window.TWEAK_DEFAULTS[k];
    return ls === "1";
  };
  const [flags, setFlagsState] = useStateA(() => {
    const f = {};
    FLAG_KEYS.forEach(k => f[k] = readFlag(k));
    return f;
  });
  const setFlag = (k, v) => {
    setFlagsState(prev => ({ ...prev, [k]: v }));
    localStorage.setItem("vt:flag:" + k, v ? "1" : "0");
    persist({ [k]: v });
  };

  useEffectA(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("vt:theme", theme);
  }, [theme]);
  useEffectA(() => {
    document.body.setAttribute("data-density", density);
    localStorage.setItem("vt:density", density);
  }, [density]);
  useEffectA(() => {
    // Body flags for CSS
    document.body.setAttribute("data-micro-motion", flags.microMotion ? "on" : "off");
  }, [flags.microMotion]);

  // Leo strip dismissal
  const [leoDismissed, setLeoDismissed] = useStateA(() => localStorage.getItem("vt:leoDismissed") === "1");
  useEffectA(() => { localStorage.setItem("vt:leoDismissed", leoDismissed ? "1" : "0"); }, [leoDismissed]);

  // Sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = useStateA(() => localStorage.getItem("vt:sidebar") === "collapsed");
  useEffectA(() => { localStorage.setItem("vt:sidebar", sidebarCollapsed ? "collapsed" : "expanded"); }, [sidebarCollapsed]);

  // Mobile nav (off-canvas drawer)
  const [mobileNavOpen, setMobileNavOpen] = useStateA(false);
  useEffectA(() => {
    // Close mobile nav on resize above breakpoint
    const onResize = () => { if(window.innerWidth > 760) setMobileNavOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // drawer state
  const [bumpKey, setBumpKey] = useStateA(0);

  // === Drawer-edit persistence helpers =================================
  // Parse a display-formatted date ("21 Apr 26") back to ISO ("2026-04-21").
  const _parseDisplayDate = (s) => {
    if(!s || s === "—") return null;
    const dt = new Date(s);
    if(!isNaN(dt) && /^\d{4}-\d{2}-\d{2}/.test(String(s))) return String(s).slice(0,10);
    if(!isNaN(dt) && String(s).match(/\d{1,2}\s\w{3}\s\d{2,4}/)){
      return dt.toISOString().slice(0,10);
    }
    const m = String(s).match(/^(\d{1,2})[\s\-](\w{3})[\s\-](\d{2,4})$/);
    if(m){
      const months = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
      const mon = months[m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase()];
      if(mon != null){
        let yr = Number(m[3]); if(yr < 100) yr += 2000;
        const d2 = new Date(yr, mon, Number(m[1]));
        if(!isNaN(d2)) return d2.toISOString().slice(0,10);
      }
    }
    if(!isNaN(dt)) return dt.toISOString().slice(0,10);
    return null;
  };
  // Parse a value-formatted number ("$42.2M", "5.5%", "3.0") to a number.
  const _parseNum = (s) => {
    if(s == null || s === "" || s === "—") return null;
    const str = String(s);
    const cleaned = str.replace(/[^\d.\-]/g, '');
    if(!cleaned) return null;
    let n = Number(cleaned);
    if(isNaN(n)) return null;
    if(/[Mm]\b/.test(str)) n = n * 1_000_000;
    else if(/[Bb]\b/.test(str)) n = n * 1_000_000_000;
    return n;
  };
  // Drawer-key → DB-column map for contacts.
  const _mapContactPatch = (patch) => {
    const M = { name:'name', firm:'firm', role:'role_title', tier:'relationship_tier',
                email:'email', phone:'business_phone', cadenceWeeks:'cadence_weeks',
                notes:'relationship_notes',
                firstName:'first_name', lastName:'last_name',
                city:'city', state:'state' };
    const out = {};
    for(const k in patch){
      if(M[k]) out[M[k]] = patch[k];
      else if(k === 'sector') out.asset_class_coverage = patch[k];
      else if(k === 'lastContactedFmt') out.last_contact_date = _parseDisplayDate(patch[k]);
      else if(k === 'lastContactSummary') out.last_contact_summary = patch[k];
    }
    return out;
  };
  // Drawer-key → DB-column map for pipeline_cards.
  const _mapPipelinePatch = (patch) => {
    const M = { sector:'sector', phase:'phase', title:'address', suburb:'suburb', state:'state',
                vendor:'vendor', purchaser:'purchaser', agent:'agent', notes:'notes',
                confidence:'confidence', conviction:'conviction', strategy:'strategy',
                processType:'process_type' };
    const out = {};
    for(const k in patch){
      if(M[k]) out[M[k]] = patch[k];
      else if(k === 'valueFmt') out.headline_price = _parseNum(patch[k]);
      else if(k === 'yield') out.reported_yield = _parseNum(patch[k]);
      else if(k === 'marketYield') out.market_yield = _parseNum(patch[k]);
      else if(k === 'irr') out.irr = _parseNum(patch[k]);
      else if(k === 'capVal') out.cap_value = _parseNum(patch[k]);
      else if(k === 'wale') out.wale = _parseNum(patch[k]);
      else if(k === 'nla') out.nla_sqm = _parseNum(patch[k]);
    }
    return out;
  };
  // Drawer-key → DB-column map for deal_cards (closed/comparable trades).
  const _mapDealPatch = (patch) => {
    const out = _mapPipelinePatch(patch); // shared base fields including market_yield, irr, cap_value
    for(const k in patch){
      if(k === 'saleDateFmt') out.sale_date = _parseDisplayDate(patch[k]);
      else if(k === 'subSector') out.sub_sector = patch[k];
      else if(k === 'isComparable') out.is_comparable = !!patch[k];
    }
    return out;
  };
  // Drawer-key → DB-column map for tasks.
  const _mapTaskPatch = (patch) => {
    const M = { title:'title', importance:'importance', notes:'notes',
                deal_card_id:'deal_card_id', contact_id:'contact_id',
                leasing_card_id:'leasing_card_id', category:'category' };
    const out = {};
    for(const k in patch){
      if(M[k]) out[M[k]] = patch[k];
      else if(k === 'dueFmt') out.deadline_date = _parseDisplayDate(patch[k]);
      else if(k === 'done') out.status = patch[k] ? 'Done' : 'Open';
      else if(k === 'status') out.status = patch[k];
    }
    return out;
  };
  // Drawer-key → DB-column map for intel_records.
  const _mapIntelPatch = (patch) => {
    const M = { category:'intel_type', confidence:'confidence', sector:'sector',
                strategy:'strategy', geography:'geography', grade:'grade',
                source:'source' };
    const out = {};
    for(const k in patch){
      if(M[k]) out[M[k]] = patch[k];
      else if(k === 'dateFmt') out.intel_date = _parseDisplayDate(patch[k]);
      else if(k === 'body') out.summary = patch[k];
      else if(k === 'title') out.summary = patch[k]; // title is computed; if user edits, treat as summary edit
    }
    return out;
  };
  // Drawer-key → DB-column map for strategy_ideas.
  const _mapStrategyPatch = (patch) => {
    const M = { theme:'theme', sector:'sector', status:'status',
                importance:'importance', title:'title', body:'body',
                connections:'connections' };
    const out = {};
    for(const k in patch){
      if(M[k]) out[M[k]] = patch[k];
      else if(k === 'dateFmt') out.date_logged = _parseDisplayDate(patch[k]);
    }
    return out;
  };
  // Drawer-key → DB-column map for knowledge_base.
  const _mapKnowledgePatch = (patch) => {
    const M = { title:'title', body:'body', category:'category', tags:'tags',
                sector:'sector', geography:'geography', source:'source',
                sourceUrl:'source_url', source_url:'source_url',
                attachmentName:'attachment_name', attachmentUrl:'attachment_url',
                importance:'importance', status:'status' };
    const out = {};
    for(const k in patch){
      if(M[k]) out[M[k]] = patch[k];
      else if(k === 'dateFmt') out.date_logged = _parseDisplayDate(patch[k]);
    }
    return out;
  };
  // Drawer-key → DB-column map for leasing_cards.
  const _mapLeasePatch = (patch) => {
    const M = { tenancy:'tenancy', address:'address', suburb:'suburb', state:'state', sector:'sector',
                sub_sector:'sub_sector', tenant:'tenant', landlord:'landlord', agent:'agent',
                lease_type:'lease_type', status:'status', confidence:'confidence', notes:'notes' };
    const out = {};
    for(const k in patch){
      if(M[k]) out[M[k]] = patch[k];
      else if(k === 'area_sqm') out.area_sqm = _parseNum(patch[k]);
      else if(k === 'term_years') out.term_years = _parseNum(patch[k]);
      else if(k === 'face_rent') out.face_rent = _parseNum(patch[k]);
      else if(k === 'effective_rent') out.effective_rent = _parseNum(patch[k]);
      else if(k === 'incentive_pct') out.incentive_pct = _parseNum(patch[k]);
      else if(k === 'lease_date_fmt') out.lease_date = _parseDisplayDate(patch[k]);
      else if(k === 'is_comparable') out.is_comparable = !!patch[k];
    }
    return out;
  };

  // Persist a mapped patch to Supabase. Tracked in a global pending-writes set
  // so the Master Refresh can wait for all in-flight writes to settle before
  // re-fetching (avoids drag-drop moves being overwritten by a stale fetch).
  const _persistPatch = async (table, id, dbPatch) => {
    const sb = window.__vantageAuth;
    if(!sb || !id || !dbPatch || Object.keys(dbPatch).length === 0) return;
    if(!window.__VT_PENDING_WRITES) window.__VT_PENDING_WRITES = new Set();
    const writeKey = Symbol(`${table}:${id}`);
    window.__VT_PENDING_WRITES.add(writeKey);
    try {
      const { error } = await sb.from(table).update(dbPatch).eq('id', id);
      if(error){
        console.warn(`[Vantage] save ${table} failed:`, error);
        showToast(`Save failed: ${error.message || 'unknown error'}`);
        return error;
      }
    } catch(e){
      console.warn(`[Vantage] save ${table} threw:`, e);
      showToast('Save failed — connection error');
      return e;
    } finally {
      window.__VT_PENDING_WRITES.delete(writeKey);
    }
  };
  // Wait for all in-flight DB writes to settle (with a safety timeout).
  const _awaitPendingWrites = async (timeoutMs = 5000) => {
    const start = Date.now();
    while(window.__VT_PENDING_WRITES && window.__VT_PENDING_WRITES.size > 0){
      if(Date.now() - start > timeoutMs) break;
      await new Promise(r => setTimeout(r, 50));
    }
  };
  // Delete a row from Supabase. Returns true on success.
  const _persistDelete = async (table, id) => {
    const sb = window.__vantageAuth;
    if(!sb || !id) return false;
    try {
      const { error } = await sb.from(table).delete().eq('id', id);
      if(error){
        console.warn(`[Vantage] delete ${table} failed:`, error);
        showToast(`Delete failed: ${error.message || 'unknown error'}`);
        return false;
      }
      return true;
    } catch(e){
      console.warn(`[Vantage] delete ${table} threw:`, e);
      showToast('Delete failed — connection error');
      return false;
    }
  };
  // Map drawer.kind -> Supabase table name (used by onDelete in drawerFooter)
  const _kindToTable = {
    deal: 'pipeline_cards',
    tx: 'deal_cards',
    lease: 'leasing_cards',
    contact: 'contacts',
    intel: 'intel_records',
    strategy: 'strategy_ideas',
    knowledge: 'knowledge_base',
    action: 'tasks',
  };
  // phaseK -> DB-stored phase label (used by Pipeline drag-drop)
  const _PHASE_LABEL_BY_KEY = {
    identified: "Identified",
    initial: "Initial Analysis",
    detailed: "Detailed Analysis",
    bid: "Bid Submitted",
    dd: "Entered DD",
    closed: "Closed",
    dead: "Dead",
  };
  const updatePhase = async (dealId, newPhaseK) => {
    const dbLabel = _PHASE_LABEL_BY_KEY[newPhaseK] || newPhaseK;
    const d = (window.VT_DEALS || []).find(x => x.id === dealId);
    const oldLabel = d ? d.phase : null;
    const oldKey = d ? d.phaseK : null;
    // Optimistic: mutate local immediately so UI is snappy
    if(d){ d.phase = dbLabel; d.phaseK = newPhaseK; }
    setBumpKey(k => k + 1);
    // Persist; revert on failure
    const err = await _persistPatch('pipeline_cards', dealId, { phase: dbLabel });
    if(err){
      if(d){ d.phase = oldLabel; d.phaseK = oldKey; }
      setBumpKey(k => k + 1);
    }
  };
  // === end drawer-edit persistence helpers =============================


  // === Live Supabase swap-in ============================================
  // First paint uses the inlined snapshot (window.__VANTAGE_RAW). On mount,
  // pull fresh data from Supabase and rebuild the derived globals. Adapter
  // exposes window.VT_buildFromRaw(RAW) for re-runnable transformation.
  // Reusable fetch — used both on mount and from the master Refresh button.
  const fetchAllTables = useCallbackA(async () => {
    const sb = window.__vantageAuth;
    if(!sb || typeof window.VT_buildFromRaw !== 'function') return false;
    try {
      const [pipe, deals, tasks, contacts, intel, strategy, captures, leasingRows, knowledge] = await Promise.all([
        sb.from('pipeline_cards').select('*'),
        sb.from('deal_cards').select('*'),
        sb.from('tasks').select('id,title,date_logged,deadline_date,importance,status,notes,category,reminder_date,contact_id,deal_card_id,leasing_card_id,meeting_id,meeting_label,granola_doc_id,created_at,updated_at'),
        sb.from('contacts').select('id,name,first_name,last_name,firm,firm_type,role_title,profession,email,mobile,phone:business_phone,tier:relationship_tier,last_contacted:last_contact_date,last_contact_summary,relationship_notes,cadence_weeks,asset_class_coverage,city,state,linkedin_url,created_at,updated_at'),
        sb.from('intel_records').select('*'),
        sb.from('strategy_ideas').select('*'),
        sb.from('pending_captures').select('*'),
        sb.from('leasing_cards').select('*'),
        sb.from('knowledge_base').select('*'),
      ]);
      const responses = [pipe, deals, tasks, contacts, intel, strategy, captures, leasingRows, knowledge];
      const errs = responses.map(r => r.error).filter(Boolean);
      if(errs.length){ console.warn('[Vantage] live fetch errors:', errs); return false; }
      const RAW = {
        pipeline_cards: pipe.data || [],
        deal_cards:     deals.data || [],
        tasks:          tasks.data || [],
        contacts:       contacts.data || [],
        intel:          intel.data || [],
        strategy:       strategy.data || [],
        captures:       captures.data || [],
        leases:         leasingRows.data || [],
        knowledge:      knowledge.data || [],
      };
      if(typeof setLeases === 'function') setLeases(leasingRows.data || []);
      window.__VANTAGE_RAW = RAW;
      window.VT_buildFromRaw(RAW);
      try {
        const { count } = await sb.from('pending_review').select('id', { count: 'exact', head: true }).eq('status','pending');
        window.VT_PENDING_COUNT = count || 0;
      } catch(_){}
      setBumpKey(k => k + 1);
      console.log('[Vantage] live data loaded:', Object.fromEntries(Object.entries(RAW).map(([k,v]) => [k, v.length])));
      return true;
    } catch(e) {
      console.warn('[Vantage] live fetch failed:', e);
      try { showToast && showToast('Live fetch failed: ' + (e && e.message || 'unknown')); } catch(_){}
      return false;
    }
  }, []);

  useEffectA(() => {
    fetchAllTables().then(ok => {
      if(!ok){
        // Nothing arrived. Surface this to the user (silent empty pages were confusing).
        try { showToast && showToast('No data loaded — try Refresh, or sign out and back in.'); } catch(_){}
      }
    });
  }, []);

  const [drawer, setDrawer] = useStateA({ open: false, kind: null, record: null });
  const openDeal = (d) => setDrawer({ open: true, kind: "deal", record: d });
  const openTx = (t) => setDrawer({ open: true, kind: "tx", record: t });
  const openLease = (l) => setDrawer({ open: true, kind: "lease", record: l });
  const openContact = (c) => setDrawer({ open: true, kind: "contact", record: c });
  const openIntel = (i) => setDrawer({ open: true, kind: "intel", record: i });
  const openStrategy = (s) => setDrawer({ open: true, kind: "strategy", record: s });
  const openKnowledge = (k) => setDrawer({ open: true, kind: "knowledge", record: k });
  const openAction = (a) => setDrawer({ open: true, kind: "action", record: a });
  const closeDrawer = () => setDrawer({ open: false, kind: null, record: null });

  // Action edits — DB is source of truth (tasks). Legacy localStorage layer dropped.
  useEffectA(() => { try { localStorage.removeItem("vt:actionEdits"); } catch(_){} }, []);
  const normalizeDateLike = (v) => {
    if(!v || v === "—") return v;
    const dt = new Date(v);
    if(!isNaN(dt) && /^\d{4}-\d{2}-\d{2}/.test(String(v))){
      return window.VT_FMT ? window.VT_FMT.DATE(v) : v;
    }
    return v;
  };
  const sanitizePatch = (patch) => {
    const out = { ...patch };
    if(out.dueFmt) out.dueFmt = normalizeDateLike(out.dueFmt);
    return out;
  };
  const updateAction = (id, patch) => {
    const clean = sanitizePatch(patch);
    const a = window.VT_ACTIONS.find(x => x.id === id);
    if(a){ Object.assign(a, clean); }
    const dbPatch = _mapTaskPatch(clean);
    if(Object.keys(dbPatch).length) _persistPatch('tasks', id, dbPatch);
    setBumpKey(k => k + 1);
  };

  // Contact edits — DB is source of truth. Legacy localStorage layer dropped.
  useEffectA(() => { try { localStorage.removeItem("vt:contactEdits"); } catch(_){} }, []);
  const updateContact = (id, patch, opts) => {
    const isDraft = opts && opts._draft;
    if('firstName' in patch || 'lastName' in patch){
      const c = window.VT_CONTACTS.find(x => x.id === id);
      const first = ('firstName' in patch ? (patch.firstName || "") : (c && c.firstName) || "");
      const last  = ('lastName'  in patch ? (patch.lastName  || "") : (c && c.lastName)  || "");
      const composed = (first + " " + last).trim();
      if(composed){
        patch = { ...patch, name: composed };
        if(window.VT_FMT && window.VT_FMT.INITIALS){
          patch.initials = window.VT_FMT.INITIALS(composed);
        }
      }
    } else if('name' in patch && window.VT_FMT && window.VT_FMT.INITIALS){
      patch = { ...patch, initials: window.VT_FMT.INITIALS(patch.name || "") };
    }
    const c = window.VT_CONTACTS.find(x => x.id === id);
    if(c){ Object.assign(c, patch); }
    if(!isDraft){
      const dbPatch = _mapContactPatch(patch);
      if(Object.keys(dbPatch).length) _persistPatch('contacts', id, dbPatch);
    }
    setBumpKey(k => k + 1);
  };
  // Create a blank contact in draft state: drawer opens with it, but nothing
  // reaches Supabase or VT_CONTACTS until user clicks Save in the drawer.
  const addContact = () => {
    return {
      id: _genUUID(),
      _draft: true,
      name: "New contact",
      firstName: "",
      lastName: "",
      firm: "—",
      role: "—",
      sector: null,
      tier: 2,
      cadenceWeeks: 12,
      status: "Never contacted",
      statusCls: "never",
      lastContacted: null,
      lastContactedFmt: "—",
      initials: (window.VT_FMT && window.VT_FMT.INITIALS) ? window.VT_FMT.INITIALS("New contact") : "NC",
      assetCoverage: "",
      email: null,
      phone: null,
      city: "",
      notes: "",
    };
  };


  // Create a blank action in draft state (DB write deferred to Save click).
  const addAction = () => {
    return {
      id: _genUUID(),
      _draft: true,
      title: "New action",
      ctx: "—",
      notes: "",
      bucket: "today",
      due: null,
      dueFmt: null,
      importance: "Medium",
      importanceCls: "chip--medium",
      done: false,
      dealCardTitle: null,
      dealCardId: null,
    };
  };

  // ad-hoc intel edits — Supabase-only, no localStorage layer (intel is read-mostly)
  const updateIntel = (id, patch) => {
    const i = (window.VT_INTEL || []).find(x => x.id === id);
    if(i){ Object.assign(i, patch); }
    const dbPatch = _mapIntelPatch(patch);
    if(Object.keys(dbPatch).length) _persistPatch('intel_records', id, dbPatch);
    setBumpKey(k => k + 1);
  };

  // ad-hoc strategy edits — Supabase-only, no localStorage layer
  const updateStrategy = (id, patch) => {
    const s = (window.VT_STRATEGY || []).find(x => x.id === id);
    if(s){ Object.assign(s, patch); }
    const dbPatch = _mapStrategyPatch(patch);
    if(Object.keys(dbPatch).length) _persistPatch('strategy_ideas', id, dbPatch);
    setBumpKey(k => k + 1);
  };

  // Knowledge edits — Supabase-backed, mirrors strategy.
  const updateKnowledge = (id, patch) => {
    const k = (window.VT_KNOWLEDGE || []).find(x => x.id === id);
    if(k){ Object.assign(k, patch); }
    const dbPatch = _mapKnowledgePatch(patch);
    if(Object.keys(dbPatch).length) _persistPatch('knowledge_base', id, dbPatch);
    setBumpKey(kk => kk + 1);
  };
  const addKnowledge = () => {
    return {
      id: _genUUID(),
      _draft: true,
      title: "New knowledge entry",
      body: "",
      category: "Other / Misc",
      tags: [],
      sector: null,
      geography: null,
      source: null,
      sourceUrl: null,
      importance: "Medium",
      status: "Active",
      date: new Date().toISOString().slice(0,10),
      dateFmt: (window.VT_FMT && window.VT_FMT.SHORT_DATE) ? window.VT_FMT.SHORT_DATE(new Date()) : new Date().toISOString().slice(0,10),
    };
  };

  // Deal edits — DB is source of truth (pipeline_cards / deal_cards). Legacy localStorage layer dropped.
  useEffectA(() => { try { localStorage.removeItem("vt:dealEdits"); } catch(_){} }, []);
  const updateDeal = (id, patch, table, opts) => {
    const isDraft = opts && opts._draft;
    const d = (window.VT_DEALS || []).find(x => x.id === id)
      || (window.VT_TRANSACTIONS || []).find(x => x.id === id)
      || (window.VT_DEAL_CARDS || []).find(x => x.id === id);
    if(d){ Object.assign(d, patch); }
    if(table && !isDraft){
      const dbPatch = table === 'pipeline_cards' ? _mapPipelinePatch(patch) : _mapDealPatch(patch);
      if(Object.keys(dbPatch).length) _persistPatch(table, id, dbPatch);
    }
    setBumpKey(k => k + 1);
  };

  // leases — Supabase-backed; initial state empty, populated by live-fetch effect
  const [leases, setLeases] = useStateA([]);
  useEffectA(() => { window.VT_LEASES = leases; }, [leases]);
  const updateLease = (id, patch, opts) => {
    const isDraft = opts && opts._draft;
    // Optimistic local update
    setLeases(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
    // Persist to Supabase only when not a draft.
    if(!isDraft){
      const dbPatch = _mapLeasePatch(patch);
      if(Object.keys(dbPatch).length) _persistPatch('leasing_cards', id, dbPatch);
    }
  };
  const addLease = () => {
    // Draft pattern: build a blank with _draft:true. The drawer opens with
    // it; nothing reaches Supabase or the leases list until user clicks Save.
    return {
      id: _genUUID(),
      _draft: true,
      tenancy: null, address: null, suburb: null, state: null,
      sector: null, sub_sector: null,
      tenant: null, landlord: null, agent: null,
      area_sqm: null, term_years: null, face_rent: null, effective_rent: null, incentive_pct: null,
      lease_type: null, lease_date: null,
      status: 'Active', confidence: 'Reported', is_comparable: true,
      notes: null,
    };
  };
  const removeLease = async (id) => {
    setLeases(prev => prev.filter(l => l.id !== id));
    const sb = window.__vantageAuth;
    if(sb){
      try { await sb.from('leasing_cards').delete().eq('id', id); }
      catch(e) { console.warn('[Vantage] delete lease failed:', e); }
    }
  };

  // tearsheet
  const [tearsheet, setTearsheet] = useStateA(null);

  // action done state — DB is source of truth (tasks.status). Legacy localStorage layer dropped.
  useEffectA(() => { try { localStorage.removeItem("vt:doneIds"); } catch(_){} }, []);
  const _refreshActionStats = () => {
    const A = window.VT_ACTIONS || [];
    const S = window.VT_STATS || (window.VT_STATS = {});
    S.openActions = A.filter(a => !a.done).length;
    S.doneActions = A.filter(a => a.done).length;
    S.overdueActions = A.filter(a => !a.done && a.bucket === "overdue").length;
    S.todayActions = A.filter(a => !a.done && a.bucket === "today").length;
  };
  const toggleAction = (id) => {
    const a = (window.VT_ACTIONS || []).find(x => x.id === id);
    if(!a) return;
    const newDone = !a.done;
    a.done = newDone;
    if(newDone){ a.bucket = "done"; }
    else {
      const dt = a.due ? new Date(a.due) : null;
      if(!dt || isNaN(dt)) a.bucket = "none";
      else {
        const today = new Date(); today.setHours(0,0,0,0);
        const tgt = new Date(dt); tgt.setHours(0,0,0,0);
        const diffDays = Math.round((tgt - today) / 86400000);
        if(diffDays < 0) a.bucket = "overdue";
        else if(diffDays === 0) a.bucket = "today";
        else if(diffDays <= 7) a.bucket = "week";
        else a.bucket = "later";
      }
    }
    a.status = newDone ? "Done" : "Open";
    _refreshActionStats();
    _persistPatch('tasks', id, { status: newDone ? "Done" : "Open" });
    setBumpKey(k => k + 1);
  };

  // modals
  const [modal, setModal] = useStateA(null);
  const [captureText, setCaptureText] = useStateA("");
  const [granolaStatus, setGranolaStatus] = useStateA({ loading: false, status: null, lastSynced: null, requested: false });
  const [refreshing, setRefreshing] = useStateA(false);

  // Outlook sync request: writes a flag in app_config that the Cowork scheduled task picks up.
  // Processing happens on Ric's machine when Cowork is open (within ~15 min of click).
  const requestOutlookSync = async () => {
    try {
      const sb = window.__vantageAuth;
      if(!sb){ showToast('Not signed in'); return; }
      const now = new Date().toISOString();
      const { error } = await sb.from('app_config').upsert([
        { key: 'outlook_sync_requested', value: now },
        { key: 'outlook_sync_status', value: 'requested' },
      ], { onConflict: 'key' });
      if(error){ showToast('Outlook request failed: ' + error.message); return; }
      showToast('Outlook sync requested — runs when Cowork is next open');
    } catch(e){ showToast('Outlook request failed: ' + ((e && e.message) || String(e))); }
  };

  // Master Refresh: invokes parse_inbox + parse_granola Edge Functions in
  // parallel (captures + meetings), then re-fetches all tables.
  const runMasterRefresh = async () => {
    if(refreshing) return;
    setRefreshing(true);
    try {
      const sb = window.__vantageAuth;
      if(!sb){ showToast('Not signed in'); setRefreshing(false); return; }
      const invoke = async (name) => {
        try {
          const { data, error } = await sb.functions.invoke(name, {});
          if(error) return { name, error: error.message || (name + ' failed') };
          return { name, data };
        } catch(e){ return { name, error: (e && e.message) || String(e) }; }
      };
      const [inboxRes, granolaRes] = await Promise.all([
        invoke('parse_inbox'),
        invoke('parse_granola'),
      ]);
      await _awaitPendingWrites();
      await fetchAllTables();
      const parts = [];
      let totalSpend = null;
      if(inboxRes.error) parts.push('captures: ' + inboxRes.error);
      else if(inboxRes.data){
        const c = inboxRes.data.captures_processed || 0;
        const i = inboxRes.data.items_created || 0;
        if(c > 0 || i > 0) parts.push(c + ' capture' + (c===1?'':'s') + ' → ' + i + ' item' + (i===1?'':'s'));
        if(typeof inboxRes.data.monthly_spend_usd === 'number') totalSpend = inboxRes.data.monthly_spend_usd;
      }
      if(granolaRes.error) parts.push('granola: ' + granolaRes.error);
      else if(granolaRes.data){
        const d = granolaRes.data.docs_processed || 0;
        const i = granolaRes.data.items_created || 0;
        if(d > 0 || i > 0) parts.push(d + ' meeting' + (d===1?'':'s') + ' → ' + i + ' item' + (i===1?'':'s'));
        if(typeof granolaRes.data.monthly_spend_usd === 'number') totalSpend = granolaRes.data.monthly_spend_usd;
      }
      const spendStr = (typeof totalSpend === 'number') ? ' · spend $' + totalSpend.toFixed(2) : '';
      if(parts.length === 0) showToast('Refreshed · nothing new' + spendStr);
      else showToast('Refreshed · ' + parts.join(' · ') + spendStr);
    } finally {
      setRefreshing(false);
    }
  };

  const loadGranolaStatus = async () => {
    setGranolaStatus(prev => ({ ...prev, loading: true }));
    try {
      const sb = window.__vantageAuth;
      const { data } = await sb.from('app_config').select('key,value').in('key', ['granola_sync_status','granola_last_synced','granola_sync_requested']);
      const map = {};
      (data || []).forEach(row => { map[row.key] = row.value; });
      setGranolaStatus({ loading: false, status: map['granola_sync_status'] || 'idle', lastSynced: map['granola_last_synced'] || null, requested: false });
    } catch(e) {
      setGranolaStatus({ loading: false, status: 'error', lastSynced: null, requested: false });
    }
  };

  const requestGranolaSync = async () => {
    try {
      const sb = window.__vantageAuth;
      const now = new Date().toISOString();
      await sb.from('app_config').upsert([
        { key: 'granola_sync_requested', value: now },
        { key: 'granola_sync_status', value: 'requested' }
      ], { onConflict: 'key' });
      setGranolaStatus(prev => ({ ...prev, status: 'requested', requested: true }));
      showToast("Sync requested — Leo will pull your meetings next session");
      setTimeout(() => setModal(null), 2000);
    } catch(e) {
      showToast("Request failed — try again");
    }
  };

  useEffectA(() => {
    if(modal === "granola") loadGranolaStatus();
  }, [modal]);

  // Helper: write a pending capture to Supabase
  const savePendingCapture = async (rawText, source) => {
    try {
      const sb = window.__vantageAuth;
      await sb.from('pending_captures').insert({ raw_text: rawText, source, status: 'pending' });
    } catch(err) {
      console.warn('Capture save failed:', err);
    }
  };

  // palette
  const [paletteOpen, setPaletteOpen] = useStateA(false);

  // toast
  const [toast, setToast] = useStateA(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  // pending review count — load once at startup for sidebar badge
  useEffectA(() => {
    if(!window.__vantageAuth) return;
    window.__vantageAuth.from('pending_review').select('id', { count: 'exact', head: true }).eq('status','pending').then(({ count }) => {
      window.VT_PENDING_COUNT = count || 0;
    }).catch(() => {});
  }, []);

  // tweaks panel
  const [tweaksOpen, setTweaksOpen] = useStateA(false);
  useEffectA(() => {
    const onMsg = (e) => {
      if(!e.data || typeof e.data !== "object") return;
      if(e.data.type === "__activate_edit_mode") setTweaksOpen(true);
      else if(e.data.type === "__deactivate_edit_mode") setTweaksOpen(false);
    };
    window.addEventListener("message", onMsg);
    try { window.parent.postMessage({type:"__edit_mode_available"}, "*"); } catch(err){}
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Body scroll lock when any overlay is open (mobile + desktop).
  // Preserves scroll position by pinning body; on close, restores scrollY.
  useEffectA(() => {
    const anyOpen = drawer.open || mobileNavOpen || !!modal || paletteOpen || tweaksOpen || !!tearsheet;
    if(anyOpen){
      const y = window.scrollY || window.pageYOffset || 0;
      document.body.dataset.lockY = String(y);
      document.body.style.top = `-${y}px`;
      document.body.classList.add("body--lock");
    } else if(document.body.classList.contains("body--lock")){
      const y = Number(document.body.dataset.lockY || 0);
      document.body.classList.remove("body--lock");
      document.body.style.top = "";
      delete document.body.dataset.lockY;
      window.scrollTo(0, y);
    }
  }, [drawer.open, mobileNavOpen, modal, paletteOpen, tweaksOpen, tearsheet]);
  const persist = (edits) => {
    try { window.parent.postMessage({type:"__edit_mode_set_keys", edits}, "*"); } catch(err){}
  };
  const onSetTheme = (k, v) => {
    if(k === "theme"){ setTheme(v); persist({theme: v}); }
    else if(k === "density"){ setDensity(v); persist({density: v}); }
    else { setFlag(k, v); }
  };

  // Keyboard shortcuts
  const keyBuffer = useRefA({ last: "", at: 0 });
  useEffectA(() => {
    if(!flags.keyboardNav && !flags.commandK) return;
    const isTyping = () => {
      const el = document.activeElement;
      if(!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
    };
    const onKey = (e) => {
      // Cmd/Ctrl+K — palette
      if(flags.commandK && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"){
        e.preventDefault(); setPaletteOpen(true); return;
      }
      if(e.key === "Escape"){
        if(paletteOpen){ setPaletteOpen(false); return; }
        if(modal){ setModal(null); return; }
        if(drawer.open){ closeDrawer(); return; }
        if(tweaksOpen){ setTweaksOpen(false); return; }
        if(tearsheet){ setTearsheet(null); return; }
      }
      if(!flags.keyboardNav) return;
      if(isTyping()) return;
      if(e.metaKey || e.ctrlKey || e.altKey) return;

      // "/" — focus search palette
      if(e.key === "/"){ e.preventDefault(); setPaletteOpen(true); return; }
      // single-key commands
      if(e.key === "c"){ e.preventDefault(); setModal("capture"); return; }
      if(e.key === "?"){ e.preventDefault(); setModal("shortcuts"); return; }
      // "g x" sequences
      const now = Date.now();
      if(e.key === "g"){ keyBuffer.current = { last: "g", at: now }; return; }
      if(keyBuffer.current.last === "g" && (now - keyBuffer.current.at) < 1200){
        const map = { d:"dashboard", a:"actions", c:"crm", p:"pipeline", t:"deals", i:"intel", s:"strategy", l:"leasing" };
        const target = map[e.key];
        if(target){ e.preventDefault(); setView(target); keyBuffer.current = { last:"", at:0 }; return; }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flags.keyboardNav, flags.commandK, paletteOpen, modal, drawer.open, tweaksOpen, tearsheet]);

  const onPaletteSelect = (it) => {
    setPaletteOpen(false);
    if(it.kind === "nav") setView(it.target);
    else if(it.kind === "cmd") setModal(it.target);
    else if(it.kind === "deal") openDeal(it.record);
    else if(it.kind === "tx") openTx(it.record);
    else if(it.kind === "contact") openContact(it.record);
    else if(it.kind === "intel") openIntel(it.record);
    else if(it.kind === "action"){ setView("actions"); }
  };

  const title = TITLES[view] || ["", "Vantage"];

  const content = (() => {
    const props = { flags, setModal };
    switch(view){
      case "dashboard": return <ScreenDashboard setView={setView} openDeal={openDeal} openTx={openTx} openAction={openAction} openIntel={openIntel} toggleAction={toggleAction} flags={flags} setModal={setModal} leoDismissed={leoDismissed} setLeoDismissed={setLeoDismissed}/>;
      case "actions":   return <ScreenActions toggleAction={toggleAction} openAction={openAction} updateAction={updateAction} addAction={() => { const t = addAction(); if(t) openAction(t); }} {...props}/>;
      case "crm":       return <ScreenCRM openContact={openContact} addContact={addContact} {...props}/>;
      case "pipeline":  return <ScreenPipeline openDeal={openDeal} updatePhase={updatePhase} {...props}/>;
      case "deals":     return <ScreenDeals openTx={openTx} {...props}/>;
      case "leasing":   return <ScreenLeasing leases={leases} openLease={openLease} addLease={() => { const l = addLease(); if(l) openLease(l); }} removeLease={removeLease} {...props}/>;
      case "intel":     return <ScreenIntel openIntel={openIntel} {...props}/>;
      case "strategy":  return <ScreenStrategy openStrategy={openStrategy} {...props}/>;
      case "knowledge": return <ScreenKnowledge openKnowledge={openKnowledge} addKnowledge={() => { const k = addKnowledge(); if(k) openKnowledge(k); }} {...props}/>;
      case "review":    return <ScreenReview showToast={showToast}/>;
      default:          return <ScreenDashboard setView={setView} openDeal={openDeal} openTx={openTx} openAction={openAction} openIntel={openIntel} toggleAction={toggleAction} flags={flags} setModal={setModal} leoDismissed={leoDismissed} setLeoDismissed={setLeoDismissed}/>;
    }
  })();

  // ==== Drawer bodies ====
  const drawerBody = (() => {
    if(!drawer.record) return null;
    const r = drawer.record;
    if(drawer.kind === "deal" || drawer.kind === "tx"){
      const isDeal = drawer.kind === "deal";
      const SECTOR_OPTS = ["Office","Retail","Industrial","Residential","Hotel","Alternatives","Diversified","—"];
      const PHASE_OPTS = ["Identified","Initial Analysis","Detailed Analysis","Bid Submitted","Entered DD","Closed","Dead"];
      const CONFIDENCE_OPTS = ["Confirmed","Reported","Rumoured"];
      const CONVICTION_OPTS = ["High","Medium","Low","—"];
      const STRATEGY_OPTS = ["Value Add","Core Plus","Core","Opportunistic","Development","—"];
      const setDealField = (k,v) => { updateDeal(r.id, { [k]: v }, isDeal ? 'pipeline_cards' : 'deal_cards', { _draft: !!r._draft }); setDrawer(d => ({ ...d, record: { ...d.record, [k]: v }})); };
      return (
        <>
          <div className="drawer__section">
            <div className="editrow">
              <EditableField label="Sector" value={r.sector || "—"} options={SECTOR_OPTS} onSave={v => setDealField("sector", v === "—" ? null : v)}/>
              {isDeal && <EditableField label="Phase" value={r.phase || "—"} options={PHASE_OPTS} onSave={v => setDealField("phase", v)}/>}
              <EditableField label="Confidence" value={r.confidence || "—"} options={CONFIDENCE_OPTS} onSave={v => setDealField("confidence", v)}/>
              <EditableField label="Conviction" value={r.conviction || "—"} options={CONVICTION_OPTS} onSave={v => setDealField("conviction", v === "—" ? null : v)}/>
              {!isDeal && <EditableField label="Strategy" value={r.strategy || r.processType || "—"} options={STRATEGY_OPTS} onSave={v => setDealField("strategy", v === "—" ? null : v)}/>}
            </div>
            <div className="editrow" style={{marginTop:10}}>
              <EditableField label="Address" value={r.title} onSave={v => setDealField("title", v)}/>
              <EditableField label="Suburb" value={r.suburb || "—"} onSave={v => setDealField("suburb", v)}/>
              <EditableField label="State" value={r.state || "—"} options={["NSW","VIC","QLD","WA","SA","TAS","ACT","NT","—"]} onSave={v => setDealField("state", v === "—" ? null : v)}/>
              <EditableField label="Deal value" value={r.valueFmt || "—"} onSave={v => setDealField("valueFmt", v)}/>
              {isDeal ? (
                <EditableField label="Strategy / process" value={r.strategy || r.processType || "—"} options={STRATEGY_OPTS} onSave={v => setDealField("strategy", v === "—" ? null : v)}/>
              ) : (
                <EditableField label="Sale date" value={r.saleDateFmt || "—"} type="date" onSave={v => setDealField("saleDateFmt", v)}/>
              )}
            </div>
            <div className="editrow" style={{marginTop:10}}>
              <EditableField label="Initial Yield" value={r.yield || "—"} onSave={v => setDealField("yield", v)}/>
              <EditableField label="Market Yield" value={r.marketYield || "—"} onSave={v => setDealField("marketYield", v)}/>
              <EditableField label="IRR" value={r.irr || "—"} onSave={v => setDealField("irr", v)}/>
              <EditableField label="WALE" value={r.wale || "—"} onSave={v => setDealField("wale", v)}/>
            </div>
            <div className="editrow" style={{marginTop:10}}>
              <EditableField label="NLA" value={r.nla || "—"} onSave={v => setDealField("nla", v)}/>
              <EditableField label="$/sqm" value={r.capVal || "—"} onSave={v => setDealField("capVal", v)}/>
              <EditableField label="Vendor" value={r.vendor || "—"} onSave={v => setDealField("vendor", v)}/>
              <EditableField label="Purchaser" value={r.purchaser || "—"} onSave={v => setDealField("purchaser", v)}/>
            </div>
            <div className="editrow" style={{marginTop:10}}>
              <EditableField label="Agent" value={r.agent || "—"} options={AGENT_OPTS} onSave={v => setDealField("agent", v === "—" ? null : v)}/>
            </div>
          </div>

          <div className="drawer__section">
            <h4>Notes</h4>
            <EditableField label="" value={r.notes || "Add notes…"} multiline onSave={v => setDealField("notes", v)}/>
          </div>

          {r.meetingLabel && (
            <div className="drawer__section">
              <h4>Source</h4>
              <div className="muted text-sm"><Icon name="granola" size={12}/> {r.meetingLabel}</div>
            </div>
          )}
        </>
      );
    }
    if(drawer.kind === "contact"){
      const TIER_OPTS = ["1","2","3"];
      const CADENCE_OPTS = ["Fortnightly","Monthly","Bi-Monthly","Quarterly","Half-Yearly","Annually"];
      const CADENCE_TO_WEEKS = { "Fortnightly":2, "Monthly":4, "Bi-Monthly":8, "Quarterly":12, "Half-Yearly":26, "Annually":52 };
      const WEEKS_TO_CADENCE = (w) => {
        if(!w) return "—";
        const n = Number(w);
        if(n <= 2) return "Fortnightly";
        if(n <= 4) return "Monthly";
        if(n <= 8) return "Bi-Monthly";
        if(n <= 13) return "Quarterly";
        if(n <= 26) return "Half-Yearly";
        return "Annually";
      };
      const SECTOR_OPTS = ["Office","Retail","Industrial","Residential","Hotel","Alternatives","Diversified","—"];
      const CITY_OPTS = ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Hobart","Canberra","Darwin","Newcastle","Wollongong","Central Coast","Geelong","Ballarat","Bendigo","Gold Coast","Sunshine Coast","Townsville","Cairns","Toowoomba","Mackay","Launceston","Bunbury","Albury","Singapore","Hong Kong","—"];
      const setField = (k,v) => { updateContact(r.id, { [k]: v }, { _draft: !!r._draft }); setDrawer(d => ({ ...d, record: { ...d.record, [k]: v }})); };
      return (
        <>
          <div className="drawer__section">
            <div className="row" style={{marginBottom:12, gap:12}}>
              <div className="avatar" style={{width:44, height:44, fontSize:15}}>{r.initials}</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:18, fontWeight:600, letterSpacing:"-0.01em"}}>{r.name}</div>
                <div className="muted text-sm">{r.role || "—"}{r.firm && r.firm !== "—" ? " · " + r.firm : ""}</div>
              </div>
            </div>
            <div className="editrow">
              <EditableField label="First name" value={r.firstName || "—"} onSave={v => setField("firstName", v === "—" ? "" : v)}/>
              <EditableField label="Last name" value={r.lastName || "—"} onSave={v => setField("lastName", v === "—" ? "" : v)}/>
              <EditableField label="Firm" value={r.firm} onSave={v => setField("firm", v)}/>
              <EditableField label="Role" value={r.role} onSave={v => setField("role", v)}/>
              <EditableField label="Tier" value={String(r.tier)} options={TIER_OPTS} onSave={v => setField("tier", Number(v))}/>
              <EditableField label="Sector" value={r.sector || "—"} options={SECTOR_OPTS} onSave={v => setField("sector", v === "—" ? null : v)}/>
              <EditableField label="Email" value={r.email || "—"} onSave={v => setField("email", v)}/>
              <EditableField label="Phone" value={r.phone || "—"} onSave={v => setField("phone", v)}/>
              <EditableField label="City" value={r.city || "—"} options={CITY_OPTS} onSave={v => setField("city", v === "—" ? null : v)}/>
              <EditableField label="Cadence" value={WEEKS_TO_CADENCE(r.cadenceWeeks)} options={CADENCE_OPTS} onSave={v => setField("cadenceWeeks", CADENCE_TO_WEEKS[v])}/>
              <EditableField label="Last contact" value={r.lastContactedFmt} type="date" onSave={v => setField("lastContactedFmt", v)}/>
            </div>
          </div>

          <div className="drawer__section">
            <h4>Notes</h4>
            <EditableField label="" value={r.notes || "Add notes…"} multiline onSave={v => setField("notes", v)}/>
          </div>
        </>
      );
    }
    if(drawer.kind === "intel"){
      const INTEL_CATEGORIES = ["Market Data","Tenant Intel","Transaction","Strategy","Rumour","Mandate","Deal Specific","General"];
      const CONFIDENCE_OPTS = ["Confirmed","Reported","Rumoured"];
      const SECTOR_OPTS = ["Office","Retail","Industrial","Residential","Hotel","Alternatives","—"];
      const setIntelField = (k,v) => { updateIntel(r.id, { [k]: v }); setDrawer(d => ({ ...d, record: { ...d.record, [k]: v }})); };
      return (
        <>
          <div className="drawer__section">
            <div className="editrow">
              <EditableField label="Category" value={r.category} options={INTEL_CATEGORIES} onSave={v => setIntelField("category", v)}/>
              <EditableField label="Confidence" value={r.confidence} options={CONFIDENCE_OPTS} onSave={v => setIntelField("confidence", v)}/>
              <EditableField label="Sector" value={r.sector || "—"} options={SECTOR_OPTS} onSave={v => setIntelField("sector", v === "—" ? null : v)}/>
              <EditableField label="Date" value={r.dateFmt} type="date" onSave={v => setIntelField("dateFmt", v)}/>
            </div>
            <div style={{fontSize:17, fontWeight:600, lineHeight:1.35, letterSpacing:"-0.01em", marginTop:14}}>{r.title}</div>
          </div>
          <div className="drawer__section">
            <h4>Summary</h4>
            <EditableField label="" value={r.body || "Add summary…"} multiline onSave={v => setIntelField("body", v)}/>
          </div>
          {r.source && <div className="drawer__section"><h4>Source</h4><div className="muted text-sm">{r.source}</div></div>}
        </>
      );
    }
    if(drawer.kind === "strategy"){
      const THEME_OPTS = ["Mandate","Thesis","Process","Pipeline","Capital","Research","Other"];
      const STATUS_OPTS = ["Raw Idea","Developing","Validated","Shelved"];
      const SECTOR_OPTS = ["Office","Retail","Industrial","Residential","Hotel","Alternatives","—"];
      const IMPORTANCE_OPTS = ["High","Medium","Low"];
      const setStrategyField = (k,v) => { updateStrategy(r.id, { [k]: v }); setDrawer(d => ({ ...d, record: { ...d.record, [k]: v }})); };
      return (
        <>
          <div className="drawer__section">
            <div className="editrow">
              <EditableField label="Theme" value={r.theme} options={THEME_OPTS} onSave={v => setStrategyField("theme", v)}/>
              <EditableField label="Sector" value={r.sector || "—"} options={SECTOR_OPTS} onSave={v => setStrategyField("sector", v === "—" ? null : v)}/>
              <EditableField label="Status" value={r.status} options={STATUS_OPTS} onSave={v => setStrategyField("status", v)}/>
              <EditableField label="Importance" value={r.importance} options={IMPORTANCE_OPTS} onSave={v => setStrategyField("importance", v)}/>
              <EditableField label="Date" value={r.dateFmt} type="date" onSave={v => setStrategyField("dateFmt", v)}/>
            </div>
          </div>
          <div className="drawer__section">
            <h4>Idea</h4>
            <EditableField label="" value={r.body || "Add idea…"} multiline onSave={v => setStrategyField("body", v)}/>
          </div>
        </>
      );
    }
    if(drawer.kind === "knowledge"){
      const CATEGORY_OPTS = ["Tax & Structuring","Legal & Regulatory","Financial & Underwriting","Market Frameworks","Construction & Development","Capital & Investor","Operational","Macro & Economic","Sector Reference","Other / Misc"];
      const SECTOR_OPTS = ["Office","Retail","Industrial","Alternatives","Capital","Cross-sector","—"];
      const GEOGRAPHY_OPTS = ["VIC","NSW","QLD","WA","SA","ACT","TAS","NT","National","International","—"];
      const STATUS_OPTS = ["Active","Archived"];
      const IMPORTANCE_OPTS = ["High","Medium","Low"];
      const setKField = (k,v) => { updateKnowledge(r.id, { [k]: v }); setDrawer(d => ({ ...d, record: { ...d.record, [k]: v }})); };
      const tagsDisplay = Array.isArray(r.tags) && r.tags.length ? r.tags.join(", ") : "—";
      const handleTagsSave = (v) => {
        const arr = String(v || "").split(",").map(s => s.trim()).filter(Boolean);
        setKField("tags", arr);
      };
      return (
        <>
          <div className="drawer__section">
            <EditableField label="Title" value={r.title || "—"} onSave={v => setKField("title", v)}/>
            <div className="editrow">
              <EditableField label="Category" value={r.category || "Other / Misc"} options={CATEGORY_OPTS} onSave={v => setKField("category", v)}/>
              <EditableField label="Sector" value={r.sector || "—"} options={SECTOR_OPTS} onSave={v => setKField("sector", v === "—" ? null : v)}/>
              <EditableField label="Geography" value={r.geography || "—"} options={GEOGRAPHY_OPTS} onSave={v => setKField("geography", v === "—" ? null : v)}/>
              <EditableField label="Importance" value={r.importance || "Medium"} options={IMPORTANCE_OPTS} onSave={v => setKField("importance", v)}/>
              <EditableField label="Status" value={r.status || "Active"} options={STATUS_OPTS} onSave={v => setKField("status", v)}/>
              <EditableField label="Date" value={r.dateFmt} type="date" onSave={v => setKField("dateFmt", v)}/>
            </div>
          </div>
          <div className="drawer__section">
            <h4>Tags</h4>
            <EditableField label="" value={tagsDisplay} onSave={handleTagsSave} placeholder="Comma-separated, e.g. MIT, GST, Reference"/>
          </div>
          <div className="drawer__section">
            <div className="editrow">
              <EditableField label="Source" value={r.source || "—"} onSave={v => setKField("source", v === "—" ? null : v)} placeholder="KPMG, ATO, internal…"/>
              <EditableField label="Source URL" value={r.sourceUrl || "—"} onSave={v => setKField("sourceUrl", v === "—" ? null : v)} placeholder="https://…"/>
            </div>
          </div>
          <div className="drawer__section">
            <h4>Body</h4>
            <EditableField label="" value={r.body || "Add knowledge content…"} multiline onSave={v => setKField("body", v)}/>
          </div>
        </>
      );
    }
    if(drawer.kind === "lease"){
      const SECTOR_OPTS = ["Office","Retail","Industrial","Residential","Hotel","Alternatives","Diversified","—"];
      const STATUS_OPTS = ["Inquiry","Tour","Negotiating","LOI","Heads of Agreement","Executed","Active","Lost","—"];
      const LEASE_TYPE_OPTS = ["Net","Gross","Semi-Gross","—"];
      // Helper: format DB date string (ISO) to display
      const fmtDateDisp = (d) => d ? (window.VT_FMT && window.VT_FMT.DATE ? window.VT_FMT.DATE(d) : d) : "—";
      const setLeaseField = (k,v) => { updateLease(r.id, { [k]: v }, { _draft: !!r._draft }); setDrawer(d => ({ ...d, record: { ...d.record, [k]: v }})); };
      return (
        <>
          <div className="drawer__section">
            <div className="editrow">
              <EditableField label="Tenancy" value={r.tenancy || "—"} onSave={v => setLeaseField("tenancy", v === "—" ? null : v)}/>
              <EditableField label="Address" value={r.address || "—"} onSave={v => setLeaseField("address", v)}/>
              <EditableField label="Suburb" value={r.suburb || "—"} onSave={v => setLeaseField("suburb", v)}/>
              <EditableField label="State" value={r.state || "—"} options={["VIC","NSW","QLD","WA","SA","TAS","ACT","NT","—"]} onSave={v => setLeaseField("state", v === "—" ? null : v)}/>
              <EditableField label="Sector" value={r.sector || "—"} options={SECTOR_OPTS} onSave={v => setLeaseField("sector", v === "—" ? null : v)}/>
              <EditableField label="Sub-sector" value={r.sub_sector || "—"} onSave={v => setLeaseField("sub_sector", v)}/>
              <EditableField label="Status" value={r.status || "—"} options={STATUS_OPTS} onSave={v => setLeaseField("status", v === "—" ? null : v)}/>
              <EditableField label="Tenant" value={r.tenant || "—"} onSave={v => setLeaseField("tenant", v)}/>
              <EditableField label="Landlord" value={r.landlord || "—"} onSave={v => setLeaseField("landlord", v)}/>
              <EditableField label="Agent" value={r.agent || "—"} options={AGENT_OPTS} onSave={v => setLeaseField("agent", v === "—" ? null : v)}/>
            </div>
            <div className="editrow" style={{marginTop:10}}>
              <EditableField label="Area (sqm)" value={r.area_sqm != null ? String(r.area_sqm) : "—"} onSave={v => setLeaseField("area_sqm", v)}/>
              <EditableField label="Lease type" value={r.lease_type || "—"} options={LEASE_TYPE_OPTS} onSave={v => setLeaseField("lease_type", v === "—" ? null : v)}/>
              <EditableField label="Face rent ($/sqm)" value={r.face_rent != null ? String(r.face_rent) : "—"} onSave={v => setLeaseField("face_rent", v)}/>
              <EditableField label="Effective rent ($/sqm)" value={r.effective_rent != null ? String(r.effective_rent) : "—"} onSave={v => setLeaseField("effective_rent", v)}/>
              <EditableField label="Term (yrs)" value={r.term_years != null ? String(r.term_years) : "—"} onSave={v => setLeaseField("term_years", v)}/>
              <EditableField label="Incentive (%)" value={r.incentive_pct != null ? String(r.incentive_pct) : "—"} onSave={v => setLeaseField("incentive_pct", v)}/>
              <EditableField label="Lease date" value={fmtDateDisp(r.lease_date)} type="date" onSave={v => setLeaseField("lease_date_fmt", v)}/>
            </div>
          </div>
          <div className="drawer__section">
            <h4>Notes</h4>
            <EditableField label="" value={r.notes || "Add notes…"} multiline onSave={v => setLeaseField("notes", v)}/>
          </div>
        </>
      );
    }
    if(drawer.kind === "action"){
      const IMPORTANCE_OPTS = ["High","Medium","Low"];
      return (
        <>
          <div className="drawer__section">
            <div className="editrow">
              <EditableField label="Title" value={r.title} onSave={v => { updateAction(r.id, { title: v }); setDrawer(d => ({ ...d, record: { ...d.record, title: v }})); }}/>
              <EditableField label="Linked deal" value={r.dealCardTitle || "— None —"} options={["— None —", ...((window.VT_DEALS || []).map(d => d.title))]} onSave={v => {
                const isNone = v === "— None —";
                const deal = isNone ? null : (window.VT_DEALS || []).find(d => d.title === v);
                const dealId = deal ? deal.id : null;
                const dealTitle = isNone ? null : v;
                updateAction(r.id, { deal_card_id: dealId, dealCardId: dealId, dealCardTitle: dealTitle, ctx: dealTitle || "—" });
                setDrawer(d => ({ ...d, record: { ...d.record, deal_card_id: dealId, dealCardId: dealId, dealCardTitle: dealTitle, ctx: dealTitle || "—" }}));
              }}/>
              <EditableField label="Importance" value={r.importance} options={IMPORTANCE_OPTS} onSave={v => { updateAction(r.id, { importance: v }); setDrawer(d => ({ ...d, record: { ...d.record, importance: v }})); }}/>
              <EditableField label="Due" value={r.dueFmt || "—"} type="date" onSave={v => { updateAction(r.id, { dueFmt: v }); setDrawer(d => ({ ...d, record: { ...d.record, dueFmt: v }})); }}/>
              <EditableField label="Status" value={r.done ? "Done" : "Open"} options={["Open","Done"]} onSave={v => { const done = v === "Done"; if(done !== !!r.done){ toggleAction(r.id); setDrawer(d => ({ ...d, record: { ...d.record, done }})); }}}/>
            </div>
          </div>
          <div className="drawer__section">
            <h4>Notes</h4>
            <EditableField label="" value={r.notes || "Add notes…"} multiline onSave={v => { updateAction(r.id, { notes: v }); setDrawer(d => ({ ...d, record: { ...d.record, notes: v }})); }}/>
          </div>
        </>
      );
    }
    return null;
  })();

  const drawerTitle = (() => {
    if(!drawer.record) return "";
    if(drawer.kind === "deal") return drawer.record.title;
    if(drawer.kind === "tx") return drawer.record.title;
    if(drawer.kind === "lease") return drawer.record.title;
    if(drawer.kind === "contact") return drawer.record.name;
    if(drawer.kind === "intel") return "Intel";
    if(drawer.kind === "action") return drawer.record.title;
    if(drawer.kind === "strategy") return "Idea";
    if(drawer.kind === "knowledge") return drawer.record.title || "Knowledge";
    return "";
  })();

  const drawerSub = (() => {
    if(!drawer.record) return "";
    if(drawer.kind === "deal") return drawer.record.suburb + " · " + drawer.record.processType;
    if(drawer.kind === "tx") return drawer.record.suburb + " — " + drawer.record.saleDateFmt;
    if(drawer.kind === "lease") return (drawer.record.tenant && drawer.record.tenant !== "—" ? drawer.record.tenant : "No tenant") + " · " + (drawer.record.status || "Draft");
    if(drawer.kind === "contact") return "";
    if(drawer.kind === "action") return drawer.record.ctx + " · " + (drawer.record.dueFmt || "no date");
    return "";
  })();

  // Save handler — for drafts, INSERT to Supabase and add to local list;
  // for existing records, fields auto-saved per edit, so just close.
  const onSavePrimary = async () => {
    const r = drawer.record;
    if(r && r._draft){
      const sb = window.__vantageAuth;
      if(!sb){ showToast('Not signed in — cannot save'); return; }
      let table, dbPatch;
      switch(drawer.kind){
        case 'lease':     table = 'leasing_cards';  dbPatch = _mapLeasePatch(r); break;
        case 'deal':      table = 'pipeline_cards'; dbPatch = _mapPipelinePatch(r); break;
        case 'tx':        table = 'deal_cards';     dbPatch = _mapDealPatch(r); break;
        case 'contact':   table = 'contacts';       dbPatch = _mapContactPatch(r); break;
        case 'action':    table = 'tasks';          dbPatch = _mapTaskPatch(r); break;
        case 'knowledge': table = 'knowledge_base'; dbPatch = _mapKnowledgePatch(r); break;
        default: closeDrawer(); return;
      }
      dbPatch.id = r.id;
      // Action: required defaults
      if(drawer.kind === 'action'){
        if(!dbPatch.title) dbPatch.title = r.title || 'New action';
        if(!dbPatch.status) dbPatch.status = 'Open';
        if(!dbPatch.importance) dbPatch.importance = r.importance || 'Medium';
        dbPatch.date_logged = new Date().toISOString().slice(0,10);
      }
      // Contact: auto-compose name from first+last if not already set
      if(drawer.kind === 'contact'){
        if(!dbPatch.name){
          const composed = ((r.firstName || "") + " " + (r.lastName || "")).trim();
          dbPatch.name = composed || (r.name || "New contact");
        }
        if(dbPatch.relationship_tier == null) dbPatch.relationship_tier = r.tier || 2;
        if(dbPatch.cadence_weeks == null) dbPatch.cadence_weeks = r.cadenceWeeks || 12;
      }
      try {
        const { error } = await sb.from(table).insert([dbPatch]);
        if(error){ showToast(`Save failed: ${error.message || 'unknown error'}`); return; }
      } catch(e){ showToast('Save failed — connection error'); return; }
      // Optimistically add to the appropriate local list with _draft cleared
      const saved = { ...r, _draft: false };
      if(drawer.kind === 'lease') setLeases(prev => [saved, ...prev]);
      else if(drawer.kind === 'deal'){ window.VT_DEALS = [saved, ...(window.VT_DEALS || [])]; setBumpKey(k => k + 1); }
      else if(drawer.kind === 'tx'){ window.VT_TRANSACTIONS = [saved, ...(window.VT_TRANSACTIONS || [])]; setBumpKey(k => k + 1); }
      else if(drawer.kind === 'contact'){ window.VT_CONTACTS = [saved, ...(window.VT_CONTACTS || [])]; setBumpKey(k => k + 1); }
      else if(drawer.kind === 'action'){ window.VT_ACTIONS = [saved, ...(window.VT_ACTIONS || [])]; setBumpKey(k => k + 1); }
      else if(drawer.kind === 'knowledge'){ window.VT_KNOWLEDGE = [saved, ...(window.VT_KNOWLEDGE || [])]; setBumpKey(k => k + 1); }
      showToast('Saved');
      closeDrawer();
      return;
    }
    // Non-draft: per-field saves already happened; this is just confirmation.
    showToast("Saved");
    closeDrawer();
  };

  // Close handler — for drafts, discard without saving (no DB row, no list entry).
  const onCancelOrClose = () => closeDrawer();

  const drawerFooter = (() => {
    const canPrint = flags.printView && (drawer.kind === "deal" || drawer.kind === "tx");
    const kindLabel = { deal:"deal", tx:"deal card", lease:"leasing card", contact:"contact", intel:"intel record", strategy:"idea", action:"task" }[drawer.kind] || "entry";
    const onDelete = async () => {
      if(!drawer.record) return;
      if(!confirm(`Delete this ${kindLabel}? This cannot be undone.`)) return;
      const id = drawer.record.id;
      const isDraft = !!drawer.record._draft;
      // For non-draft records, hit Supabase first. If it fails, abort so local
      // state and DB stay in sync.
      if(!isDraft){
        const table = _kindToTable[drawer.kind];
        if(table){
          const ok = await _persistDelete(table, id);
          if(!ok) return;
        }
      }
      // Local state cleanup
      if(drawer.kind === "deal"){
        window.VT_DEALS = (window.VT_DEALS || []).filter(x => x.id !== id);
      } else if(drawer.kind === "tx"){
        window.VT_TRANSACTIONS = (window.VT_TRANSACTIONS || []).filter(x => x.id !== id);
        window.VT_DEAL_CARDS = (window.VT_DEAL_CARDS || []).filter(x => x.id !== id);
      } else if(drawer.kind === "lease"){
        // Lease list lives in React state, not a window global
        setLeases(prev => prev.filter(l => l.id !== id));
      } else if(drawer.kind === "contact"){
        window.VT_CONTACTS = (window.VT_CONTACTS || []).filter(x => x.id !== id);
      } else if(drawer.kind === "intel"){
        window.VT_INTEL = (window.VT_INTEL || []).filter(x => x.id !== id);
      } else if(drawer.kind === "strategy"){
        window.VT_STRATEGY = (window.VT_STRATEGY || []).filter(x => x.id !== id);
        window.VT_IDEAS = (window.VT_IDEAS || []).filter(x => x.id !== id);
      } else if(drawer.kind === "knowledge"){
        window.VT_KNOWLEDGE = (window.VT_KNOWLEDGE || []).filter(x => x.id !== id);
      } else if(drawer.kind === "action"){
        window.VT_ACTIONS = (window.VT_ACTIONS || []).filter(x => x.id !== id);
      }
      setBumpKey(k => k + 1);
      showToast(kindLabel.charAt(0).toUpperCase() + kindLabel.slice(1) + " deleted");
      closeDrawer();
    };
    return (
      <>
        <button className="btn btn--danger" onClick={onDelete} title="Delete this entry" style={{marginRight:"auto"}}>
          <Icon name="trash" size={12}/> Delete
        </button>
        <button className="btn" onClick={onCancelOrClose}>{drawer.record && drawer.record._draft ? "Cancel" : "Close"}</button>
        {canPrint && <button className="btn" onClick={() => { setTearsheet(drawer.record); closeDrawer(); }}>Tear-sheet <Icon name="doc" size={12}/></button>}
        <button className="btn btn--primary" onClick={onSavePrimary}>Save</button>
      </>
    );
  })();

  return (
    <div className={"app" + (sidebarCollapsed ? " app--sidebar-collapsed" : "") + (mobileNavOpen ? " app--mobile-nav-open" : "")}>
      {/* Mobile nav backdrop */}
      <div className="mobile-nav-backdrop" onClick={() => setMobileNavOpen(false)} aria-hidden="true"/>
      {/* Sidebar */}
      <aside className="sidebar" aria-label="Navigation">
        <div className="sidebar__brand">
          <div className="mark">V</div>
          {!sidebarCollapsed && (
            <div className="brand__block">
              <div className="brand__name">Vantage</div>
              <div className="brand__sub">PKA Intelligence</div>
            </div>
          )}
        </div>
        <button
          className="sidebar__edge-toggle"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!sidebarCollapsed}
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden="true">
            <path d={sidebarCollapsed ? "M3 1l5 6-5 6" : "M7 1L2 7l5 6"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <nav className="sidebar__scroll">
          {NAV.map((n, i) => n.group ? (
            !sidebarCollapsed ? <div key={"g"+i} className="sidebar__label">{n.group}</div> : <div key={"g"+i} className="sidebar__divider"/>
          ) : (
            <button
              key={n.id}
              className={"navitem" + (view === n.id ? " active" : "")}
              onClick={() => { setView(n.id); setMobileNavOpen(false); }}
              aria-current={view === n.id ? "page" : undefined}
              title={sidebarCollapsed ? n.label : undefined}
            >
              <span className="navitem__g"><Icon name={n.icon} size={15}/></span>
              {!sidebarCollapsed && <span className="navitem__l">{n.label}</span>}
              {!sidebarCollapsed && (() => {
                const b = n.badge && n.badge();
                if(!b) return null;
                const tone = n.badgeTone && n.badgeTone();
                return <span className={"navitem__b" + (tone ? " " + tone : "")}>{b}</span>;
              })()}
            </button>
          ))}
        </nav>
        <div className="sidebar__foot">
          <div className="avatar" title={sidebarCollapsed ? "Ric Maydom · PKA" : undefined}>R</div>
          {!sidebarCollapsed && (
            <>
              <div className="who">
                <div className="who__n">Ric Maydom</div>
                <div className="who__r">PKA</div>
              </div>
              <button
                title="Sign out"
                style={{fontSize:10, color:"var(--ink-4)", fontFamily:"var(--mono)", cursor:"pointer", background:"none", border:"1px solid var(--rule)", padding:"3px 7px", borderRadius:4, letterSpacing:"0.04em", flexShrink:0}}
                onClick={() => {
                  if(window.__vantageAuth) window.__vantageAuth.auth.signOut().then(() => location.reload());
                  else location.reload();
                }}
              >sign out</button>
            </>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        <header className="topbar">
          <button className="topbar__hamburger" onClick={() => setMobileNavOpen(true)} aria-label="Open menu" title="Menu">
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
              <path d="M1 1h16M1 7h16M1 13h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="topbar__title">
            <span className="crumb">{title[0]}</span>{title[1]}
          </div>
          {flags.commandK && (
            <button className="btn btn--hide-sm" onClick={() => setPaletteOpen(true)} title="Search everything (⌘K)">
              <Icon name="search" size={13}/><span className="btn--label"> Search</span><kbd style={{marginLeft:6, fontSize:10, fontFamily:"var(--mono)", color:"var(--ink-4)"}}>⌘K</kbd>
            </button>
          )}
          <button className="btn btn--refresh" onClick={runMasterRefresh} disabled={refreshing} title="Refresh: parse captures, re-fetch all data">
            <Icon name="refresh" size={13}/><span className="btn--label"> {refreshing ? "Refreshing…" : "Refresh"}</span>
          </button>
          <button className="btn btn--outlook btn--hide-sm" onClick={requestOutlookSync} title="Request Outlook sync (runs when Cowork is open)">
            <Icon name="mail" size={13}/><span className="btn--label"> Outlook</span>
          </button>
          <button className="btn btn--capture" onClick={() => setModal("capture")} title="Quick capture (c)">
            <Icon name="capture" size={13}/><span className="btn--label"> Capture</span>
          </button>
          <button className="btn" onClick={() => setModal("granola")} title="Sync Granola meetings">
            <Icon name="refresh" size={13}/><span className="btn--label"> Granola</span>
          </button>
        </header>

        <main className="content" key={"k-" + bumpKey}>
          {content}
        </main>
      </div>

      {/* Drawer */}
      <Drawer
        open={drawer.open}
        title={drawerTitle}
        subtitle={drawerSub}
        onClose={closeDrawer}
        footer={drawerFooter}
      >
        {drawerBody}
      </Drawer>

      {/* Tearsheet */}
      {tearsheet && <Tearsheet deal={tearsheet} onClose={() => setTearsheet(null)}/>}

      {/* Command palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onSelect={onPaletteSelect}/>

      {/* Modals */}
      <Modal
        open={modal === "capture"}
        title="Quick Capture"
        subtitle="Paste anything. Leo will extract actions, deals, intel and contacts."
        onClose={() => setModal(null)}
        footer={
          <>
            <button className="btn" onClick={() => { setCaptureText(""); setModal(null); }}>Cancel</button>
            <button className="btn btn--accent" onClick={() => {
              if(!captureText.trim()){ showToast("Nothing to capture"); return; }
              const text = captureText.trim();
              setCaptureText(""); setModal(null); showToast("Saved to Leo queue");
              savePendingCapture(text, "quick_capture");
            }}>Save to queue</button>
          </>
        }
      >
        <textarea className="free" value={captureText} onChange={e => setCaptureText(e.target.value)} placeholder="Paste text, meeting notes, or a quick thought. e.g. 'Mirvac looking to divest Docklands tower — unconfirmed. Call Mark Oates.'"/>
      </Modal>

      <Modal
        open={modal === "granola"}
        title="Granola Sync"
        subtitle="Pull your latest meetings directly from Granola into Vantage"
        onClose={() => setModal(null)}
        footer={
          <>
            <button className="btn" onClick={() => setModal(null)}>Close</button>
            <button
              className="btn btn--accent"
              onClick={requestGranolaSync}
              disabled={granolaStatus.status === 'requested' || granolaStatus.requested}
            >
              {granolaStatus.status === 'requested' ? <><Icon name="refresh" size={12}/> Sync requested</> : <><Icon name="refresh" size={12}/> Request sync</>}
            </button>
          </>
        }
      >
        {granolaStatus.loading ? (
          <div className="muted text-sm" style={{padding:"28px 0", textAlign:"center"}}>Loading sync status...</div>
        ) : (
          <div>
            <div style={{display:"flex", gap:24, padding:"14px 0", borderBottom:"1px solid var(--rule)", marginBottom:14}}>
              <div style={{flex:1}}>
                <div style={{fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-3)", marginBottom:4}}>Last synced</div>
                <div style={{fontSize:14, fontWeight:500}}>
                  {granolaStatus.lastSynced
                    ? new Date(granolaStatus.lastSynced).toLocaleString('en-AU', {dateStyle:'medium', timeStyle:'short'})
                    : <span className="muted">Never</span>}
                </div>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-3)", marginBottom:4}}>Status</div>
                <div style={{fontSize:14, fontWeight:500, textTransform:"capitalize"}}>
                  {granolaStatus.status === 'idle' || !granolaStatus.status ? <span className="muted">Idle</span>
                    : granolaStatus.status === 'requested' ? <span style={{color:"#D97706"}}>Requested</span>
                    : granolaStatus.status === 'error' ? <span style={{color:"#EF4444"}}>Error</span>
                    : granolaStatus.status}
                </div>
              </div>
            </div>
            <p style={{fontSize:13, color:"var(--ink-3)", lineHeight:1.55, margin:0}}>
              Requesting a sync flags Leo to pull your latest Granola meetings at the next session start. New meetings are parsed for actions, deal intel, contacts, and market intelligence — then routed to the relevant team members.
            </p>
            {granolaStatus.requested && (
              <div className="leo-read" style={{marginTop:14}}>
                <div className="leo-read__tag"><span className="orb"/> Sync queued</div>
                <p style={{margin:"6px 0 0", fontSize:12}}>Leo will process your Granola meetings at next session start.</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={modal === "shortcuts"}
        title="Keyboard shortcuts"
        subtitle="Power-user moves"
        onClose={() => setModal(null)}
      >
        <div className="shortcuts">
          <div><kbd>⌘K</kbd> / <kbd>/</kbd><span>Open command palette</span></div>
          <div><kbd>g d</kbd><span>Go to Dashboard</span></div>
          <div><kbd>g a</kbd><span>Go to Actions</span></div>
          <div><kbd>g c</kbd><span>Go to CRM</span></div>
          <div><kbd>g p</kbd><span>Go to Pipeline</span></div>
          <div><kbd>g t</kbd><span>Go to Deals</span></div>
          <div><kbd>g i</kbd><span>Go to Market Intel</span></div>
          <div><kbd>g s</kbd><span>Go to Strategy</span></div>
          <div><kbd>c</kbd><span>Quick Capture</span></div>
          <div><kbd>b</kbd><span>Morning Briefing</span></div>
          <div><kbd>esc</kbd><span>Close any dialog</span></div>
          <div><kbd>?</kbd><span>This help</span></div>
        </div>
      </Modal>

      {/* Tweaks */}
      <Tweaks
        open={tweaksOpen}
        onClose={() => setTweaksOpen(false)}
        state={{ theme, density, ...flags }}
        set={onSetTheme}
      />

      <Toast msg={toast}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
