// Shared UI primitives
const { useState, useEffect, useRef, useMemo, useCallback, Fragment } = React;

// ---------- Icons (inline SVG, minimal) ----------
const Icon = ({ name, size = 14 }) => {
  const paths = {
    dashboard: "M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v5h-8V3zm0 7h8v11h-8V10z",
    check: "M4 12l5 5L20 6",
    users: "M16 14a4 4 0 10-8 0m8 0H8m8 0v2a4 4 0 01-8 0v-2m12-4a3 3 0 110-6 3 3 0 010 6zm0 0c2 0 4 1 4 3v1h-4m-12-4a3 3 0 100-6 3 3 0 000 6zm0 0c-2 0-4 1-4 3v1h4",
    target: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 5a5 5 0 100 10 5 5 0 000-10zm0 3a2 2 0 110 4 2 2 0 010-4z",
    building: "M3 21V6a1 1 0 011-1h6a1 1 0 011 1v15M3 21h8m0 0V10a1 1 0 011-1h8a1 1 0 011 1v11m0 0h-9M7 9h.01M7 13h.01M7 17h.01M15 13h.01M15 17h.01",
    doc: "M8 2h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2h2zm6 0v6h6M8 13h8M8 17h6",
    radar: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 4a6 6 0 100 12 6 6 0 000-12zm0 3a3 3 0 100 6 3 3 0 000-6z",
    idea: "M9 18h6m-3 3v-3M8 11a4 4 0 118 0c0 2-1 3-2 4v2H10v-2c-1-1-2-2-2-4z",
    plus: "M12 5v14m-7-7h14",
    close: "M6 6l12 12M6 18L18 6",
    sun: "M12 3v2m0 14v2m9-9h-2M5 12H3m15.5-6.5l-1.4 1.4M7 7L5.5 5.5m13 13L17 17M7 17l-1.5 1.5M12 8a4 4 0 100 8 4 4 0 000-8z",
    moon: "M20 14A9 9 0 0111 4a9 9 0 1010 10z",
    capture: "M12 5v14M5 12h14",
    sparkle: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6zM19 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z",
    search: "M11 18a7 7 0 100-14 7 7 0 000 14zm5-2l5 5",
    filter: "M4 5h16M7 12h10m-7 7h4",
    chevR: "M9 5l7 7-7 7",
    chevD: "M5 9l7 7 7-7",
    refresh: "M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3M20 4v5h-5M4 20v-5h5",
    phone: "M3 5a2 2 0 012-2h2l2 4-2 1c1 2 3 4 5 5l1-2 4 2v2a2 2 0 01-2 2A16 16 0 013 5z",
    mail: "M3 6l9 7 9-7M3 6v12a2 2 0 002 2h14a2 2 0 002-2V6M3 6h18",
    calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
    settings: "M12 15a3 3 0 100-6 3 3 0 000 6zm7-3l2-1-2-3-2 1a7 7 0 00-2-1l-1-2h-4l-1 2a7 7 0 00-2 1l-2-1-2 3 2 1a7 7 0 000 2l-2 1 2 3 2-1a7 7 0 002 1l1 2h4l1-2a7 7 0 002-1l2 1 2-3-2-1a7 7 0 000-2z",
    drag: "M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01",
    location: "M12 21s8-7.5 8-13a8 8 0 10-16 0c0 5.5 8 13 8 13zm0-10a3 3 0 100-6 3 3 0 000 6z",
    granola: "M12 2a10 10 0 100 20 10 10 0 000-20zm-3 7l3 3 5-5",
    trash: "M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6",
    pencil: "M16 3l5 5-12 12H4v-5L16 3zm-2 2l5 5",
  };
  const d = paths[name] || paths.dashboard;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
};

// ---------- Chips ----------
const Chip = ({ kind, children }) => (
  <span className={"chip " + (kind || "")}>{children}</span>
);

const SectorChip = ({ s }) => s ? <Chip kind={VT_CLS.sector(s)}>{s}</Chip> : null;
const ConfidenceChip = ({ c }) => c ? <Chip kind={VT_CLS.confidence(c)}>{c}</Chip> : null;
const ImportanceChip = ({ i }) => i ? <Chip kind={VT_CLS.importance(i)}>{i}</Chip> : null;
const TierChip = ({ t }) => <Chip kind={VT_CLS.tier(t)}>Tier {t || 3}</Chip>;
const PhaseChip = ({ p }) => p ? <Chip kind="chip--phase">{p}</Chip> : null;

