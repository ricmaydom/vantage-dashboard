// Root app
const { useState: useStateA, useEffect: useEffectA, useMemo: useMemoA, useCallback: useCallbackA, useRef: useRefA } = React;

const NAV = [
  { group: "Daily" },
  { id: "dashboard", label: "Dashboard", icon: "dashboard", badge: () => null },
  { id: "actions", label: "Actions", icon: "check", badge: () => window.VT_STATS.openActions || null, badgeTone: () => window.VT_STATS.overdueActions > 0 ? "hot" : null },
  { group: "Relationships" },
  { id: "crm", label: "CRM", icon: "users", badge: () => window.VT_STATS.overdueContacts || null, badgeTone: () => "warm" },
  { group: "Deals & Leasing" },
  { id: "pipeline", label: "Pipeline", icon: "target", badge: () => window.VT_STATS.activeDealCount || null },
  { id: "deals", label: "Deal Cards", icon: "building", badge: () => null },
  { id: "leasing", label: "Leasing", icon: "doc", badge: () => null },
  { group: "Intelligence" },
  { id: "intel", label: "Market Intel", icon: "radar", badge: () => null },
  { id: "strategy", label: "Strategy", icon: "idea", badge: () => null },
];

const TITLES = {
  dashboard: ["Today", "Dashboard"],
  actions: ["Work", "Actions"],
  crm: ["Relationships", "CRM"],
  pipeline: ["Deals & Leasing", "Pipeline"],
  deals: ["Deals & Leasing", "Deal Cards"],
  leasing: ["Deals & Leasing", "Leasing Cards"],
  intel: ["Intelligence", "Market Intel"],
  strategy: ["Intelligence", "Strategy & Ideas"],
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
  const [drawer, setDrawer] = useStateA({ open: false, kind: null, record: null });
  const openDeal = (d) => setDrawer({ open: true, kind: "deal", record: d });
  const openTx = (t) => setDrawer({ open: true, kind: "tx", record: t });
  const openLease = (l) => setDrawer({ open: true, kind: "lease", record: l });
  const openContact = (c) => setDrawer({ open: true, kind: "contact", record: c });
  const openIntel = (i) => setDrawer({ open: true, kind: "intel", record: i });
  const openStrategy = (s) => setDrawer({ open: true, kind: "strategy", record: s });
  const openAction = (a) => setDrawer({ open: true, kind: "action", record: a });
  const closeDrawer = () => setDrawer({ open: false, kind: null, record: null });

  // ad-hoc action edits (stored per-id, spread over VT_ACTIONS at render)
  const [actionEdits, setActionEdits] = useStateA(() => {
    try { return JSON.parse(localStorage.getItem("vt:actionEdits") || "{}"); } catch(e){ return {}; }
  });
  const updateAction = (id, patch) => {
    setActionEdits(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), ...patch } };
      localStorage.setItem("vt:actionEdits", JSON.stringify(next));
      return next;
    });
    // apply to live data so grouping stays consistent
    const a = window.VT_ACTIONS.find(x => x.id === id);
    if(a){ Object.assign(a, patch); }
  };
  // apply edits once on mount
  useEffectA(() => {
    Object.keys(actionEdits).forEach(id => {
      const a = window.VT_ACTIONS.find(x => x.id === id);
      if(a) Object.assign(a, actionEdits[id]);
    });
  }, []);

  // ad-hoc contact edits
  const [contactEdits, setContactEdits] = useStateA(() => {
    try { return JSON.parse(localStorage.getItem("vt:contactEdits") || "{}"); } catch(e){ return {}; }
  });
  const updateContact = (id, patch) => {
    setContactEdits(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), ...patch } };
      localStorage.setItem("vt:contactEdits", JSON.stringify(next));
      return next;
    });
    const c = window.VT_CONTACTS.find(x => x.id === id);
    if(c){ Object.assign(c, patch); }
  };
  useEffectA(() => {
    Object.keys(contactEdits).forEach(id => {
      const c = window.VT_CONTACTS.find(x => x.id === id);
      if(c) Object.assign(c, contactEdits[id]);
    });
  }, []);

  // ad-hoc deal edits
  const [dealEdits, setDealEdits] = useStateA(() => {
    try { return JSON.parse(localStorage.getItem("vt:dealEdits") || "{}"); } catch(e){ return {}; }
  });
  const updateDeal = (id, patch) => {
    setDealEdits(prev => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), ...patch } };
      localStorage.setItem("vt:dealEdits", JSON.stringify(next));
      return next;
    });
    const d = (window.VT_DEALS || []).find(x => x.id === id)
      || (window.VT_TRANSACTIONS || []).find(x => x.id === id)
      || (window.VT_DEAL_CARDS || []).find(x => x.id === id);
    if(d){ Object.assign(d, patch); }
  };
  useEffectA(() => {
    Object.keys(dealEdits).forEach(id => {
      const d = (window.VT_DEALS || []).find(x => x.id === id)
        || (window.VT_TRANSACTIONS || []).find(x => x.id === id)
        || (window.VT_DEAL_CARDS || []).find(x => x.id === id);
      if(d) Object.assign(d, dealEdits[id]);
    });
  }, []);

  // leases (new records + edits, localStorage-backed)
  const [leases, setLeases] = useStateA(() => {
    try { return JSON.parse(localStorage.getItem("vt:leases") || "[]"); } catch(e){ return []; }
  });
  useEffectA(() => { try { localStorage.setItem("vt:leases", JSON.stringify(leases)); } catch(e){} }, [leases]);
  useEffectA(() => { window.VT_LEASES = leases; }, [leases]);
  const updateLease = (id, patch) => {
    setLeases(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  };
  const addLease = () => {
    const id = "lease_" + Date.now();
    const blank = { id, title: "Untitled leasing", suburb: "—", state: "—", tenant: "—", landlord: "—", sector: null, status: "Negotiating", area: "—", rent: "—", term: "—", incentive: "—", commencement: "—", notes: "" };
    setLeases(prev => [blank, ...prev]);
    return blank;
  };
  const removeLease = (id) => setLeases(prev => prev.filter(l => l.id !== id));

  // tearsheet
  const [tearsheet, setTearsheet] = useStateA(null);

  // action done state
  const [doneIds, setDoneIds] = useStateA(() => {
    try { return new Set(JSON.parse(localStorage.getItem("vt:doneIds") || "[]")); } catch { return new Set(); }
  });
  useEffectA(() => { localStorage.setItem("vt:doneIds", JSON.stringify([...doneIds])); }, [doneIds]);
  useEffectA(() => {
    window.VT_ACTIONS.forEach(a => { if(doneIds.has(a.id)) a.done = true; });
    window.VT_STATS.openActions = window.VT_ACTIONS.filter(a => !a.done).length;
    window.VT_STATS.doneActions = window.VT_ACTIONS.filter(a => a.done).length;
    window.VT_STATS.overdueActions = window.VT_ACTIONS.filter(a => !a.done && a.bucket === "overdue").length;
    window.VT_STATS.todayActions = window.VT_ACTIONS.filter(a => !a.done && a.bucket === "today").length;
  }, []);
  const toggleAction = (id) => {
    setDoneIds(prev => {
      const next = new Set(prev);
      if(next.has(id)) next.delete(id); else next.add(id);
      const a = window.VT_ACTIONS.find(x => x.id === id);
      if(a) a.done = next.has(id);
      return next;
    });
    window.VT_STATS.openActions = window.VT_ACTIONS.filter(a => !a.done).length;
    window.VT_STATS.doneActions = window.VT_ACTIONS.filter(a => a.done).length;
    window.VT_STATS.overdueActions = window.VT_ACTIONS.filter(a => !a.done && a.bucket === "overdue").length;
    window.VT_STATS.todayActions = window.VT_ACTIONS.filter(a => !a.done && a.bucket === "today").length;
  };

  // modals
  const [modal, setModal] = useStateA(null);
  const [captureText, setCaptureText] = useStateA("");
  const [eodText, setEodText] = useStateA("");

  // palette
  const [paletteOpen, setPaletteOpen] = useStateA(false);

  // toast
  const [toast, setToast] = useStateA(null);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

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
      if(e.key === "b"){ e.preventDefault(); setModal("briefing"); return; }
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
      case "dashboard": return <ScreenDashboard setView={setView} openDeal={openDeal} openTx={openTx} toggleAction={toggleAction} flags={flags} setModal={setModal} leoDismissed={leoDismissed} setLeoDismissed={setLeoDismissed}/>;
      case "actions":   return <ScreenActions toggleAction={toggleAction} openAction={openAction} updateAction={updateAction} {...props}/>;
      case "crm":       return <ScreenCRM openContact={openContact} {...props}/>;
      case "pipeline":  return <ScreenPipeline openDeal={openDeal} {...props}/>;
      case "deals":     return <ScreenDeals openTx={openTx} {...props}/>;
      case "leasing":   return <ScreenLeasing leases={leases} openLease={openLease} addLease={() => { const l = addLease(); openLease(l); }} removeLease={removeLease} {...props}/>;
      case "intel":     return <ScreenIntel openIntel={openIntel} {...props}/>;
      case "strategy":  return <ScreenStrategy openStrategy={openStrategy} {...props}/>;
      default:          return <ScreenDashboard setView={setView} openDeal={openDeal} openTx={openTx} toggleAction={toggleAction} flags={flags} setModal={setModal} leoDismissed={leoDismissed} setLeoDismissed={setLeoDismissed}/>;
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
      const setDealField = (k,v) => { updateDeal(r.id, { [k]: v }); setDrawer(d => ({ ...d, record: { ...d.record, [k]: v }})); };
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
              <EditableField label="Agent" value={r.agent || "—"} onSave={v => setDealField("agent", v)}/>
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
      const setField = (k,v) => { updateContact(r.id, { [k]: v }); setDrawer(d => ({ ...d, record: { ...d.record, [k]: v }})); };
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
              <EditableField label="Name" value={r.name} onSave={v => setField("name", v)}/>
              <EditableField label="Firm" value={r.firm} onSave={v => setField("firm", v)}/>
              <EditableField label="Role" value={r.role} onSave={v => setField("role", v)}/>
              <EditableField label="Tier" value={String(r.tier)} options={TIER_OPTS} onSave={v => setField("tier", Number(v))}/>
              <EditableField label="Sector" value={r.sector || "—"} options={SECTOR_OPTS} onSave={v => setField("sector", v === "—" ? null : v)}/>
              <EditableField label="Email" value={r.email || "—"} onSave={v => setField("email", v)}/>
              <EditableField label="Phone" value={r.phone || "—"} onSave={v => setField("phone", v)}/>
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
      return (
        <>
          <div className="drawer__section">
            <div className="editrow">
              <EditableField label="Category" value={r.category} options={INTEL_CATEGORIES}/>
              <EditableField label="Confidence" value={r.confidence} options={CONFIDENCE_OPTS}/>
              <EditableField label="Sector" value={r.sector || "—"} options={SECTOR_OPTS}/>
              <EditableField label="Date" value={r.dateFmt} type="date"/>
            </div>
            <div style={{fontSize:17, fontWeight:600, lineHeight:1.35, letterSpacing:"-0.01em", marginTop:14}}>{r.title}</div>
          </div>
          {r.body && <div className="drawer__section"><h4>Summary</h4><div className="drawer__notes">{r.body}</div></div>}
          {r.source && <div className="drawer__section"><h4>Source</h4><div className="muted text-sm">{r.source}</div></div>}
        </>
      );
    }
    if(drawer.kind === "strategy"){
      const THEME_OPTS = ["Mandate","Thesis","Process","Pipeline","Capital","Research","Other"];
      const STATUS_OPTS = ["Raw Idea","Developing","Validated","Shelved"];
      const SECTOR_OPTS = ["Office","Retail","Industrial","Residential","Hotel","Alternatives","—"];
      const IMPORTANCE_OPTS = ["High","Medium","Low"];
      return (
        <>
          <div className="drawer__section">
            <div className="editrow">
              <EditableField label="Theme" value={r.theme} options={THEME_OPTS}/>
              <EditableField label="Sector" value={r.sector || "—"} options={SECTOR_OPTS}/>
              <EditableField label="Status" value={r.status} options={STATUS_OPTS}/>
              <EditableField label="Importance" value={r.importance} options={IMPORTANCE_OPTS}/>
              <EditableField label="Date" value={r.dateFmt} type="date"/>
            </div>
          </div>
          <div className="drawer__section"><h4>Idea</h4><div className="drawer__notes">{r.body}</div></div>
        </>
      );
    }
    if(drawer.kind === "lease"){
      const SECTOR_OPTS = ["Office","Retail","Industrial","Residential","Hotel","Alternatives","Diversified","—"];
      const STATUS_OPTS = ["Inquiry","Tour","Negotiating","LOI","Heads of Agreement","Executed","Lost"];
      const setLeaseField = (k,v) => { updateLease(r.id, { [k]: v }); setDrawer(d => ({ ...d, record: { ...d.record, [k]: v }})); };
      return (
        <>
          <div className="drawer__section">
            <div className="editrow">
              <EditableField label="Property / address" value={r.title} onSave={v => setLeaseField("title", v)}/>
              <EditableField label="Suburb" value={r.suburb || "—"} onSave={v => setLeaseField("suburb", v)}/>
              <EditableField label="State" value={r.state || "—"} options={["VIC","NSW","QLD","WA","SA","TAS","ACT","NT","—"]} onSave={v => setLeaseField("state", v === "—" ? null : v)}/>
              <EditableField label="Sector" value={r.sector || "—"} options={SECTOR_OPTS} onSave={v => setLeaseField("sector", v === "—" ? null : v)}/>
              <EditableField label="Status" value={r.status || "—"} options={STATUS_OPTS} onSave={v => setLeaseField("status", v)}/>
              <EditableField label="Tenant" value={r.tenant || "—"} onSave={v => setLeaseField("tenant", v)}/>
              <EditableField label="Landlord" value={r.landlord || "—"} onSave={v => setLeaseField("landlord", v)}/>
            </div>
            <div className="editrow" style={{marginTop:10}}>
              <EditableField label="Area (sqm)" value={r.area || "—"} onSave={v => setLeaseField("area", v)}/>
              <EditableField label="Rent basis" value={r.rentBasis || "—"} options={["Net","Gross","Semi-Gross","—"]} onSave={v => setLeaseField("rentBasis", v === "—" ? null : v)}/>
              <EditableField label="Face rent ($/sqm)" value={r.rent || "—"} onSave={v => setLeaseField("rent", v)}/>
              <EditableField label="Term (yrs)" value={r.term || "—"} onSave={v => setLeaseField("term", v)}/>
              <EditableField label="Incentive (%)" value={r.incentive || "—"} onSave={v => setLeaseField("incentive", v)}/>
              <EditableField label="Commencement" value={r.commencement || "—"} type="date" onSave={v => setLeaseField("commencement", v)}/>
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
              <EditableField label="Linked deal" value={r.ctx || "— None —"} options={["— None —", ...((window.VT_DEALS || []).map(d => d.title))]} onSave={v => { const val = v === "— None —" ? "" : v; updateAction(r.id, { ctx: val }); setDrawer(d => ({ ...d, record: { ...d.record, ctx: val }})); }}/>
              <EditableField label="Importance" value={r.importance} options={IMPORTANCE_OPTS} onSave={v => { updateAction(r.id, { importance: v }); setDrawer(d => ({ ...d, record: { ...d.record, importance: v }})); }}/>
              <EditableField label="Due" value={r.dueFmt || "—"} type="date" onSave={v => { updateAction(r.id, { dueFmt: v }); setDrawer(d => ({ ...d, record: { ...d.record, dueFmt: v }})); }}/>
              <EditableField label="Status" value={r.done ? "Done" : "Open"} options={["Open","Done"]} onSave={v => { const done = v === "Done"; if(done !== !!r.done){ toggleAction(r.id); setDrawer(d => ({ ...d, record: { ...d.record, done }})); }}}/>
            </div>
          </div>
          {r.notes && <div className="drawer__section"><h4>Notes</h4><div className="drawer__notes">{r.notes}</div></div>}
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

  const drawerFooter = (() => {
    const canPrint = flags.printView && (drawer.kind === "deal" || drawer.kind === "tx");
    const kindLabel = { deal:"deal", tx:"deal card", lease:"leasing card", contact:"contact", intel:"intel record", strategy:"idea", action:"task" }[drawer.kind] || "entry";
    const onDelete = () => {
      if(!drawer.record) return;
      if(!confirm(`Delete this ${kindLabel}? This cannot be undone.`)) return;
      const id = drawer.record.id;
      if(drawer.kind === "deal"){
        window.VT_DEALS = (window.VT_DEALS || []).filter(x => x.id !== id);
      } else if(drawer.kind === "tx"){
        window.VT_TRANSACTIONS = (window.VT_TRANSACTIONS || []).filter(x => x.id !== id);
        window.VT_DEAL_CARDS = (window.VT_DEAL_CARDS || []).filter(x => x.id !== id);
      } else if(drawer.kind === "lease"){
        removeLease(id);
      } else if(drawer.kind === "contact"){
        window.VT_CONTACTS = (window.VT_CONTACTS || []).filter(x => x.id !== id);
      } else if(drawer.kind === "intel"){
        window.VT_INTEL = (window.VT_INTEL || []).filter(x => x.id !== id);
      } else if(drawer.kind === "strategy"){
        window.VT_STRATEGY = (window.VT_STRATEGY || []).filter(x => x.id !== id);
        window.VT_IDEAS = (window.VT_IDEAS || []).filter(x => x.id !== id);
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
        <button className="btn" onClick={closeDrawer}>Close</button>
        {canPrint && <button className="btn" onClick={() => { setTearsheet(drawer.record); closeDrawer(); }}>Tear-sheet <Icon name="doc" size={12}/></button>}
        <button className="btn btn--primary" onClick={() => { showToast("Saved"); closeDrawer(); }}>Save</button>
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
              <div className="who__dot" title="Online"/>
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
          <button className="btn btn--briefing btn--hide-sm" onClick={() => setModal("briefing")} title="Morning briefing (b)">
            <Icon name="sun" size={13}/><span className="btn--label"> Briefing</span>
          </button>
          <button className="btn btn--capture" onClick={() => setModal("capture")} title="Quick capture (c)">
            <Icon name="capture" size={13}/><span className="btn--label"> Capture</span>
          </button>
          <button className="btn btn--eod btn--hide-sm" onClick={() => setModal("eod")} title="End of day">
            <Icon name="moon" size={13}/><span className="btn--label"> EOD</span>
          </button>
          <button className="btn" onClick={() => showToast("Synced with Granola — 0 new meetings")} title="Sync Granola">
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
        open={modal === "briefing"}
        title="Morning Briefing"
        subtitle="Leo has processed overnight — here's where you are"
        onClose={() => setModal(null)}
        footer={<button className="btn btn--accent" onClick={() => setModal(null)}>Start day</button>}
      >
        <div className="leo-read">
          <div className="leo-read__tag"><span className="orb"/> Leo · read this first</div>
          <p style={{margin:"6px 0 0"}}>
            <strong>{window.VT_STATS.overdueActions}</strong> overdue action{window.VT_STATS.overdueActions === 1 ? "" : "s"} and <strong>{window.VT_STATS.todayActions}</strong> due today.
            Pipeline is <strong>{window.VT_STATS.activeDealValueFmt}</strong> across <strong>{window.VT_STATS.activeDealCount}</strong> deals.
            {window.VT_STATS.overdueContacts > 0 && <> Cadence is slipping with <strong>{window.VT_STATS.overdueContacts}</strong> contact{window.VT_STATS.overdueContacts === 1 ? "" : "s"} — top of list if you have time.</>}
          </p>
        </div>
        <div className="mt">
          <h4 style={{fontSize:11, color:"var(--ink-3)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8}}>Today's action focus</h4>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {window.VT_ACTIONS.filter(a => !a.done && (a.bucket === "overdue" || a.bucket === "today")).slice(0, 5).map(a => (
                  <tr key={a.id}>
                    <td className="strong">{a.title}</td>
                    <td style={{width:90}}><ImportanceChip i={a.importance}/></td>
                    <td className="mono num" style={{textAlign:"right", width:90}}>{a.dueFmt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

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
              setCaptureText(""); setModal(null); showToast("Saved to Leo queue");
            }}>Save to queue</button>
          </>
        }
      >
        <textarea className="free" value={captureText} onChange={e => setCaptureText(e.target.value)} placeholder="Paste text, meeting notes, or a quick thought. e.g. 'Mirvac looking to divest Docklands tower — unconfirmed. Call Mark Oates.'"/>
      </Modal>

      <Modal
        open={modal === "eod"}
        title="End of Day"
        subtitle="Brain-dump anything — Leo will process overnight and route it correctly"
        onClose={() => setModal(null)}
        footer={
          <>
            <button className="btn" onClick={() => { setEodText(""); setModal(null); }}>Cancel</button>
            <button className="btn btn--accent" onClick={() => {
              if(!eodText.trim()){ showToast("Nothing to wrap up"); return; }
              setEodText(""); setModal(null); showToast("Wrapped — see you tomorrow");
            }}>Submit & wrap up</button>
          </>
        }
      >
        <textarea className="free" value={eodText} onChange={e => setEodText(e.target.value)} placeholder="Rumours, to-dos, follow-ups, deal snippets, thoughts. Free-form is fine."/>
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
          <div><kbd>g t</kbd><span>Go to Deal Cards</span></div>
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
