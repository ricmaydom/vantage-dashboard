// Screen components — Vantage v4
const { useState, useEffect, useRef, useMemo } = React;

// Phase palette (left stripes + dots)
const PIPE_PHASE_COLOR = {
  identified: "#64748b",
  initial:    "#3b82f6",
  detailed:   "#6366f1",
  bid:        "#f59e0b",
  dd:         "#f97316",
  closed:     "#22c55e",
  dead:       "#9ca3af",
};

// =========================================
// SCREEN: Dashboard
// =========================================
function ScreenDashboard({ setView, openDeal, openTx, toggleAction, flags, setModal, leoDismissed, setLeoDismissed }) {
  const s = window.VT_STATS;
  const deals = (window.VT_DEALS || []).filter(d => d.phaseK !== "dead").slice(0, 4);
  const todayActions = (window.VT_ACTIONS || []).filter(a => !a.done && (a.bucket === "overdue" || a.bucket === "today"));

  return (
    <div className="screen">
      {flags.leoStrip && !leoDismissed && (
        <LeoStrip onDismiss={() => setLeoDismissed(true)}/>
      )}

      <div className="kpi-row">
        <KPI
          label="Active pipeline"
          value={s.activeDealValueFmt}
          sub={s.activeDealCount + (s.activeDealCount === 1 ? " deal" : " deals")}
          accent
          sparkline={flags.sparkline ? window.VT_PIPELINE_HISTORY : null}
          onClick={() => setView("pipeline")}
        />
        <KPI
          label="Open actions"
          value={s.openActions}
          sub={s.overdueActions > 0 ? s.overdueActions + " overdue" : "All clear"}
          onClick={() => setView("actions")}
        />
        <KPI
          label="CRM"
          value={s.contactCount}
          sub={s.overdueContacts > 0 ? s.overdueContacts + " need contact" : "Cadence on track"}
          onClick={() => setView("crm")}
        />
        <KPI
          label="Deal cards"
          value={s.transactionCount}
          sub={s.transactionValueFmt + " tracked"}
          onClick={() => setView("deals")}
        />
      </div>

      {deals.length > 0 && (
        <section className="mt">
          <SectionHead
            title="Active pipeline"
            count={s.activeDealCount}
            subtitle={s.activeDealValueFmt}
            subtitleBelow
          >
            <button className="btn" onClick={() => setView("pipeline")}>View all</button>
          </SectionHead>
          <div className="cards">
            {deals.map(d => <DealCard key={d.id} deal={d} onClick={openDeal} flags={flags}/>)}
          </div>
        </section>
      )}

      <section className="mt">
        <SectionHead title="Today's focus" count={todayActions.length}>
          <button className="btn" onClick={() => setView("actions")}>All actions</button>
        </SectionHead>
        {todayActions.length === 0 ? (
          <Empty title="All clear" sub="Nothing overdue or due today" flags={flags}/>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {todayActions.slice(0, 8).map(a => (
                  <tr key={a.id} className={a.bucket === "overdue" ? "row--overdue" : ""}>
                    <td style={{width: 28}}>
                      <input
                        type="checkbox"
                        checked={!!a.done}
                        onChange={() => toggleAction(a.id)}
                        style={{cursor: "pointer"}}
                      />
                    </td>
                    <td
                      className={a.done ? "muted" : "strong"}
                      style={{textDecoration: a.done ? "line-through" : undefined}}
                    >
                      {a.title}
                    </td>
                    <td className="muted text-sm">{a.ctx}</td>
                    <td style={{width: 80}}><ImportanceChip i={a.importance}/></td>
                    <td
                      className={"mono num text-sm" + (a.bucket === "overdue" ? " text--overdue" : "")}
                      style={{textAlign: "right", width: 90}}
                    >
                      {a.dueFmt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {s.intelCount > 0 && (
        <section className="mt">
          <SectionHead title="Recent intel" count={s.intelCount}>
            <button className="btn" onClick={() => setView("intel")}>View all</button>
          </SectionHead>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {(window.VT_INTEL || []).slice(0, 4).map(i => (
                  <tr key={i.id}>
                    <td style={{minWidth: 280}}>
                      <div style={{fontWeight: 600}}>{i.title}</div>
                    </td>
                    <td><span className="chip chip--ghost">{i.category}</span></td>
                    <td><ConfidenceChip c={i.confidence}/></td>
                    <td className="mono num text-sm" style={{textAlign: "right"}}>{i.dateFmt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

// =========================================
// SCREEN: Actions
// =========================================
function ScreenActions({ toggleAction, openAction, updateAction, flags }) {
  const [filter, setFilter] = useState("open");

  const all = window.VT_ACTIONS || [];

  const counts = useMemo(() => ({
    open:    all.filter(a => !a.done).length,
    overdue: all.filter(a => !a.done && a.bucket === "overdue").length,
    today:   all.filter(a => !a.done && a.bucket === "today").length,
    done:    all.filter(a => a.done).length,
  }), [all]);

  const filtered = useMemo(() => {
    if (filter === "open")    return all.filter(a => !a.done);
    if (filter === "overdue") return all.filter(a => !a.done && a.bucket === "overdue");
    if (filter === "today")   return all.filter(a => !a.done && a.bucket === "today");
    if (filter === "done")    return all.filter(a => a.done);
    return all;
  }, [filter, all]);

  return (
    <div className="screen">
      <div className="toolbar">
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            { v: "open",    l: "Open",    c: counts.open },
            { v: "overdue", l: "Overdue", c: counts.overdue },
            { v: "today",   l: "Today",   c: counts.today },
            { v: "done",    l: "Done",    c: counts.done },
            { v: "all",     l: "All",     c: all.length },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <Empty
          title="No tasks here"
          sub={filter === "done" ? "Nothing completed yet" : "Nothing to show"}
          flags={flags}
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{width: 32}}/>
                <th>Task</th>
                <th>Source</th>
                <th style={{width: 90}}>Importance</th>
                <th style={{width: 110, textAlign: "right"}}>Due</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr
                  key={a.id}
                  className={a.done ? "row--done" : a.bucket === "overdue" ? "row--overdue" : ""}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={!!a.done}
                      onChange={() => toggleAction(a.id)}
                      style={{cursor: "pointer"}}
                    />
                  </td>
                  <td>
                    <div
                      className={a.done ? "muted" : "strong"}
                      style={{
                        textDecoration: a.done ? "line-through" : undefined,
                        cursor: "pointer",
                      }}
                      onClick={() => openAction(a)}
                    >
                      {a.title}
                    </div>
                    {a.notes && (
                      <div className="muted text-sm" style={{marginTop: 2}}>
                        {a.notes.length > 100 ? a.notes.slice(0, 100) + "…" : a.notes}
                      </div>
                    )}
                  </td>
                  <td className="muted text-sm">{a.ctx}</td>
                  <td><ImportanceChip i={a.importance}/></td>
                  <td
                    className={"mono num text-sm" + (a.bucket === "overdue" ? " text--overdue" : "")}
                    style={{textAlign: "right"}}
                  >
                    {a.dueFmt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =========================================
// SCREEN: CRM
// =========================================
function ScreenCRM({ openContact, flags }) {
  const [q, setQ]               = useState("");
  const [filter, setFilter]     = useState("all");
  const [sortBy, setSortBy]     = useState("name");
  const [sortDir, setSortDir]   = useState(1);

  const all = window.VT_CONTACTS || [];
  const s   = window.VT_STATS;

  const doSort = (col) => {
    if (sortBy === col) setSortDir(d => -d);
    else { setSortBy(col); setSortDir(1); }
  };

  const contacts = useMemo(() => {
    let items = all;
    if (q) {
      const v = q.toLowerCase();
      items = items.filter(c =>
        (c.name + " " + c.firm + " " + c.role).toLowerCase().includes(v)
      );
    }
    if (filter === "tier1")   items = items.filter(c => Number(c.tier) === 1);
    if (filter === "overdue") items = items.filter(c => c.status === "Overdue" || c.status === "Never contacted");
    if (filter === "due")     items = items.filter(c => c.status === "Due soon");

    return [...items].sort((a, b) => {
      let av, bv;
      if (sortBy === "name") { av = a.name; bv = b.name; }
      else if (sortBy === "firm") { av = a.firm; bv = b.firm; }
      else if (sortBy === "tier") { av = Number(a.tier) || 3; bv = Number(b.tier) || 3; }
      else if (sortBy === "last") { av = a.lastContacted || "0"; bv = b.lastContacted || "0"; }
      else { av = a.name; bv = b.name; }
      if (typeof av === "string") return av.localeCompare(bv) * sortDir;
      return (av - bv) * sortDir;
    });
  }, [all, q, filter, sortBy, sortDir]);

  const SortTh = ({ col, children, style }) => (
    <th
      style={{cursor: "pointer", userSelect: "none", ...style}}
      onClick={() => doSort(col)}
    >
      {children}
      {sortBy === col && <span style={{opacity: 0.5, marginLeft: 4}}>{sortDir === 1 ? "↑" : "↓"}</span>}
    </th>
  );

  return (
    <div className="screen">
      <div className="toolbar" style={{display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap"}}>
        <Search value={q} onChange={setQ} placeholder="Search name, firm…"/>
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            { v: "all",     l: "All",      c: s.contactCount },
            { v: "tier1",   l: "Tier 1",   c: s.tier1Count },
            { v: "overdue", l: "Overdue",  c: s.overdueContacts },
            { v: "due",     l: "Due soon", c: s.dueSoonContacts },
          ]}
        />
      </div>

      {contacts.length === 0 ? (
        <Empty title="No contacts match" sub="Try a different search or filter" flags={flags}/>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{width: 36}}/>
                <SortTh col="name">Name</SortTh>
                <SortTh col="firm">Firm</SortTh>
                <th>Role</th>
                <SortTh col="tier" style={{width: 70}}>Tier</SortTh>
                <th style={{width: 100}}>Sector</th>
                <SortTh col="last" style={{width: 120}}>Last contact</SortTh>
                <th style={{width: 110}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id} onClick={() => openContact(c)} style={{cursor: "pointer"}}>
                  <td>
                    <div className="avatar" style={{width: 28, height: 28, fontSize: 11}}>
                      {c.initials}
                    </div>
                  </td>
                  <td className="strong">{c.name}</td>
                  <td className="muted">{c.firm}</td>
                  <td className="muted text-sm">{c.role}</td>
                  <td><TierChip t={c.tier}/></td>
                  <td>
                    {c.sector
                      ? <SectorChip s={c.sector}/>
                      : <span className="muted">—</span>}
                  </td>
                  <td className="mono num text-sm">{c.lastContactedFmt}</td>
                  <td><span className={"chip " + c.statusCls}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =========================================
// SCREEN: Pipeline
// =========================================
function ScreenPipeline({ openDeal, flags }) {
  const [viewMode,    setViewMode]    = useState("flow");
  const [filterPhase, setFilterPhase] = useState("active");

  const phases   = window.VT_PHASES || [];
  const allDeals = window.VT_DEALS  || [];
  const s        = window.VT_STATS;

  const activeDeals = allDeals.filter(d => d.phaseK !== "dead" && d.phaseK !== "closed");
  const closedDeals = allDeals.filter(d => d.phaseK === "closed");
  const deadDeals   = allDeals.filter(d => d.phaseK === "dead");

  const displayDeals = useMemo(() => {
    if (filterPhase === "active")  return activeDeals;
    if (filterPhase === "closed")  return closedDeals;
    if (filterPhase === "dead")    return deadDeals;
    if (filterPhase === "all")     return allDeals;
    return allDeals.filter(d => d.phaseK === filterPhase);
  }, [filterPhase, allDeals]);

  // Pipeline overview subtitle: value breakdown across active phases
  const phaseSummaryParts = phases
    .filter(p => p.k !== "dead" && p.k !== "closed" && p.count > 0)
    .map(p => p.valueFmt + " " + p.label.split(" ")[0]);
  const phaseSummary = phaseSummaryParts.join(" · ");

  return (
    <div className="screen">
      {/* Pipeline overview KPIs */}
      <div className="kpi-row">
        <KPI
          label="Active pipeline"
          value={s.activeDealValueFmt}
          sub={s.activeDealCount + (s.activeDealCount === 1 ? " deal" : " deals")}
          accent
          sparkline={flags.sparkline ? window.VT_PIPELINE_HISTORY : null}
        />
        {phases
          .filter(p => p.k !== "dead" && p.k !== "closed" && p.count > 0)
          .slice(0, 3)
          .map(p => (
            <KPI
              key={p.k}
              label={p.label}
              value={p.valueFmt}
              sub={p.count + (p.count === 1 ? " deal" : " deals")}
            />
          ))}
      </div>

      {/* Toolbar */}
      <div
        className="toolbar"
        style={{marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap"}}
      >
        <Tabs
          value={filterPhase}
          onChange={setFilterPhase}
          items={[
            { v: "active", l: "Active", c: activeDeals.length },
            { v: "all",    l: "All",    c: allDeals.length },
            { v: "closed", l: "Closed", c: closedDeals.length },
            { v: "dead",   l: "Dead",   c: deadDeals.length },
          ]}
        />
        <div style={{marginLeft: "auto", display: "flex", gap: 6}}>
          <button
            className={"btn" + (viewMode === "flow"  ? " btn--primary" : "")}
            onClick={() => setViewMode("flow")}
          >
            Flow
          </button>
          <button
            className={"btn" + (viewMode === "board" ? " btn--primary" : "")}
            onClick={() => setViewMode("board")}
          >
            Board
          </button>
        </div>
      </div>

      {displayDeals.length === 0 ? (
        <Empty title="No deals" sub="No deals match the current filter" flags={flags}/>
      ) : viewMode === "flow" ? (
        /* Flow view — per-deal progress bar */
        <div style={{marginTop: 12, display: "flex", flexDirection: "column", gap: 10}}>
          {displayDeals.map(d => <FlowRow key={d.id} deal={d} onClick={openDeal} flags={flags}/>)}
        </div>
      ) : (
        /* Board view — kanban columns by phase */
        <div style={{marginTop: 12, overflowX: "auto"}}>
          <div style={{display: "flex", gap: 16, minWidth: "max-content", alignItems: "flex-start"}}>
            {phases
              .filter(p => {
                const phaseDeals = displayDeals.filter(d => d.phaseK === p.k);
                return phaseDeals.length > 0
                  || (filterPhase === "active" && p.k !== "dead" && p.k !== "closed");
              })
              .map(p => {
                const phaseDeals = displayDeals.filter(d => d.phaseK === p.k);
                const color = PIPE_PHASE_COLOR[p.k] || "#64748b";
                return (
                  <div key={p.k} style={{minWidth: 260, maxWidth: 280, flexShrink: 0}}>
                    <div style={{
                      borderTop: "3px solid " + color,
                      paddingTop: 8,
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                    }}>
                      <div style={{fontWeight: 600, fontSize: 13}}>{p.label}</div>
                      <div style={{
                        fontSize: 11,
                        color: "var(--ink-4)",
                        fontFamily: "var(--mono)",
                        marginLeft: "auto",
                      }}>
                        {p.valueFmt}
                      </div>
                    </div>
                    <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                      {phaseDeals.map(d => (
                        <DealCard key={d.id} deal={d} onClick={openDeal} flags={flags}/>
                      ))}
                      {phaseDeals.length === 0 && (
                        <div className="muted text-sm" style={{padding: "12px 4px"}}>No deals</div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================
// SCREEN: Deal Cards (Transactions)
// =========================================
function ScreenDeals({ openTx, flags }) {
  const [sortBy,       setSortBy]       = useState("date");
  const [filterSector, setFilterSector] = useState("all");

  const all = window.VT_TRANSACTIONS || [];

  const sectors = useMemo(
    () => ["all", ...new Set(all.map(t => t.sector).filter(Boolean))],
    [all]
  );

  const deals = useMemo(() => {
    let items = all;
    if (filterSector !== "all") items = items.filter(t => t.sector === filterSector);
    return [...items].sort((a, b) => {
      if (sortBy === "value")  return b.value - a.value;
      if (sortBy === "date")   return new Date(b.saleDate || 0) - new Date(a.saleDate || 0);
      if (sortBy === "yield")  return (Number(b.yieldRaw) || 0) - (Number(a.yieldRaw) || 0);
      if (sortBy === "capval") return (b.capValRaw || 0) - (a.capValRaw || 0);
      return 0;
    });
  }, [all, sortBy, filterSector]);

  return (
    <div className="screen">
      <div
        className="toolbar"
        style={{display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap"}}
      >
        <div className="tabs">
          {sectors.map(sec => (
            <button
              key={sec}
              className={"tab" + (filterSector === sec ? " active" : "")}
              onClick={() => setFilterSector(sec)}
            >
              {sec === "all" ? "All" : sec}
            </button>
          ))}
        </div>
        <div style={{marginLeft: "auto", display: "flex", gap: 6, alignItems: "center"}}>
          <span className="muted text-sm">Sort:</span>
          {[["date","Date"],["value","Value"],["yield","Yield"],["capval","$/sqm"]].map(([v, l]) => (
            <button
              key={v}
              className={"btn" + (sortBy === v ? " btn--primary" : "")}
              onClick={() => setSortBy(v)}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {deals.length === 0 ? (
        <Empty title="No deal cards" sub="No transactions match the current filter" flags={flags}/>
      ) : (
        <div className="cards">
          {deals.map(t => <TxCard key={t.id} tx={t} onClick={openTx} flags={flags}/>)}
        </div>
      )}
    </div>
  );
}

// =========================================
// SCREEN: Leasing
// =========================================
function ScreenLeasing({ leases, openLease, addLease, removeLease, flags }) {
  const STATUS_ORDER = ["Inquiry","Tour","Negotiating","LOI","Heads of Agreement","Executed","Lost"];

  const sorted = useMemo(
    () => [...leases].sort((a, b) => {
      const ai = STATUS_ORDER.indexOf(a.status || "Inquiry");
      const bi = STATUS_ORDER.indexOf(b.status || "Inquiry");
      return ai - bi;
    }),
    [leases]
  );

  return (
    <div className="screen">
      <div
        className="toolbar"
        style={{display: "flex", justifyContent: "flex-end", gap: 8}}
      >
        <button className="btn btn--primary" onClick={addLease}>
          <Icon name="plus" size={13}/> New leasing
        </button>
      </div>

      {sorted.length === 0 ? (
        <Empty
          title="No leasing cards"
          sub="Track tenant negotiations, leasing deals and heads of agreement here"
          cta="New leasing card"
          onCta={addLease}
          flags={flags}
        />
      ) : (
        <div className="cards">
          {sorted.map(l => (
            <div key={l.id} className="card" onClick={() => openLease(l)} style={{cursor: "pointer"}}>
              <div className="card__head">
                <div style={{flex: 1, minWidth: 0}}>
                  <div className="card__title">{l.title || "Untitled leasing"}</div>
                  <div className="card__sub">
                    <span>{l.tenant && l.tenant !== "—" ? l.tenant : "No tenant"}</span>
                    {l.landlord && l.landlord !== "—" && (
                      <><span className="dot"/><span>{l.landlord}</span></>
                    )}
                  </div>
                </div>
              </div>
              <div className="card__meta">
                {l.sector && <SectorChip s={l.sector}/>}
                {l.status && <span className="chip chip--phase">{l.status}</span>}
              </div>
              <div className="card__foot">
                <div>
                  {l.rent && l.rent !== "—" && (
                    <div className="card__val">{l.rent}<small>/sqm</small></div>
                  )}
                  {l.area && l.area !== "—" && (
                    <div className="text-sm muted mt-sm">{l.area} sqm</div>
                  )}
                </div>
                {l.term && l.term !== "—" && (
                  <div className="text-sm muted">{l.term} yr term</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =========================================
// SCREEN: Market Intel
// =========================================
function ScreenIntel({ openIntel, flags }) {
  const [filter, setFilter] = useState("all");
  const [q, setQ]           = useState("");

  const all = window.VT_INTEL || [];

  const categories = useMemo(
    () => [...new Set(all.map(i => i.category).filter(Boolean))],
    [all]
  );

  const items = useMemo(() => {
    let res = all;
    if (filter !== "all") res = res.filter(i => i.category === filter);
    if (q) {
      const v = q.toLowerCase();
      res = res.filter(i =>
        (i.title + " " + i.body + " " + (i.source || "")).toLowerCase().includes(v)
      );
    }
    return res;
  }, [all, filter, q]);

  return (
    <div className="screen">
      <div
        className="toolbar"
        style={{display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap"}}
      >
        <Search value={q} onChange={setQ} placeholder="Search intel…"/>
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            { v: "all", l: "All", c: all.length },
            ...categories.map(c => ({
              v: c,
              l: c,
              c: all.filter(i => i.category === c).length,
            })),
          ]}
        />
      </div>

      {items.length === 0 ? (
        <Empty title="No intel" sub="No records match the current filter" flags={flags}/>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{minWidth: 340}}>Headline</th>
                <th style={{width: 120}}>Type</th>
                <th style={{width: 110}}>Confidence</th>
                <th style={{width: 90}}>Sector</th>
                <th style={{width: 80, textAlign: "right"}}>Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} onClick={() => openIntel(i)} style={{cursor: "pointer"}}>
                  <td>
                    <div style={{fontWeight: 600, lineHeight: 1.4}}>{i.title}</div>
                    {i.body && (
                      <div className="muted text-sm" style={{marginTop: 2, lineHeight: 1.5}}>
                        {i.body.length > 130 ? i.body.slice(0, 130) + "…" : i.body}
                      </div>
                    )}
                    {i.source && (
                      <div className="muted text-sm" style={{marginTop: 4}}>
                        <Icon name="granola" size={11}/> {i.source}
                      </div>
                    )}
                  </td>
                  <td><span className="chip chip--ghost">{i.category}</span></td>
                  <td><ConfidenceChip c={i.confidence}/></td>
                  <td>
                    {i.sector ? <SectorChip s={i.sector}/> : <span className="muted">—</span>}
                  </td>
                  <td className="mono num text-sm" style={{textAlign: "right"}}>{i.dateFmt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =========================================
// SCREEN: Strategy & Ideas
// =========================================
function ScreenStrategy({ openStrategy, flags }) {
  const [filter, setFilter] = useState("all");

  const all    = window.VT_STRATEGY || [];
  const themes = ["Mandate","Thesis","Process","Pipeline","Capital","Research","Other"];

  const items = useMemo(() => {
    if (filter === "all") return all;
    return all.filter(s => s.theme === filter);
  }, [all, filter]);

  const STATUS_CLS = {
    "Raw Idea":  "chip--rumoured",
    "Developing":"chip--reported",
    "Validated": "chip--low",
    "Shelved":   "chip--medium",
  };

  return (
    <div className="screen">
      <div className="toolbar">
        <Tabs
          value={filter}
          onChange={setFilter}
          items={[
            { v: "all", l: "All", c: all.length },
            ...themes
              .filter(t => all.some(s => s.theme === t))
              .map(t => ({
                v: t,
                l: t,
                c: all.filter(s => s.theme === t).length,
              })),
          ]}
        />
      </div>

      {items.length === 0 ? (
        <Empty title="No ideas" sub="Try a different theme filter" flags={flags}/>
      ) : (
        <div className="cards">
          {items.map(s => (
            <div
              key={s.id}
              className="card"
              onClick={() => openStrategy(s)}
              style={{cursor: "pointer"}}
            >
              <div className="card__head">
                <div style={{flex: 1, minWidth: 0}}>
                  <div className="card__title">{s.title}</div>
                  <div className="card__sub">
                    <span>{s.theme}</span>
                    {s.sector && <><span className="dot"/><span>{s.sector}</span></>}
                  </div>
                </div>
              </div>
              {s.body && (
                <div className="card__notes">
                  {s.body.length > 180 ? s.body.slice(0, 180) + "…" : s.body}
                </div>
              )}
              <div className="card__chips">
                <span className={"chip " + (STATUS_CLS[s.status] || "chip--ghost")}>
                  {s.status}
                </span>
                <ImportanceChip i={s.importance}/>
                <span style={{marginLeft: "auto"}} className="muted text-sm mono">
                  {s.dateFmt}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =========================================
// Expose all screens on window so app.jsx
// can reference them as globals in JSX
// =========================================
Object.assign(window, {
  ScreenDashboard,
  ScreenActions,
  ScreenCRM,
  ScreenPipeline,
  ScreenDeals,
  ScreenLeasing,
  ScreenIntel,
  ScreenStrategy,
});