// ---------- Section head ----------
const SectionHead = ({ title, count, subtitle, subtitleBelow, children }) => (
  <div className={"sec" + (subtitleBelow ? " sec--stacked" : "")}>
    <div className="sec__main">
      <div className="sec__title">
        <h2>{title}</h2>
        {count != null && <span className="sec__count">{count}</span>}
        {subtitle && !subtitleBelow && <span className="sec__sub">{subtitle}</span>}
      </div>
      {subtitle && subtitleBelow && <div className="sec__sub sec__sub--below">{subtitle}</div>}
    </div>
    <div className="sec__actions">{children}</div>
  </div>
);

// ---------- Search input ----------
const Search = ({ value, onChange, placeholder = "Search…" }) => (
  <div className="search">
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

// ---------- Tabs ----------
const Tabs = ({ value, onChange, items }) => (
  <div className="tabs">
    {items.map(it => (
      <button key={it.v} className={"tab" + (value === it.v ? " active" : "")} onClick={() => onChange(it.v)}>
        {it.l}{it.c != null && <span style={{opacity:0.5, marginLeft:6, fontFamily:"var(--mono)", fontSize:10}}>{it.c}</span>}
      </button>
    ))}
  </div>
);

// ---------- Cards ----------
// Status dot (health)
const StatusDot = ({ health }) => (
  <span className={"status-dot status-dot--" + (health || "track")} data-tip={window.HEALTH_LABEL_MAP ? window.HEALTH_LABEL_MAP[health] : (health || "")}/>
);

const DealCard = ({ deal, onClick, flags }) => {
  if(flags && flags.valueHero){
    return (
      <div className="card card--hero" data-sector={deal.sector || ""} onClick={() => onClick(deal)}>
        <div className="card__edge"/>
        <div className="card__body">
          <div className="card__row1">
            <div className="card__title">{deal.title}</div>
            <div className="card__moneypill">
              <div className="card__money">{deal.valueFmt}</div>
              {deal.yield !== "—" && <div className="card__yield">{deal.yield}</div>}
            </div>
          </div>
          <div className="card__sub">
            <span>{deal.suburb || "—"}</span>
            {deal.processType && <><span className="dot"/><span>{deal.processType}</span></>}
          </div>
          {deal.notes && <div className="card__notes">{deal.notes}</div>}
          <div className="card__chips">
            {flags.statusDots && <span data-tip={deal.healthLabel + " · " + deal.days + "d in phase"}><StatusDot health={deal.health}/></span>}
            <PhaseChip p={deal.phase}/>
            <ConfidenceChip c={deal.confidence}/>
            <span style={{marginLeft:"auto", fontSize:10, color:"var(--ink-4)", fontFamily:"var(--mono)"}} {...(flags.relTime && deal.dateFull ? { "data-tip": deal.dateFull } : {})}>{deal.dateLabel}</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="card" onClick={() => onClick(deal)}>
      <div className="card__head">
        <div style={{flex:1, minWidth:0}}>
          <div className="card__title">
            {flags && flags.statusDots && <span data-tip={deal.healthLabel + " · " + deal.days + "d in phase"} style={{marginRight:6, verticalAlign:"middle"}}><StatusDot health={deal.health}/></span>}
            {deal.title}
          </div>
          <div className="card__sub">
            <span>{deal.suburb || "—"}</span>
            {deal.processType && <><span className="dot"/><span>{deal.processType}</span></>}
          </div>
        </div>
      </div>
      <div className="card__meta">
        <SectorChip s={deal.sector}/>
        <PhaseChip p={deal.phase}/>
        <ConfidenceChip c={deal.confidence}/>
      </div>
      {deal.notes && <div className="card__notes">{deal.notes}</div>}
      <div className="card__foot">
        <div>
          <div className="card__val">{deal.valueFmt}<small>{deal.yield !== "—" ? " · " + deal.yield : ""}</small></div>
        </div>
        <div className="text-sm muted" {...(flags && flags.relTime && deal.dateFull ? { "data-tip": deal.dateFull } : {})}>{deal.dateLabel}</div>
      </div>
    </div>
  );
};

const TxCard = ({ tx, onClick, flags }) => {
  if(flags && flags.valueHero){
    return (
      <div className="card card--hero" data-sector={tx.sector || ""} onClick={() => onClick(tx)}>
        <div className="card__edge"/>
        <div className="card__body" style={{position:"relative"}}>
          <div style={{paddingRight:90}}>
            <div className="card__title">{tx.title}</div>
          </div>
          <div style={{position:"absolute", top:14, right:14, textAlign:"right", flexShrink:0}}>
            <div className="card__money">{tx.valueFmt}</div>
          </div>
          <div className="card__sub" style={{display:"flex", alignItems:"center", flexWrap:"wrap", gap:4}}>
            <span>{tx.suburbOnly || tx.suburb || "—"}</span>
            {tx.state && <><span className="dot"/><span>{tx.state}</span></>}
            {tx.strategy && tx.strategy !== "—" && <><span className="dot"/><span className="chip chip--strategy" style={{fontSize:10, padding:"1px 6px"}}>{tx.strategy}</span></>}
            {tx.vendor && <><span className="dot"/><span style={{color:"var(--ink-3)", fontSize:11}}>{tx.vendor}{tx.purchaser ? " → " + tx.purchaser : ""}</span></>}
          </div>
          <div className="card__stats">
              <div className="card__stat">
                <div className="card__stat__l">Initial Yield</div>
                <div className="card__stat__v">{tx.yield}</div>
              </div>
              <div className="card__stat">
                <div className="card__stat__l">Market Yield</div>
                <div className="card__stat__v">{tx.marketYield || "—"}</div>
              </div>
              <div className="card__stat">
                <div className="card__stat__l">Cap Value</div>
                <div className="card__stat__v">{tx.capVal}</div>
              </div>
              <div className="card__stat">
                <div className="card__stat__l">NLA</div>
                <div className="card__stat__v">{tx.nla}</div>
              </div>
              <div className="card__stat">
                <div className="card__stat__l">WALE</div>
                <div className="card__stat__v">{tx.wale}</div>
              </div>
          </div>
          <div className="card__chips">
            <SectorChip s={tx.sector}/>
            {tx.subSector && <span className="chip chip--ghost">{tx.subSector}</span>}
            <ConfidenceChip c={tx.confidence}/>
            <span style={{marginLeft:"auto", fontSize:10, color:"var(--ink-4)", fontFamily:"var(--mono)"}}>{tx.saleDateFmt}</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="card" onClick={() => onClick(tx)}>
      <div className="card__head">
        <div style={{flex:1, minWidth:0}}>
          <div className="card__title">{tx.title}</div>
          <div className="card__sub">
            <span>{tx.suburb || "—"}</span>
            {tx.processType && <><span className="dot"/><span>{tx.processType}</span></>}
          </div>
        </div>
      </div>
      <div className="card__meta">
        <SectorChip s={tx.sector}/>
        <ConfidenceChip c={tx.confidence}/>
      </div>
      <div className="card__foot">
        <div>
          <div className="card__val">{tx.valueFmt}<small>{tx.yield !== "—" ? " · " + tx.yield : ""}</small></div>
          <div className="text-sm muted mt-sm">{tx.vendor && <span>{tx.vendor}{tx.purchaser ? " → " + tx.purchaser : ""}</span>}</div>
        </div>
        <div className="text-sm muted">{tx.saleDateFmt}</div>
      </div>
    </div>
  );
};

// ---------- Empty state ----------
const Empty = ({ title, sub, cta, onCta, flags }) => (
  <div className="empty">
    <div className="empty__t">{title}</div>
    {sub && <div className="empty__s">{sub}</div>}
    {cta && flags && flags.emptyCTA && <button className="empty__cta" onClick={onCta}>+ {cta}</button>}
  </div>
);

// ---------- Sparkline ----------
const Sparkline = ({ data, width = 200, height = 32 }) => {
  if(!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => [i * step, height - 4 - ((v - min) / range) * (height - 8)]);
  const linePath = "M" + points.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L");
  const areaPath = linePath + ` L${width},${height} L0,${height} Z`;
  const last = points[points.length - 1];
  return (
    <svg className="kpi__spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path className="area" d={areaPath}/>
      <path className="line" d={linePath}/>
      <circle cx={last[0]} cy={last[1]} r="2.5"/>
    </svg>
  );
};

// ---------- Leo Strip ----------
const LeoStrip = ({ onDismiss }) => {
  const s = window.VT_STATS;
  const overdueTop = window.VT_ACTIONS.find(a => !a.done && a.bucket === "overdue");
  return (
    <div className="leo-strip" role="status">
      <div className="leo-strip__orb"/>
      <div className="leo-strip__body">
        <div className="leo-strip__tag">Leo · morning read</div>
        {s.overdueActions > 0
          ? <><strong>{s.overdueActions}</strong> overdue and <strong>{s.todayActions}</strong> due today — {overdueTop ? <em style={{fontStyle:"normal",color:"inherit"}}>start with "{overdueTop.title}"</em> : "prioritise those first"}. Pipeline holding at <strong>{s.activeDealValueFmt}</strong> across <strong>{s.activeDealCount}</strong> deals.</>
          : <>You're clear on overdue. <strong>{s.todayActions}</strong> due today. Pipeline holding at <strong>{s.activeDealValueFmt}</strong> across <strong>{s.activeDealCount}</strong> deals.{s.overdueContacts > 0 && <> Cadence slipping with <strong>{s.overdueContacts}</strong> contact{s.overdueContacts === 1 ? "" : "s"}.</>}</>
        }
      </div>
      <button className="leo-strip__x" onClick={onDismiss} aria-label="Dismiss">✕</button>
    </div>
  );
};

// ---------- Flow row (pipeline) ----------
const FlowRow = ({ deal, onClick, flags }) => {
  const isDead = deal.phaseK === "dead";
  const pct = isDead ? 1 : Math.max(0.02, deal.progress);
  const daysCls = deal.days > 45 ? "overdue" : deal.days > 30 ? "down" : "";
  const PHASE_LABELS = ["Identified","Initial","Detailed","Bid","DD","Closed"];
  const PHASE_ORDER = ["identified","initial","detailed","bid","dd","closed"];
  const currentIdx = isDead ? -1 : PHASE_ORDER.indexOf(deal.phaseK);
  const sectorTip = deal.strategy ? `${deal.sector} · ${deal.strategy}` : deal.sector;
  return (
    <article className={"flowcard" + (isDead ? " flowcard--dead" : "")} data-sector={deal.sector} onClick={() => onClick(deal)}>
      <span className="flowcard__edge"/>
      <div className="flowcard__body">
        <header className="flowcard__head">
          <div className="flowcard__title-block">
            <h3 className="flowcard__title">{deal.title}</h3>
            <div className="flowcard__sub">
              <span>{deal.suburb}</span>
              <span className="dot"/>
              <span>{deal.sector}</span>
              {deal.strategy ? <><span className="dot"/><span>{deal.strategy}</span></> : null}
            </div>
          </div>
          <div className="flowcard__value">
            <div className="flowcard__money">{deal.valueFmt}</div>
            {deal.yieldFmt ? <div className="flowcard__yield">{deal.yieldFmt} yield</div> : null}
          </div>
        </header>

        <div className="flowcard__chips">
          {flags && flags.statusDots ? (
            <span className={"status-dot status-dot--" + deal.health} data-tip={deal.healthLabel}/>
          ) : null}
          <span className={"chip " + window.VT_CLS.sector(deal.sector)} data-tip={sectorTip}>{deal.sector}</span>
          <span className={"chip " + (isDead ? "chip--dead" : "chip--phase")}>{deal.phase}</span>
          {!isDead ? (
            <span className={"chip chip--days " + daysCls} data-tip={deal.days > 30 ? "Stale — may need a nudge" : "Healthy cadence"}>
              {deal.days}d in phase
            </span>
          ) : null}
          {!isDead ? <span className="flowcard__progress-pct">{Math.round(pct * 100)}%</span> : null}
        </div>

        <div className="flowcard__track">
          <div className="flowcard__bar">
            <div className="flowcard__bar-bg"/>
            <div className={"flowcard__bar-fill" + (isDead ? " flowcard__bar-fill--dead" : "")} style={{width: (pct * 100) + "%"}}/>
            {PHASE_LABELS.map((p, i) => {
              const left = (i / (PHASE_LABELS.length - 1)) * 100;
              const done = !isDead && i < currentIdx;
              const cur = !isDead && i === currentIdx;
              return (
                <div key={i} className={"flowcard__node" + (done ? " done" : "") + (cur ? " current" : "") + (isDead ? " dead" : "")} style={{left: left + "%"}} data-tip={p}>
                  <span className="flowcard__node-dot"/>
                </div>
              );
            })}
          </div>
          <div className="flowcard__phase-labels">
            {PHASE_LABELS.map((p, i) => {
              const done = !isDead && i < currentIdx;
              const cur = !isDead && i === currentIdx;
              return (
                <span key={i} className={"flowcard__phase-label" + (done ? " done" : "") + (cur ? " current" : "")}>{p}</span>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
};

// ---------- Command palette ----------
const CommandPalette = ({ open, onClose, onSelect }) => {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if(open){
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const items = useMemo(() => {
    if(!open) return [];
    const all = [];
    (window.VT_DEALS || []).forEach(d => all.push({ kind: "deal", id: d.id, title: d.title, sub: d.suburb + " · " + d.valueFmt, record: d }));
    (window.VT_TRANSACTIONS || []).forEach(d => all.push({ kind: "tx", id: d.id, title: d.title, sub: d.suburb + " · " + d.valueFmt, record: d }));
    (window.VT_CONTACTS || []).forEach(c => all.push({ kind: "contact", id: c.id, title: c.name, sub: c.firm + " · " + c.role, record: c }));
    (window.VT_INTEL || []).forEach(i => all.push({ kind: "intel", id: i.id, title: i.title, sub: i.category + " · " + i.dateFmt, record: i }));
    (window.VT_ACTIONS || []).filter(a => !a.done).forEach(a => all.push({ kind: "action", id: a.id, title: a.title, sub: a.ctx + " · " + a.dueFmt, record: a }));
    // nav jumps
    all.push({ kind: "nav", id:"n-dashboard", title:"Go to Dashboard", sub:"g d", target:"dashboard" });
    all.push({ kind: "nav", id:"n-actions", title:"Go to Actions", sub:"g a", target:"actions" });
    all.push({ kind: "nav", id:"n-crm", title:"Go to CRM", sub:"g c", target:"crm" });
    all.push({ kind: "nav", id:"n-pipeline", title:"Go to Pipeline", sub:"g p", target:"pipeline" });
    all.push({ kind: "nav", id:"n-deals", title:"Go to Deal Cards", sub:"g t", target:"deals" });
    all.push({ kind: "nav", id:"n-intel", title:"Go to Market Intel", sub:"g i", target:"intel" });
    all.push({ kind: "nav", id:"n-strategy", title:"Go to Strategy", sub:"g s", target:"strategy" });
    all.push({ kind: "cmd", id:"c-capture", title:"Quick Capture", sub:"c", target:"capture" });
    all.push({ kind: "cmd", id:"c-briefing", title:"Morning Briefing", sub:"b", target:"briefing" });
    all.push({ kind: "cmd", id:"c-eod", title:"End of Day", sub:"e", target:"eod" });
    if(!q) return all.slice(0, 40);
    const v = q.toLowerCase();
    const scored = all
      .map(it => {
        const hay = (it.title + " " + (it.sub || "")).toLowerCase();
        const pos = hay.indexOf(v);
        return pos === -1 ? null : { ...it, score: pos === 0 ? 0 : (hay.startsWith(v) ? 1 : pos + 10) };
      })
      .filter(Boolean)
      .sort((a,b) => a.score - b.score);
    return scored.slice(0, 40);
  }, [q, open]);

  useEffect(() => { if(active >= items.length) setActive(0); }, [items.length, active]);

  useEffect(() => {
    if(!open) return;
    const onKey = (e) => {
      if(e.key === "Escape"){ onClose(); }
      else if(e.key === "ArrowDown"){ e.preventDefault(); setActive(a => Math.min(items.length - 1, a + 1)); }
      else if(e.key === "ArrowUp"){ e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
      else if(e.key === "Enter"){ e.preventDefault(); const it = items[active]; if(it) onSelect(it); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items, active, onSelect, onClose]);

  // scroll active into view
  useEffect(() => {
    if(!open || !listRef.current) return;
    const el = listRef.current.querySelector(".ck__item.active");
    if(el) el.scrollIntoView({ block:"nearest" });
  }, [active, open]);

  if(!open) return null;

  const groups = items.reduce((acc, it) => {
    const k = it.kind;
    if(!acc[k]) acc[k] = [];
    acc[k].push(it);
    return acc;
  }, {});
  const GROUP_ORDER = ["nav","cmd","deal","tx","contact","intel","action"];
  const GROUP_LABELS = { nav:"Navigate", cmd:"Actions", deal:"Active deals", tx:"Deal cards", contact:"Contacts", intel:"Intel", action:"Tasks" };
  const KIND_LABELS = { deal:"Deal", tx:"Deal", contact:"Contact", intel:"Intel", action:"Task", nav:"Go", cmd:"Cmd" };

  let runningIdx = -1;

  return (
    <div className="ck-backdrop" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="ck" role="dialog" aria-modal="true">
        <div className="ck__input">
          <span className="ck__icon">⌕</span>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Search deals, contacts, intel, or type a command…"/>
          <span className="ck__esc">esc</span>
        </div>
        <div className="ck__list" ref={listRef}>
          {items.length === 0 && <div className="ck__empty">No matches. Try a different term.</div>}
          {GROUP_ORDER.map(g => groups[g] && groups[g].length > 0 && (
            <div key={g}>
              <div className="ck__group">{GROUP_LABELS[g]}</div>
              {groups[g].map(it => {
                runningIdx++;
                const idx = items.indexOf(it);
                return (
                  <div
                    key={it.id}
                    className={"ck__item" + (idx === active ? " active" : "")}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => onSelect(it)}
                  >
                    <span className="ck__kind">{KIND_LABELS[it.kind] || it.kind}</span>
                    <div style={{flex:1, minWidth:0}}>
                      <div className="trunc">{it.title}</div>
                    </div>
                    <span className="ck__item__sub">{it.sub}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="ck__foot">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
          <span style={{marginLeft:"auto"}}>⌘K to reopen</span>
        </div>
      </div>
    </div>
  );
};

// ---------- Print tear-sheet ----------
const Tearsheet = ({ deal, onClose }) => {
  if(!deal) return null;
  const d = deal;
  return (
    <div className="print-root active">
      <div className="print-root__close">
        <button className="btn" onClick={() => window.print()}>Print / Save PDF</button>
        <button className="btn btn--primary" onClick={onClose}>Close</button>
      </div>
      <div className="tearsheet">
        <div className="tearsheet__head">
          <div className="tearsheet__brand">
            <div className="mark">V</div>
            <div>
              <div style={{fontWeight:600,fontSize:14,letterSpacing:"-0.01em"}}>Vantage</div>
              <div className="tearsheet__brand__meta">PKA Deal Summary</div>
            </div>
          </div>
          <div className="tearsheet__ref">REF · {String(d.id).slice(0, 8).toUpperCase()}<br/>{new Date().toLocaleDateString("en-AU",{day:"numeric",month:"long",year:"numeric"})}</div>
        </div>

        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:8}}>
          <SectorChip s={d.sector}/>
          {d.phase && <PhaseChip p={d.phase}/>}
          <ConfidenceChip c={d.confidence}/>
        </div>
        <h1>{d.title}</h1>
        <div className="tearsheet__sub">{d.suburb}{d.processType ? " · " + d.processType : ""}</div>

        <div className="tearsheet__money">
          <div>
            <div style={{fontSize:10,color:"var(--ink-4)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:3}}>Headline</div>
            <div className="tearsheet__money__v">{d.valueFmt}</div>
          </div>
          {d.yield !== "—" && (
            <div>
              <div style={{fontSize:10,color:"var(--ink-4)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:3}}>Yield</div>
              <div className="tearsheet__money__s" style={{fontSize:18,color:"var(--ink)"}}>{d.yield}</div>
            </div>
          )}
          {d.wale !== "—" && (
            <div>
              <div style={{fontSize:10,color:"var(--ink-4)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:3}}>WALE</div>
              <div className="tearsheet__money__s" style={{fontSize:18,color:"var(--ink)"}}>{d.wale}</div>
            </div>
          )}
          {d.nla !== "—" && (
            <div>
              <div style={{fontSize:10,color:"var(--ink-4)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:3}}>NLA</div>
              <div className="tearsheet__money__s" style={{fontSize:18,color:"var(--ink)"}}>{d.nla}</div>
            </div>
          )}
        </div>

        <div className="tearsheet__grid">
          <div className="kv"><div className="kv__l">Vendor</div><div className="kv__v">{d.vendor || "—"}</div></div>
          <div className="kv"><div className="kv__l">Purchaser</div><div className="kv__v">{d.purchaser || "—"}</div></div>
          <div className="kv"><div className="kv__l">Agent</div><div className="kv__v">{d.agent || "—"}</div></div>
          <div className="kv"><div className="kv__l">Strategy</div><div className="kv__v">{d.strategy || d.processType || "—"}</div></div>
          <div className="kv"><div className="kv__l">Date</div><div className="kv__v">{d.saleDateFmt || d.dateLabel}</div></div>
          <div className="kv"><div className="kv__l">Conviction</div><div className="kv__v">{d.conviction || "—"}</div></div>
        </div>

        {d.notes && <>
          <h3>Notes</h3>
          <div className="tearsheet__notes">{d.notes}</div>
        </>}

        <div className="tearsheet__foot">
          <span>Confidential · prepared by PKA</span>
          <span>R. Maydom · {new Date().toLocaleDateString("en-AU")}</span>
        </div>
      </div>
    </div>
  );
};
const KPI = ({ label, value, sub, accent, sparkline, onClick }) => (
  <div
    className={"kpi" + (accent ? " kpi--accent" : "") + (sparkline ? " kpi--sparkline" : "") + (onClick ? " kpi--clickable" : "")}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); onClick(); }}) : undefined}
  >
    <div className="kpi__lbl">{label}</div>
    <div className="kpi__val">{value}</div>
    {sub && <div className="kpi__sub">{sub}</div>}
    {sparkline && <Sparkline data={sparkline}/>}
    {onClick && <Icon name="chevR" size={14}/>}
  </div>
);

// ---------- EditableField (inline-edit with category label) ----------
const EditableField = ({ label, value, options, type, onSave, multiline }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const ref = useRef(null);
  useEffect(() => { setVal(value); }, [value]);
  useEffect(() => { if(editing && ref.current) ref.current.focus(); }, [editing]);
  const save = (v) => {
    setVal(v);
    setEditing(false);
    if(onSave) onSave(v);
  };
  const cancel = () => { setVal(value); setEditing(false); };
  const isSelect = Array.isArray(options) && options.length > 0;
  const isDate = type === "date";
  return (
    <div className={"efield" + (editing ? " efield--editing" : "") + (multiline ? " efield--multi" : "") + (label ? "" : " efield--nolabel")}>
      {label && <label className="efield__label">{label}</label>}
      {!editing ? (
        <button className="efield__value" onClick={() => setEditing(true)} title="Click to edit">
          <span className="efield__text">{val || "—"}</span>
          <Icon name="pencil" size={11}/>
        </button>
      ) : isSelect ? (
        <select
          ref={ref}
          className="efield__select"
          defaultValue={val}
          onBlur={(e) => save(e.target.value)}
          onKeyDown={(e) => { if(e.key === "Escape") cancel(); else if(e.key === "Enter") save(e.target.value); }}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : multiline ? (
        <textarea
          ref={ref}
          className="efield__textarea"
          defaultValue={val}
          rows={4}
          onBlur={(e) => save(e.target.value)}
          onKeyDown={(e) => { if(e.key === "Escape") cancel(); else if(e.key === "Enter" && (e.metaKey || e.ctrlKey)) save(e.target.value); }}
        />
      ) : (
        <input
          ref={ref}
          type={isDate ? "date" : "text"}
          className="efield__input"
          defaultValue={val}
          onBlur={(e) => save(e.target.value)}
          onKeyDown={(e) => { if(e.key === "Escape") cancel(); else if(e.key === "Enter") save(e.target.value); }}
        />
      )}
    </div>
  );
};

// ---------- Drawer ----------
const Drawer = ({ open, title, subtitle, children, onClose, footer }) => {
  useEffect(() => {
    if(!open) return;
    const onKey = e => { if(e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if(!open) return null;
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}/>
      <div className="drawer" role="dialog" aria-modal="true">
        <div className="drawer__head">
          <div className="drawer__title">{title}{subtitle && <small>{subtitle}</small>}</div>
          <button className="drawer__x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="drawer__body">{children}</div>
        {footer && <div className="drawer__foot">{footer}</div>}
      </div>
    </>
  );
};

// ---------- KV grid ----------
const KVGrid = ({ items }) => (
  <div className="kv-grid">
    {items.map((it, i) => (
      <div key={i} className="kv">
        <div className="kv__l">{it.l}</div>
        <div className={"kv__v" + (it.mono ? " mono" : "") + (!it.v || it.v === "—" ? " muted" : "")}>{it.v || "—"}</div>
      </div>
    ))}
  </div>
);

// ---------- Modal ----------
const Modal = ({ open, title, subtitle, children, onClose, footer }) => {
  useEffect(() => {
    if(!open) return;
    const onKey = e => { if(e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if(!open) return null;
  return (
    <div className="modal-backdrop" onClick={e => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal__head">
          <div style={{flex:1}}>
            <div className="modal__title">{title}</div>
            {subtitle && <div className="modal__sub">{subtitle}</div>}
          </div>
          <button className="modal__x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  );
};

// ---------- Toast ----------
const Toast = ({ msg }) => msg ? <div className="toast">{msg}</div> : null;

// ---------- Tweaks ----------
const Toggle = ({ on, onChange }) => (
  <button className="toggle" aria-pressed={on} onClick={() => onChange(!on)}/>
);
const TwRow = ({ label, hint, on, onChange }) => (
  <div className="tweaks__row tweaks__row--toggle">
    <div style={{flex:1}}>
      <div className="tweaks__l">{label}</div>
      {hint && <div className="tweaks__lh">{hint}</div>}
    </div>
    <Toggle on={on} onChange={onChange}/>
  </div>
);

const Tweaks = ({ open, onClose, state, set }) => (
  <div className={"tweaks" + (open ? " open" : "")}>
    <div className="tweaks__head">
      <h3>Tweaks</h3>
      <button className="tweaks__x" onClick={onClose}>✕</button>
    </div>

    <div className="tweaks__row">
      <div className="tweaks__l">Theme</div>
      <div className="seg">
        <button aria-pressed={state.theme === "light"} onClick={() => set("theme","light")}>Light</button>
        <button aria-pressed={state.theme === "dark"} onClick={() => set("theme","dark")}>Dark</button>
      </div>
    </div>
    <div className="tweaks__row">
      <div className="tweaks__l">Density</div>
      <div className="seg">
        <button aria-pressed={state.density === "comfortable"} onClick={() => set("density","comfortable")}>Comfortable</button>
        <button aria-pressed={state.density === "compact"} onClick={() => set("density","compact")}>Compact</button>
      </div>
    </div>

    <div className="tweaks__group">Cards & tables</div>
    <TwRow label="Value-hero deal cards" hint="Money as headline, sector as edge bar" on={state.valueHero} onChange={v => set("valueHero", v)}/>
    <TwRow label="Status dots" hint="Hot / on-track / stalled indicator" on={state.statusDots} onChange={v => set("statusDots", v)}/>
    <TwRow label="Sticky table headers" hint="Keep column labels visible while scrolling" on={state.stickyHeaders} onChange={v => set("stickyHeaders", v)}/>

    <div className="tweaks__group">Interactions</div>
    <TwRow label="Command palette (⌘K)" hint="Global search across everything" on={state.commandK} onChange={v => set("commandK", v)}/>
    <TwRow label="Keyboard shortcuts" hint="g d, g a, /, c, esc" on={state.keyboardNav} onChange={v => set("keyboardNav", v)}/>
    <TwRow label="Empty state CTAs" hint="Buttons in place of dead ends" on={state.emptyCTA} onChange={v => set("emptyCTA", v)}/>

    <div className="tweaks__group">Motion & detail</div>
    <TwRow label="Micro-motion" hint="Stagger grids, animate badges" on={state.microMotion} onChange={v => set("microMotion", v)}/>
    <TwRow label="Absolute-time tooltips" hint="Hover a relative date for the full timestamp" on={state.relTime} onChange={v => set("relTime", v)}/>

    <div className="tweaks__group">Dashboard & pipeline</div>
    <TwRow label="Leo strip" hint="Persistent AI summary above dashboard" on={state.leoStrip} onChange={v => set("leoStrip", v)}/>
    <TwRow label="Sparkline on pipeline KPI" hint="12-week trend" on={state.sparkline} onChange={v => set("sparkline", v)}/>
    <TwRow label="Pipeline flow view" hint="Per-deal bar with days-in-phase" on={state.pipelineFlow} onChange={v => set("pipelineFlow", v)}/>

    <div className="tweaks__group">Export</div>
    <TwRow label="Deal tear-sheet print" hint="Open → Print button in deal drawer" on={state.printView} onChange={v => set("printView", v)}/>
  </div>
);

Object.assign(window, {
  Icon, Chip, SectorChip, ConfidenceChip, ImportanceChip, TierChip, PhaseChip,
  SectionHead, Search, Tabs,
  DealCard, TxCard, StatusDot,
  KPI, Drawer, KVGrid, Modal, Toast, Tweaks, EditableField,
  Empty, Sparkline, LeoStrip, FlowRow, CommandPalette, Tearsheet,
});
