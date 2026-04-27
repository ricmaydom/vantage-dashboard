// Screen modules
const { useState: useStateS, useMemo: useMemoS, useCallback: useCallbackS } = React;

// Generic sort helper for tables. Usage:
//   const { rows, sortProps } = useSort(data, "date", "desc");
//   <SortTH {...sortProps("date")}>Date</SortTH>
function useSort(rows, initialKey = null, initialDir = "desc"){
  const [sort, setSort] = useStateS({ key: initialKey, dir: initialDir });
  const sorted = useMemoS(() => {
    if(!sort.key) return rows;
    const mul = sort.dir === "asc" ? 1 : -1;
    const out = rows.slice();
    out.sort((a,b) => {
      let av = a[sort.key], bv = b[sort.key];
      if(av == null && bv == null) return 0;
      if(av == null) return 1;
      if(bv == null) return -1;
      // date-like strings
      const ad = typeof av === "string" && /^\d{4}-\d{2}-\d{2}/.test(av) ? new Date(av).getTime() : null;
      const bd = typeof bv === "string" && /^\d{4}-\d{2}-\d{2}/.test(bv) ? new Date(bv).getTime() : null;
      if(ad != null && bd != null) return (ad - bd) * mul;
      if(typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
      return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: "base" }) * mul;
    });
    return out;
  }, [rows, sort]);
  const sortProps = (key) => ({
    onClick: () => setSort(s => s.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : { key: null, dir: "desc" }) : { key, dir: "asc" }),
    "data-dir": sort.key === key ? sort.dir : undefined,
    className: "sortable",
  });
  return { rows: sorted, sortProps, sort };
}

// ================== DASHBOARD ==================
const ScreenDashboard = ({ setView, openDeal, openTx, openAction, toggleAction, flags, setModal, leoDismissed, setLeoDismissed }) => {
  const stats = window.VT_STATS;
  const actions = window.VT_ACTIONS.filter(a => !a.done).slice(0, 6);
  const activeDeals = window.VT_DEALS.slice(0, 6);
  const recentIntel = window.VT_INTEL.slice().sort((a,b) => (new Date(b.date) - new Date(a.date))).slice(0, 4);
  const overdueContacts = window.VT_CONTACTS.filter(c => c.status === "Overdue").slice(0, 5);
  const tableCls = "table" + (flags.stickyHeaders ? " table--sticky" : "");

  // Apply pipeline phase overrides (same localStorage key as ScreenPipeline) for accurate KPIs
  const pipelineStats = useMemoS(() => {
    let overrides = {};
    try { overrides = JSON.parse(localStorage.getItem("vt_phase_overrides") || "{}"); } catch(e) {}
    const resolvePhase = d => overrides[d.id] || d.phaseK;
    const activeDeals = window.VT_DEALS.filter(d => resolvePhase(d) !== "dead" && resolvePhase(d) !== "closed");
    const closedDeals = window.VT_DEALS.filter(d => resolvePhase(d) === "closed");
    return {
      activeCount: activeDeals.length,
      activeValue: VT_FMT.AUD(activeDeals.reduce((a, d) => a + (d.value || 0), 0)),
      closedCount: closedDeals.length,
      closedValue: VT_FMT.AUD(closedDeals.reduce((a, d) => a + (d.value || 0), 0)),
    };
  }, []);

  return (
    <div>
      {flags.leoStrip && !leoDismissed && <LeoStrip onDismiss={() => setLeoDismissed(true)}/>}

      <div className="kpis">
        <KPI accent label="Active pipeline" value={pipelineStats.activeValue} sub={`${pipelineStats.activeCount} deal${pipelineStats.activeCount === 1 ? "" : "s"} in flow`} sparkline={flags.sparkline ? window.VT_PIPELINE_HISTORY : null} onClick={() => setView("pipeline")}/>
        <KPI label="Open actions" value={stats.openActions} sub={
          <>{stats.overdueActions > 0 && <span className="down">{stats.overdueActions} overdue · </span>}{stats.todayActions} due today</>
        } onClick={() => setView("actions")}/>
        <KPI label="Contact network" value={stats.contactCount} sub={
          <>{stats.overdueContacts > 0 && <span className="down">{stats.overdueContacts} overdue</span>}{stats.overdueContacts === 0 && <span className="up">All cadences on track</span>}</>
        } onClick={() => setView("crm")}/>
        <KPI label="Closed pipeline" value={pipelineStats.closedCount} sub={pipelineStats.closedValue + " tracked"} onClick={() => setView("pipeline")}/>
      </div>

      <div className="stack">
        <div>
          <SectionHead title="Today's actions" count={actions.length}>
            <button className="btn" onClick={() => setView("actions")}>View all <Icon name="chevR"/></button>
          </SectionHead>
          {actions.length === 0 ? (
            <Empty title="Inbox zero" sub="No open actions. Well done." flags={flags}/>
          ) : (
            <div className="table-wrap" style={{overflowX:"hidden"}}>
              <table className={tableCls} style={{width:"100%", tableLayout:"fixed"}}>
                <colgroup>
                  <col style={{width:34}}/>
                  <col/>
                  <col style={{width:"28%"}} className="hide-sm"/>
                  <col style={{width:100}}/>
                  <col style={{width:110}}/>
                </colgroup>
                <thead>
                  <tr>
                    <th style={{width:34}}></th>
                    <th>Task</th>
                    <th className="hide-sm">Context</th>
                    <th style={{width:100}}>Importance</th>
                    <th style={{width:110, textAlign:"right", paddingRight:20}}>Due</th>
                  </tr>
                </thead>
                <tbody className={flags.microMotion ? "stagger" : ""}>
                  {actions.map(a => (
                    <tr key={a.id} className={a.done ? "done" : ""} onClick={(e) => { if(e.target.closest(".check")) return; openAction && openAction(a); }}>
                      <td style={{width:34}} onClick={e => e.stopPropagation()}>
                        <span className={"check" + (a.done ? " done" : "")} onClick={() => toggleAction(a.id)} role="checkbox" aria-checked={a.done}/>
                      </td>
                      <td className="strong" style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{a.title}</td>
                      <td className="hide-sm muted text-sm" style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{a.ctx}</td>
                      <td><ImportanceChip i={a.importance}/></td>
                      <td className="mono num" style={{textAlign:"right", whiteSpace:"nowrap", paddingRight:20}} {...(flags.relTime && a.due ? { "data-tip": VT_FMT.FULL(a.due) } : {})}>{!a.done && a.bucket === "overdue" ? "Due Today" : a.dueFmt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <SectionHead title="Active deals" count={stats.activeDealCount}>
            <button className="btn" onClick={() => setView("pipeline")}>Pipeline <Icon name="chevR"/></button>
            <button className="btn" onClick={() => setView("deals")}>All deals <Icon name="chevR"/></button>
          </SectionHead>
          {activeDeals.length === 0 ? (
            <Empty title="No active deals" sub="Capture your first via the top bar." cta="Quick capture" onCta={() => setModal("capture")} flags={flags}/>
          ) : (
            <div className={"grid" + (flags.microMotion ? " stagger" : "")}>
              {activeDeals.map(d => <DealCard key={d.id} deal={d} onClick={openDeal} flags={flags}/>)}
            </div>
          )}
        </div>

        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))", gap:16}}>
          <div>
            <SectionHead title="Market intel" count={recentIntel.length}>
              <button className="btn" onClick={() => setView("intel")}>All <Icon name="chevR"/></button>
            </SectionHead>
            {recentIntel.length === 0 ? <Empty title="No intel yet" flags={flags}/> : (
              <div className="table-wrap">
                <table className={tableCls + " table--intel"}>
                  <tbody>
                    {recentIntel.map(i => (
                      <tr key={i.id}>
                        <td style={{whiteSpace:"normal", verticalAlign:"top", paddingTop:10, paddingBottom:10, paddingRight:14}}>
                          <div className="strong" style={{marginBottom:3}}>{i.title}</div>
                          {i.body && <div className="muted text-sm" style={{display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden", lineHeight:1.45}}>{i.body}</div>}
                        </td>
                        <td style={{width:110, verticalAlign:"top", paddingTop:12, whiteSpace:"nowrap"}}><ConfidenceChip c={i.confidence}/></td>
                        <td className="mono" style={{width:90, textAlign:"right", verticalAlign:"top", paddingTop:12, whiteSpace:"nowrap", paddingRight:14}} {...(flags.relTime && i.date ? { "data-tip": VT_FMT.FULL(i.date) } : {})}>{fmtDDMMMYY(i.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div>
            <SectionHead title="Cadence overdue" count={overdueContacts.length}>
              <button className="btn" onClick={() => setView("crm")}>CRM <Icon name="chevR"/></button>
            </SectionHead>
            {overdueContacts.length === 0 ? (
              <Empty title="All cadences current" sub="Nice one — keep the rhythm." flags={flags}/>
            ) : (
              <div className="table-wrap">
                <table className={tableCls}>
                  <tbody>
                    {overdueContacts.map(c => (
                      <tr key={c.id}>
                        <td style={{width:40}}><div className="avatar" style={{width:26, height:26, fontSize:10}}>{c.initials}</div></td>
                        <td className="strong">{c.name}<div className="muted text-sm">{c.firm}</div></td>
                        <td style={{width:110}}><Chip kind={c.statusCls}>{c.status}</Chip></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ================== ACTIONS ==================
const ScreenActions = ({ toggleAction, openAction, updateAction, flags, setModal }) => {
  const [q, setQ] = useStateS("");
  const [tab, setTab] = useStateS("all");
  const [editing, setEditing] = useStateS(null); // { id, field }
  const tableCls = "table" + (flags.stickyHeaders ? " table--sticky" : "");

  const all = window.VT_ACTIONS;
  const filtered = useMemoS(() => {
    let a = all;
    if(tab === "open") a = a.filter(x => !x.done);
    else if(tab === "done") a = a.filter(x => x.done);
    else if(tab === "overdue") a = a.filter(x => !x.done && x.bucket === "overdue");
    if(q){
      const v = q.toLowerCase();
      a = a.filter(x => (x.title + " " + x.ctx + " " + x.notes).toLowerCase().includes(v));
    }
    return a;
  }, [q, tab, all]);

  const groups = useMemoS(() => {
    const g = { overdue: [], today: [], week: [], later: [], none: [], done: [] };
    filtered.forEach(a => {
      if(a.done) g.done.push(a);
      else if(g[a.bucket]) g[a.bucket].push(a);
      else g.none.push(a);
    });
    return g;
  }, [filtered]);

  const tabs = [
    { v:"all", l:"All", c:all.length },
    { v:"open", l:"Open", c:all.filter(x => !x.done).length },
    { v:"overdue", l:"Overdue", c:all.filter(x => !x.done && x.bucket === "overdue").length },
    { v:"done", l:"Done", c:all.filter(x => x.done).length },
  ];

  const GROUP_LABELS = { overdue:"Overdue", today:"Today", week:"This week", later:"Later", none:"No date", done:"Done" };
  const GROUP_ORDER = ["overdue","today","week","later","none","done"];
  const [doneOpen, setDoneOpen] = useStateS(false);

  return (
    <div>
      <div className="sec">
        <Tabs value={tab} onChange={setTab} items={tabs}/>
        <div className="sec__actions">
          <Search value={q} onChange={setQ} placeholder="Search actions…"/>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty title="Nothing here" sub="Try a different filter." cta="Quick capture" onCta={() => setModal && setModal("capture")} flags={flags}/>
      ) : (
        <div className="stack">
          {GROUP_ORDER.map(k => groups[k].length > 0 && (
            <div key={k}>
              {k === "done" ? (
                <div className="collapse-head" role="button" tabIndex={0} aria-expanded={doneOpen} onClick={() => setDoneOpen(v => !v)} onKeyDown={e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); setDoneOpen(v => !v); } }}>
                  <span className="collapse-head__caret"><Icon name="chevR" size={12}/></span>
                  <span className="collapse-head__title">Done</span>
                  <span className="collapse-head__count">{groups[k].length}</span>
                </div>
              ) : (
                <SectionHead title={GROUP_LABELS[k]} count={groups[k].length}/>
              )}
              <div className={k === "done" ? "collapse-body" : ""} data-open={k === "done" ? doneOpen : undefined} aria-hidden={k === "done" ? !doneOpen : undefined} style={k === "done" && !doneOpen ? {display:"none"} : undefined}>
              <div className="table-wrap" style={{overflowX:"hidden"}}>
                <table className={tableCls} style={{width:"100%", tableLayout:"fixed"}}>
                  <colgroup>
                    <col style={{width:34}}/>
                    <col/>
                    <col style={{width:"25%"}}/>
                    <col style={{width:100}}/>
                    <col style={{width:110}}/>
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={{width:34}}></th>
                      <th>Task</th>
                      <th className="hide-sm">Context</th>
                      <th style={{width:100}}>Importance</th>
                      <th style={{width:110, textAlign:"right", paddingRight:20}}>Due</th>
                    </tr>
                  </thead>
                  <tbody className={flags.microMotion ? "stagger" : ""}>
                    {groups[k].map(a => {
                      const editingTitle = editing && editing.id === a.id && editing.field === "title";
                      const editingDue = editing && editing.id === a.id && editing.field === "due";
                      const openRow = (e) => {
                        if(editing) return;
                        if(e.target.closest(".check") || e.target.closest(".inline-edit")) return;
                        openAction && openAction(a);
                      };
                      return (
                      <tr key={a.id} className={a.done ? "done" : ""} onClick={openRow}>
                        <td onClick={e => e.stopPropagation()}><span className={"check" + (a.done ? " done" : "")} onClick={() => toggleAction(a.id)}/></td>
                        <td className="strong" style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}} onDoubleClick={e => { e.stopPropagation(); setEditing({ id: a.id, field: "title" }); }}>
                          {editingTitle ? (
                            <input
                              className="inline-edit"
                              autoFocus
                              defaultValue={a.title}
                              onClick={e => e.stopPropagation()}
                              onBlur={e => { updateAction(a.id, { title: e.target.value }); setEditing(null); }}
                              onKeyDown={e => {
                                if(e.key === "Enter"){ updateAction(a.id, { title: e.target.value }); setEditing(null); }
                                else if(e.key === "Escape"){ setEditing(null); }
                              }}
                            />
                          ) : (
                            <span title={a.title}>{a.title}</span>
                          )}
                        </td>
                        <td className="hide-sm muted text-sm" style={{overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{a.ctx}</td>
                        <td><ImportanceChip i={a.importance}/></td>
                        <td className="mono num" style={{textAlign:"right", whiteSpace:"nowrap", paddingRight:20}} {...(flags.relTime && a.due ? { "data-tip": VT_FMT.FULL(a.due) } : {})} onDoubleClick={e => { e.stopPropagation(); setEditing({ id: a.id, field: "due" }); }}>
                          {editingDue ? (
                            <input
                              className="inline-edit inline-edit--num"
                              autoFocus
                              placeholder="e.g. Tomorrow, 3 Dec"
                              defaultValue={a.dueFmt === "—" ? "" : a.dueFmt}
                              onClick={e => e.stopPropagation()}
                              onBlur={e => { updateAction(a.id, { dueFmt: e.target.value || "—" }); setEditing(null); }}
                              onKeyDown={e => {
                                if(e.key === "Enter"){ updateAction(a.id, { dueFmt: e.target.value || "—" }); setEditing(null); }
                                else if(e.key === "Escape"){ setEditing(null); }
                              }}
                            />
                          ) : (
                            <span title="Double-click to edit">{!a.done && a.bucket === "overdue" ? "Due Today" : a.dueFmt}</span>
                          )}
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ================== CRM ==================
const ScreenCRM = ({ openContact, addContact, flags }) => {
  const [q, setQ] = useStateS("");
  const [tab, setTab] = useStateS("all");
  const all = window.VT_CONTACTS;
  const tableCls = "table" + (flags.stickyHeaders ? " table--sticky" : "");
  const filtered = useMemoS(() => {
    let c = all;
    if(tab === "overdue") c = c.filter(x => x.status === "Overdue");
    else if(tab === "tier1") c = c.filter(x => Number(x.tier) === 1);
    else if(tab === "tier2") c = c.filter(x => Number(x.tier) === 2);
    else if(tab === "tier3") c = c.filter(x => Number(x.tier) === 3);
    if(q){
      const v = q.toLowerCase();
      c = c.filter(x => (x.name + " " + x.firm + " " + x.role + " " + (x.sector || "") + " " + (x.assetCoverage || "")).toLowerCase().includes(v));
    }
    return c;
  }, [q, tab, all]);

  const { rows: sortedCrm, sortProps } = useSort(filtered, "tier", "asc");
  const tabs = [
    { v:"all", l:"All", c: all.length },
    { v:"tier1", l:"Tier 1", c: all.filter(x => Number(x.tier) === 1).length },
    { v:"tier2", l:"Tier 2", c: all.filter(x => Number(x.tier) === 2).length },
    { v:"tier3", l:"Tier 3", c: all.filter(x => Number(x.tier) === 3).length },
    { v:"overdue", l:"Overdue", c: all.filter(x => x.status === "Overdue").length },
  ];

  return (
    <div>
      <div className="sec">
        <Tabs value={tab} onChange={setTab} items={tabs}/>
        <div className="sec__actions">
          <Search value={q} onChange={setQ} placeholder="Search contacts, firms, sectors…"/>
          <button className="btn btn--primary" onClick={() => { const c = addContact && addContact(); if(c) openContact(c); }}><Icon name="plus" size={11}/> Add contact</button>
        </div>
      </div>

      {sortedCrm.length === 0 ? (
        <Empty title="No contacts" sub="Try a different filter." flags={flags}/>
      ) : (
        <div className="table-wrap">
          <table className={tableCls}>
            <thead>
              <tr>
                <th style={{width:40}}></th>
                <th {...sortProps("name")}>Name</th>
                <th className="hide-sm" style={{width:170}} {...sortProps("firm")}>Firm</th>
                <th className="hide-sm" style={{width:180}} {...sortProps("role")}>Role</th>
                <th className="hide-md" style={{width:130}} {...sortProps("sector")}>Sector</th>
                <th className="hide-md" style={{width:120}} {...sortProps("city")}>City</th>
                <th style={{width:75}} {...sortProps("tier")}>Tier</th>
                <th style={{width:135}} {...sortProps("status")}>Cadence</th>
                <th className="hide-sm" style={{width:100, textAlign:"right"}} {...sortProps("lastContacted")}>Last</th>
              </tr>
            </thead>
            <tbody className={flags.microMotion ? "stagger" : ""}>
              {sortedCrm.map(c => (
                <tr key={c.id} data-tier={c.tier} onClick={() => openContact(c)}>
                  <td><div className="avatar" style={{width:26, height:26, fontSize:10}}>{c.initials}</div></td>
                  <td className="strong">{c.name}</td>
                  <td className="hide-sm">{c.firm}</td>
                  <td className="hide-sm muted text-sm">{c.role}</td>
                  <td className="hide-md">{c.sector ? <span className={"chip " + window.VT_CLS.sector(c.sector)}>{c.sector}</span> : <span className="muted text-sm">—</span>}</td>
                  <td className="hide-md">{c.city ? <span className="text-sm">{c.city}</span> : <span className="muted text-sm">—</span>}</td>
                  <td><TierChip t={c.tier}/></td>
                  <td>{c.cadenceWeeks ? (
                    (() => {
                      const w = Number(c.cadenceWeeks);
                      const lbl = w <= 2 ? "Fortnightly" : w <= 4 ? "Monthly" : w <= 8 ? "Bi-Monthly" : w <= 13 ? "Quarterly" : w <= 26 ? "Half-Yearly" : "Annually";
                      return <span style={{display:"inline-flex", gap:6, alignItems:"center", flexWrap:"wrap"}}>
                        <span className="text-sm">{lbl}</span>
                        {(c.status === "Overdue" || c.status === "Due soon" || c.status === "Never contacted") && <Chip kind={c.statusCls}>{c.status}</Chip>}
                      </span>;
                    })()
                  ) : <span className="muted text-sm">—</span>}</td>
                  <td className="hide-sm mono num" style={{textAlign:"right", paddingRight:20}} {...(flags.relTime && c.lastContacted ? { "data-tip": VT_FMT.FULL(c.lastContacted) } : {})}>{c.lastContactedFmt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ================== Leasing format helpers ==================
function fmtArea(v){ const n = parseFloat(String(v).replace(/,/g,"")); return isNaN(n) ? (v || "—") : n.toLocaleString("en-AU", {maximumFractionDigits:0}) + " sqm"; }
function fmtFaceRent(v){ const n = parseFloat(String(v).replace(/,/g,"")); return isNaN(n) ? (v || "—") : "$" + n.toLocaleString("en-AU", {maximumFractionDigits:0}); }
function fmtTerm(v){ const n = parseFloat(String(v).replace(/,/g,"")); return isNaN(n) ? (v || "—") : n.toFixed(1); }
function fmtIncentive(v){ const n = parseFloat(String(v).replace(/,/g,"")); return isNaN(n) ? (v || "—") : n.toFixed(1) + "%"; }
function rentBasisShort(b){ if(!b || b === "—") return ""; return {Net:"N", Gross:"G", "Semi-Gross":"S"}[b] || b.charAt(0); }
// Date: DD-MMM-YY (e.g. "15-Apr-26") — matches VT_FMT.DATE; kept local for legacy call-sites.
const fmtDDMMMYY = VT_FMT.DATE;

// ================== PIPELINE ==================
const PHASE_LABELS_SHORT = { identified:"Identified", initial:"Initial Analysis", detailed:"Detailed Analysis", bid:"Bid Submitted", dd:"Entered DD", closed:"Closed", dead:"Dead" };
const ScreenPipeline = ({ openDeal, flags }) => {
  const basePhases = window.VT_PHASES;
  // phase overrides: dealId -> phaseK. Persisted to localStorage for demo continuity.
  const [overrides, setOverrides] = React.useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("vt_phase_overrides") || "{}");
      // Migrate legacy phase keys from earlier rename (qualification/investigation/ic/execution → new 5-phase system).
      const VALID = new Set(["identified","initial","detailed","bid","dd","closed","dead"]);
      const LEGACY_MAP = { qualification:"identified", investigation:"initial", ic:"detailed", execution:"bid" };
      const migrated = {};
      let changed = false;
      Object.entries(raw).forEach(([id, v]) => {
        if(VALID.has(v)){ migrated[id] = v; return; }
        if(LEGACY_MAP[v]){ migrated[id] = LEGACY_MAP[v]; changed = true; return; }
        changed = true; // unknown → drop
      });
      if(changed){ try { localStorage.setItem("vt_phase_overrides", JSON.stringify(migrated)); } catch(e){} }
      return migrated;
    } catch(e){ return {}; }
  });
  const [dragging, setDragging] = React.useState(null);
  const [dropTarget, setDropTarget] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [deadCollapsed, setDeadCollapsed] = React.useState(() => {
    try { return localStorage.getItem("vt_dead_collapsed") === "1"; } catch(e){ return false; }
  });
  React.useEffect(() => { try { localStorage.setItem("vt_dead_collapsed", deadCollapsed ? "1" : "0"); } catch(e){} }, [deadCollapsed]);
  const [closedCollapsed, setClosedCollapsed] = React.useState(() => {
    try { return localStorage.getItem("vt_closed_collapsed") === "1"; } catch(e){ return true; }
  });
  React.useEffect(() => { try { localStorage.setItem("vt_closed_collapsed", closedCollapsed ? "1" : "0"); } catch(e){} }, [closedCollapsed]);

  const resolvePhase = React.useCallback((d) => overrides[d.id] || d.phaseK, [overrides]);

  // Recompute phases with overrides applied
  const phases = React.useMemo(() => {
    const order = ["identified","initial","detailed","bid","dd","closed","dead"];
    return order.map(k => {
      const deals = window.VT_DEALS.filter(d => resolvePhase(d) === k);
      const value = deals.reduce((a,d) => a + (d.value || 0), 0);
      const basep = basePhases.find(p => p.k === k);
      return {
        k,
        label: basep ? basep.label : PHASE_LABELS_SHORT[k],
        count: deals.length,
        value,
        valueFmt: VT_FMT.AUD(value),
        deals,
      };
    });
  }, [overrides, basePhases, resolvePhase]);

  const total = phases.filter(p => p.k !== "dead").reduce((a,p) => a + p.count, 0);
  const totalValue = phases.filter(p => p.k !== "dead").reduce((a,p) => a + p.value, 0);
  const activeCount = phases.filter(p => p.k !== "dead" && p.k !== "closed").reduce((a,p) => a + p.count, 0);

  const moveToPhase = React.useCallback((deal, newPhaseK) => {
    const currentPhaseK = resolvePhase(deal);
    if(currentPhaseK === newPhaseK) return;
    setOverrides(prev => {
      const next = { ...prev };
      if(newPhaseK === deal.phaseK) delete next[deal.id];
      else next[deal.id] = newPhaseK;
      try { localStorage.setItem("vt_phase_overrides", JSON.stringify(next)); } catch(e){}
      return next;
    });
    const fromLbl = PHASE_LABELS_SHORT[currentPhaseK] || currentPhaseK;
    const toLbl = PHASE_LABELS_SHORT[newPhaseK] || newPhaseK;
    setToast({ msg: `${deal.title} moved ${fromLbl} → ${toLbl}`, at: Date.now() });
  }, [resolvePhase]);

  const resetOverrides = React.useCallback(() => {
    setOverrides({});
    try { localStorage.removeItem("vt_phase_overrides"); } catch(e){}
    setToast({ msg: "Pipeline moves reset", at: Date.now() });
  }, []);

  React.useEffect(() => {
    if(!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const hasOverrides = Object.keys(overrides).length > 0;

  const addPipelineDeal = React.useCallback(() => {
    const id = "new_" + Date.now();
    const blank = {
      id,
      title: "Untitled deal",
      suburb: "—",
      sector: null,
      phase: "Identified",
      phaseK: "identified",
      confidence: "Reported",
      conviction: null,
      strategy: null,
      processType: null,
      value: 0,
      valueFmt: "—",
      yield: "—",
      marketYield: "—",
      irr: "—",
      wale: "—",
      nla: "—",
      capVal: "—",
      vendor: "—",
      purchaser: "—",
      agent: "—",
      notes: "",
      days: 0,
      health: "track",
      healthLabel: "On track",
      meetingLabel: null,
    };
    window.VT_DEALS = [blank, ...window.VT_DEALS];
    openDeal(blank);
  }, [openDeal]);

  return (
    <div>
      <SectionHead title="Pipeline overview" count={total} subtitleBelow subtitle={<><strong>{VT_FMT.AUD(totalValue)}</strong> total value · {phases.filter(p => p.count > 0 && p.k !== "dead").length} active phases</>}>
        <button className="btn btn--primary" onClick={addPipelineDeal}><Icon name="plus" size={11}/> Add pipeline deal</button>
      </SectionHead>
      <div className="pipe">
        {phases.map(p => (
          <div className="phase" data-k={p.k} key={p.k}>
            <div className="phase__lbl">{p.label}</div>
            <div className="phase__n">{p.count}</div>
            <div className="phase__v">{p.valueFmt}</div>
            <ul className="phase__deals">
              {p.k !== "dead" && p.k !== "closed" && p.deals.slice(0, 4).map(d => (
                <li key={d.id} onClick={() => openDeal(d)} style={{cursor:"pointer"}}>· {d.title}</li>
              ))}
              {p.k !== "dead" && p.k !== "closed" && p.deals.length === 0 && <li className="empty">—</li>}
              {p.k !== "dead" && p.k !== "closed" && p.deals.length > 4 && <li className="muted text-sm">+{p.deals.length - 4} more</li>}
              {(p.k === "dead" || p.k === "closed") && p.deals.length > 0 && <li className="muted text-sm" style={{fontStyle:"italic"}}>See table below</li>}
              {(p.k === "dead" || p.k === "closed") && p.deals.length === 0 && <li className="empty">—</li>}
            </ul>
          </div>
        ))}
      </div>

      {flags.pipelineFlow ? (
        <div className="mt-lg">
          <SectionHead title="Deal flow" count={activeCount}>
            <span className="muted text-sm">Grouped by phase</span>
          </SectionHead>
          <div className="pipe-board">
            {phases.filter(p => p.k !== "closed" && p.k !== "dead").map(p => (
              <div
                className={"pipe-col" + (dropTarget === p.k ? " pipe-col--drop" : "")}
                data-k={p.k}
                key={p.k}
                onDragOver={e => { if(dragging){ e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDropTarget(p.k); } }}
                onDragLeave={e => { if(dropTarget === p.k) setDropTarget(null); }}
                onDrop={e => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/deal-id");
                  const deal = window.VT_DEALS.find(d => d.id === id);
                  if(deal) moveToPhase(deal, p.k);
                  setDropTarget(null);
                  setDragging(null);
                }}
              >
                <div className="pipe-col__head">
                  <span className="pipe-col__dot"/>
                  <span className="pipe-col__lbl">{p.label}</span>
                  <span className="pipe-col__count">{p.count}</span>
                </div>
                <div className="pipe-col__sub">{p.valueFmt}</div>
                <div className={"pipe-col__body" + (flags.microMotion ? " stagger" : "")}>
                  {p.deals.length === 0 && <div className="pipe-col__empty">{dropTarget === p.k ? "Drop here" : "No deals"}</div>}
                  {p.deals.map(d => (
                    <article
                      key={d.id}
                      className={"pipecard" + (dragging === d.id ? " pipecard--dragging" : "")}
                      data-phase={p.k}
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData("text/deal-id", d.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragging(d.id);
                      }}
                      onDragEnd={() => { setDragging(null); setDropTarget(null); }}
                      onClick={e => { if(dragging) return; openDeal(d); }}
                    >
                      <div className="pipecard__edge"/>
                      <span className="pipecard__grip" aria-hidden="true">⋮⋮</span>
                      <div className="pipecard__body">
                        <div style={{display:"flex", alignItems:"baseline", gap:6, justifyContent:"space-between"}}>
                          <div className="pipecard__title" style={{flex:1, minWidth:0}}>{d.title}</div>
                          <span className="pipecard__val" style={{fontSize:12, flexShrink:0, whiteSpace:"nowrap"}}>{d.valueFmt}</span>
                        </div>
                        <div className="pipecard__sub">{d.suburb || "—"}</div>
                        <div className="pipecard__metrics">
                          <div className="pipecard__metric"><span className="pipecard__metric__l">Initial Yield</span><span className="pipecard__metric__v">{d.yield}</span></div>
                          <div className="pipecard__metric"><span className="pipecard__metric__l">Market Yield</span><span className="pipecard__metric__v">{d.marketYield || "—"}</span></div>
                          <div className="pipecard__metric"><span className="pipecard__metric__l">IRR</span><span className="pipecard__metric__v">{d.irr || "—"}</span></div>
                          <div className="pipecard__metric"><span className="pipecard__metric__l">$/sqm</span><span className="pipecard__metric__v">{d.capVal}</span></div>
                        </div>
                        <div className="pipecard__foot">
                          <span className={"chip " + window.VT_CLS.sector(d.sector)}>{d.sector}</span>
                          {(() => {
                            const s = (d.strategy && d.strategy !== "—") ? d.strategy : (d.processType && d.processType !== "—" ? d.processType : null);
                            return s
                              ? <span className="chip chip--strategy" title="Strategy">{s}</span>
                              : <span className="chip chip--strategy" title="Strategy — not set" style={{opacity:0.55}}>No strategy</span>;
                          })()}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {(() => {
            const closedPhase = phases.find(p => p.k === "closed");
            const closedDeals = closedPhase ? closedPhase.deals : [];
            return (
              <div className={"dead-table" + (closedCollapsed ? " dead-table--collapsed" : "")}>
                <button className="dead-table__head" onClick={() => setClosedCollapsed(v => !v)} type="button" aria-expanded={!closedCollapsed}>
                  <span className={"dead-table__chev" + (closedCollapsed ? " dead-table__chev--collapsed" : "")}>▾</span>
                  <span className="dead-table__dot" style={{background:"var(--ink-3)"}}/>
                  <span className="dead-table__lbl">Closed</span>
                  <span className="dead-table__count">{closedDeals.length}</span>
                  <span className="dead-table__sub">{closedPhase ? closedPhase.valueFmt : "$0"}</span>
                  <span className="dead-table__hint">{closedCollapsed ? "Click to expand" : "Completed deals"}</span>
                </button>
                {!closedCollapsed && closedDeals.length > 0 && (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Address</th>
                        <th className="hide-sm">Suburb</th>
                        <th className="hide-sm">Sector</th>
                        <th style={{textAlign:"right"}}>Value</th>
                        <th style={{textAlign:"right", width:80}}>Yield</th>
                      </tr>
                    </thead>
                    <tbody>
                      {closedDeals.map(d => (
                        <tr key={d.id} onClick={() => openDeal(d)}>
                          <td className="strong">{d.title}</td>
                          <td className="hide-sm muted text-sm">{d.suburb || "—"}</td>
                          <td className="hide-sm"><span className={"chip " + window.VT_CLS.sector(d.sector)}>{d.sector}</span></td>
                          <td className="mono num" style={{textAlign:"right"}}>{d.valueFmt}</td>
                          <td className="mono num" style={{textAlign:"right"}}>{d.yield}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {!closedCollapsed && closedDeals.length === 0 && (
                  <div className="muted text-sm" style={{padding:"12px 16px"}}>No closed deals yet — drag a card to the Closed column to archive it here.</div>
                )}
              </div>
            );
          })()}
          {(() => {
            const deadPhase = phases.find(p => p.k === "dead");
            const deadDeals = deadPhase ? deadPhase.deals : [];
            const isDeadDrop = dropTarget === "dead";
            return (
              <div
                className={"dead-table" + (isDeadDrop ? " dead-table--drop" : "") + (deadCollapsed ? " dead-table--collapsed" : "")}
                onDragOver={e => { if(dragging){ e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDropTarget("dead"); } }}
                onDragLeave={() => { if(dropTarget === "dead") setDropTarget(null); }}
                onDrop={e => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/deal-id");
                  const deal = window.VT_DEALS.find(x => x.id === id);
                  if(deal) moveToPhase(deal, "dead");
                  setDropTarget(null);
                  setDragging(null);
                }}
              >
                <button className="dead-table__head" onClick={() => setDeadCollapsed(v => !v)} type="button" aria-expanded={!deadCollapsed}>
                  <span className={"dead-table__chev" + (deadCollapsed ? " dead-table__chev--collapsed" : "")}>▾</span>
                  <span className="dead-table__dot"/>
                  <span className="dead-table__lbl">Dead</span>
                  <span className="dead-table__count">{deadDeals.length}</span>
                  <span className="dead-table__sub">{deadPhase ? deadPhase.valueFmt : "$0"}</span>
                  <span className="dead-table__hint">{isDeadDrop ? "Drop here to mark dead" : deadCollapsed ? "Click to expand · drag to archive" : "Drag cards here to archive"}</span>
                </button>
                {!deadCollapsed && deadDeals.length > 0 && (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Address</th>
                        <th className="hide-sm">Suburb</th>
                        <th className="hide-sm">Sector</th>
                        <th style={{textAlign:"right"}}>Value</th>
                        <th style={{textAlign:"right", width:80}}>Yield</th>
                        <th style={{width:90, textAlign:"right"}}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {deadDeals.map(d => (
                        <tr key={d.id} onClick={() => openDeal(d)}>
                          <td className="strong">{d.title}</td>
                          <td className="hide-sm muted text-sm">{d.suburb || "—"}</td>
                          <td className="hide-sm"><span className={"chip " + window.VT_CLS.sector(d.sector)}>{d.sector}</span></td>
                          <td className="mono num" style={{textAlign:"right"}}>{d.valueFmt}</td>
                          <td className="mono num" style={{textAlign:"right"}}>{d.yield}</td>
                          <td style={{textAlign:"right"}}>
                            <button className="btn btn--xs" onClick={e => { e.stopPropagation(); moveToPhase(d, "identified"); }} title="Restore to Identified">Revive</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })()}
          {hasOverrides && (
            <div className="pipe-reset">
              <span className="muted text-sm"><Icon name="sparkle" size={11}/> {Object.keys(overrides).length} deal{Object.keys(overrides).length === 1 ? "" : "s"} moved this session</span>
              <button className="btn" onClick={resetOverrides}>Reset moves</button>
            </div>
          )}
          {toast && <div className="pipe-toast" key={toast.at}>{toast.msg}</div>}
        </div>
      ) : (
        <div className="mt-lg">
          <SectionHead title="All pipeline deals" count={window.VT_DEALS.length}/>
          <div className={"grid" + (flags.microMotion ? " stagger" : "")}>
            {window.VT_DEALS.map(d => <DealCard key={d.id} deal={d} onClick={openDeal} flags={flags}/>)}
          </div>
        </div>
      )}
    </div>
  );
};

// ================== DEAL CARDS (transactions) ==================
const ScreenDeals = ({ openTx, flags, setModal }) => {
  const [q, setQ] = useStateS("");
  const [sector, setSector] = useStateS("all");

  const all = window.VT_TRANSACTIONS;
  const sectors = useMemoS(() => {
    const s = new Set(all.map(x => x.sector).filter(Boolean));
    return [{v:"all", l:"All sectors", c:all.length}, ...[...s].map(x => ({v:x, l:x, c:all.filter(d => d.sector === x).length}))];
  }, [all]);

  const filtered = useMemoS(() => {
    let r = all;
    if(sector !== "all") r = r.filter(x => x.sector === sector);
    if(q){
      const v = q.toLowerCase();
      r = r.filter(x => (x.title + " " + x.suburb + " " + (x.vendor||"") + " " + (x.purchaser||"") + " " + x.notes).toLowerCase().includes(v));
    }
    return r.sort((a,b) => new Date(b.saleDate || 0) - new Date(a.saleDate || 0));
  }, [q, sector, all]);

  const addBlankTx = () => {
    const id = "new_tx_" + Date.now();
    const blank = {
      id,
      title: "Untitled deal",
      suburb: "—",
      sector: null,
      subSector: null,
      value: 0,
      valueFmt: "—",
      yield: "—",
      yieldRaw: null,
      nla: "—",
      nlaRaw: 0,
      capVal: "—",
      capValRaw: null,
      wale: "—",
      processType: null,
      vendor: "—",
      purchaser: "—",
      agent: "—",
      status: "Confirmed",
      confidence: "Reported",
      conviction: null,
      saleDate: new Date().toISOString().slice(0,10),
      saleDateFmt: "—",
      notes: "",
    };
    window.VT_TRANSACTIONS = [blank, ...window.VT_TRANSACTIONS];
    openTx(blank);
  };

  return (
    <div>
      <div className="sec">
        <Tabs value={sector} onChange={setSector} items={sectors}/>
        <div className="sec__actions">
          <Search value={q} onChange={setQ} placeholder="Search address, vendor, purchaser…"/>
          <button className="btn btn--primary" onClick={addBlankTx}><Icon name="plus" size={11}/> Add deal</button>
        </div>
      </div>
      {filtered.length === 0 ? (
        <Empty title="No deals match" cta="Quick capture" onCta={() => setModal && setModal("capture")} flags={flags}/>
      ) : (
        <div className={"grid" + (flags.microMotion ? " stagger" : "")}>
          {filtered.map(d => <TxCard key={d.id} tx={d} onClick={openTx} flags={flags}/>)}
          <article className="card card--new" onClick={addBlankTx} style={{cursor:"pointer", borderStyle:"dashed", display:"flex", alignItems:"center", justifyContent:"center", minHeight:160, gap:10, color:"var(--ink-3)"}}>
            <Icon name="plus" size={16}/>
            <span>Add deal</span>
          </article>
        </div>
      )}
    </div>
  );
};

// ================== LEASING ==================
const LeasingCard = ({ l, onClick }) => {
  const rentFmt = fmtFaceRent(l.rent);
  const basis = rentBasisShort(l.rentBasis);
  const rentDisplay = rentFmt !== "—" ? rentFmt + (basis ? " " + basis : "") : "—";
  const tenant = l.tenant && l.tenant !== "—" ? l.tenant : null;
  const suburb = l.suburb && l.suburb !== "—" ? l.suburb : null;
  const state = l.state && l.state !== "—" ? l.state : null;
  const locationStr = suburb ? (state ? suburb + ", " + state : suburb) : (state || null);
  const dateFmt = VT_FMT.DATE(l.commencement);
  return (
    <div className="card card--hero" data-sector={l.sector || ""} onClick={() => onClick(l)}>
      <div className="card__edge"/>
      <div className="card__body" style={{position:"relative"}}>
        <div style={{paddingRight:90}}>
          <div className="card__title">{l.title}</div>
          {locationStr && <div className="card__sub" style={{marginTop:3}}>{locationStr}</div>}
        </div>
        <div style={{position:"absolute", top:14, right:14, textAlign:"right"}}>
          <div className="card__money">{rentDisplay}</div>
          {tenant && <div style={{fontSize:11, color:"var(--ink-3)", marginTop:3, fontWeight:500}}>{tenant}</div>}
        </div>
        <div className="card__stats">
          <div className="card__stat">
            <div className="card__stat__l">Area</div>
            <div className="card__stat__v">{fmtArea(l.area)}</div>
          </div>
          <div className="card__stat">
            <div className="card__stat__l">Face Rent</div>
            <div className="card__stat__v">{rentDisplay}</div>
          </div>
          <div className="card__stat">
            <div className="card__stat__l">Term (yrs)</div>
            <div className="card__stat__v">{fmtTerm(l.term)}</div>
          </div>
          <div className="card__stat">
            <div className="card__stat__l">Incentive</div>
            <div className="card__stat__v">{fmtIncentive(l.incentive)}</div>
          </div>
        </div>
        <div className="card__chips">
          {l.sector && <SectorChip s={l.sector}/>}
          <Chip kind="">{l.status || "Draft"}</Chip>
          {dateFmt !== "—" && <span style={{marginLeft:"auto", fontSize:10, color:"var(--ink-4)", fontFamily:"var(--mono)"}}>{dateFmt}</span>}
        </div>
      </div>
    </div>
  );
};

const ScreenLeasing = ({ leases = [], openLease, addLease, removeLease, flags, setModal }) => (
  <div>
    <SectionHead title="Leasing cards" count={leases.length}>
      <button className="btn btn--primary" style={{marginLeft:"auto"}} onClick={addLease}><Icon name="plus" size={11}/> New leasing</button>
    </SectionHead>
    {leases.length === 0 ? (
      <div className="grid" style={{marginTop:12}}>
        <article className="card card--new" onClick={addLease} style={{cursor:"pointer", borderStyle:"dashed", display:"flex", alignItems:"center", justifyContent:"center", minHeight:160, gap:10, color:"var(--ink-3)"}}>
          <Icon name="plus" size={16}/>
          <div>
            <div style={{fontWeight:600, color:"var(--ink)"}}>Start a leasing card</div>
            <div className="muted text-sm">Blank card — fill in tenant, rent, term, incentive</div>
          </div>
        </article>
      </div>
    ) : (
      <div className={"grid" + (flags.microMotion ? " stagger" : "")} style={{marginTop:12}}>
        {leases.map(l => <LeasingCard key={l.id} l={l} onClick={openLease}/>)}
        <article className="card card--new" onClick={addLease} style={{cursor:"pointer", borderStyle:"dashed", display:"flex", alignItems:"center", justifyContent:"center", minHeight:160, gap:10, color:"var(--ink-3)"}}>
          <Icon name="plus" size={16}/>
          <span>Add leasing card</span>
        </article>
      </div>
    )}
  </div>
);

// ================== INTEL ==================
const IntelTable = ({ rows, openIntel, tableCls, flags }) => {
  const { rows: sortedIntel, sortProps } = useSort(rows, "date", "desc");
  return (
    <div className="table-wrap">
      <table className={tableCls + " table--intel"}>
        <thead>
          <tr>
            <th style={{minWidth:260}} {...sortProps("title")}>Headline</th>
            <th className="hide-sm" style={{width:230}} {...sortProps("sector")}>Sector / Confidence</th>
            <th className="hide-sm" style={{width:120}} {...sortProps("source")}>Source</th>
            <th className="hide-sm" style={{width:160, textAlign:"right", paddingRight:20}} {...sortProps("category")}>Category / Date</th>
          </tr>
        </thead>
        <tbody className={flags.microMotion ? "stagger" : ""}>
          {sortedIntel.map(i => (
            <tr key={i.id} onClick={() => openIntel(i)}>
              <td className="strong td-top" style={{whiteSpace:"normal"}}>
                <span className="strong">{i.title}</span>
                <div className="muted text-sm" style={{marginTop:3, whiteSpace:"normal", fontWeight:400}}>{i.body.slice(0,120)}{i.body.length > 120 ? "…" : ""}</div>
              </td>
              <td className="hide-sm td-top">
                <div style={{display:"flex", gap:5, alignItems:"center", flexWrap:"wrap"}}>
                  {i.sector ? <SectorChip s={i.sector}/> : <span className="muted text-sm">—</span>}
                  <ConfidenceChip c={i.confidence}/>
                </div>
              </td>
              <td className="hide-sm muted text-sm td-top">{i.source || "—"}</td>
              <td className="hide-sm td-top" style={{textAlign:"right", whiteSpace:"nowrap", paddingRight:20}}>
                <div className="strong">{i.category || "—"}</div>
                <div className="mono num muted text-sm" style={{marginTop:3}} {...(flags.relTime && i.date ? { "data-tip": VT_FMT.FULL(i.date) } : {})}>{fmtDDMMMYY(i.date)}</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ScreenIntel = ({ openIntel, flags }) => {
  const [q, setQ] = useStateS("");
  const [cat, setCat] = useStateS("all");
  const tableCls = "table" + (flags.stickyHeaders ? " table--sticky" : "");
  const all = window.VT_INTEL;
  const cats = useMemoS(() => {
    const s = new Set(all.map(x => x.category).filter(Boolean));
    return [{v:"all", l:"All", c:all.length}, ...[...s].map(x => ({v:x, l:x, c:all.filter(i => i.category === x).length}))];
  }, [all]);
  const filtered = useMemoS(() => {
    let r = all;
    if(cat !== "all") r = r.filter(x => x.category === cat);
    if(q){
      const v = q.toLowerCase();
      r = r.filter(x => (x.title + " " + x.body + " " + (x.source||"")).toLowerCase().includes(v));
    }
    return r.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [q, cat, all]);

  return (
    <div>
      <div className="sec">
        <Tabs value={cat} onChange={setCat} items={cats.slice(0, 6)}/>
        <div className="sec__actions">
          <Search value={q} onChange={setQ} placeholder="Search intel…"/>
        </div>
      </div>
      {filtered.length === 0 ? <Empty title="No intel" flags={flags}/> : (
        <IntelTable rows={filtered} openIntel={openIntel} tableCls={tableCls} flags={flags}/>
      )}
    </div>
  );
};

// ================== STRATEGY ==================
const ScreenStrategy = ({ openStrategy, flags }) => {
  const [q, setQ] = useStateS("");
  const [theme, setTheme] = useStateS("all");
  const all = window.VT_STRATEGY;
  const themeCount = useMemoS(() => new Set(all.map(x => x.theme).filter(Boolean)).size, [all]);
  const themes = useMemoS(() => {
    const s = new Set(all.map(x => x.theme).filter(Boolean));
    return [{v:"all", l:"All", c:all.length}, ...[...s].slice(0, 8).map(x => ({v:x, l:x, c:all.filter(i => i.theme === x).length}))];
  }, [all]);
  const filtered = useMemoS(() => {
    let r = all;
    if(theme !== "all") r = r.filter(x => x.theme === theme);
    if(q){
      const v = q.toLowerCase();
      r = r.filter(x => (x.title + " " + x.body).toLowerCase().includes(v));
    }
    return r.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [q, theme, all]);

  return (
    <div>
      <SectionHead title="Strategy & ideas" count={all.length}/>
      <div className="sec">
        <Tabs value={theme} onChange={setTheme} items={themes}/>
        <div className="sec__actions">
          <Search value={q} onChange={setQ} placeholder="Search strategy & ideas…"/>
        </div>
      </div>
      {filtered.length === 0 ? <Empty title="No ideas yet" flags={flags}/> : (
        <div className={"stack" + (flags.microMotion ? " stagger" : "")}>
          {filtered.map(s => (
            <div key={s.id} className="card" onClick={() => openStrategy(s)}>
              <div className="card__head">
                <div style={{flex:1, minWidth:0}}>
                  <div className="card__sub" style={{marginBottom:4}}>
                    <span className="pill">{s.theme}</span>
                    {s.sector && <><span className="dot"/><SectorChip s={s.sector}/></>}
                    <span className="dot"/><span className="mono text-sm" {...(flags.relTime && s.date ? { "data-tip": VT_FMT.FULL(s.date) } : {})}>{fmtDDMMMYY(s.date)}</span>
                  </div>
                  <div className="card__notes" style={{WebkitLineClamp:3}}>{s.body}</div>
                </div>
                <ImportanceChip i={s.importance}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ================== PENDING REVIEW ==================
const ScreenReview = ({ showToast }) => {
  const { useState: useStateR, useEffect: useEffectR, useCallback: useCallbackR } = React;
  const [records, setRecords] = useStateR([]);
  const [loading, setLoading] = useStateR(true);
  const [working, setWorking] = useStateR(new Set());

  const sb = window.__vantageAuth;

  const TYPE_LABELS = {
    intel: "Market Intel",
    contact_new: "New Contact",
    contact_update: "Contact Update",
    task: "Task",
    deal_new: "New Deal",
    deal_update: "Deal Update",
  };
  const TYPE_COLORS = {
    intel: "#6366F1",
    contact_new: "#059669",
    contact_update: "#D97706",
    task: "#2563EB",
    deal_new: "#7C3AED",
    deal_update: "#DC2626",
  };

  const load = useCallbackR(async () => {
    setLoading(true);
    try {
      const { data, error } = await sb.from('pending_review').select('*').eq('status','pending').order('created_at', { ascending: true });
      if(error) throw error;
      setRecords(data || []);
      window.VT_PENDING_COUNT = (data || []).length;
    } catch(e) {
      console.error('pending_review load error', e);
    }
    setLoading(false);
  }, []);

  useEffectR(() => { load(); }, []);

  const writeToLiveTable = async (rec) => {
    const d = rec.proposed_data;
    const type = rec.record_type;
    if(type === 'intel') {
      const { error } = await sb.from('intel_records').insert([{
        intel_date: d.intel_date || d.date_logged || null,
        source: d.source,
        confidence: d.confidence || 'Reported',
        sector: d.sector || d.asset_class || null,
        grade: d.grade,
        strategy: d.strategy,
        geography: d.geography,
        summary: d.summary,
        intel_type: d.intel_type || 'Transaction',
        source_contact_id: d.source_contact_id || null,
        source_contact_name: d.source_contact_name || null,
        meeting_label: d.meeting_label || rec.source_meeting_label,
        meeting_id: d.meeting_id || rec.source_meeting_id,
        raw_extract: d.raw_extract || null,
      }]);
      return error;
    }
    if(type === 'contact_new') {
      const { error } = await sb.from('contacts').insert([{
        name: d.name,
        first_name: d.first_name || null,
        last_name: d.last_name || null,
        firm: d.firm || null,
        firm_type: d.firm_type || null,
        role_title: d.role_title || null,
        email: d.email || null,
        mobile: d.mobile || null,
        city: d.city || null,
        state: d.state || null,
        asset_class_coverage: d.asset_class_coverage || null,
        relationship_tier: d.relationship_tier || 2,
        cadence_weeks: d.cadence_weeks || 8,
        last_contact_date: d.last_contact_date || null,
        last_contact_summary: d.last_contact_summary || null,
      }]);
      return error;
    }
    if(type === 'contact_update') {
      if(!d.id) return new Error('contact_update missing id');
      const { id, ...rest } = d;
      const { error } = await sb.from('contacts').update(rest).eq('id', id);
      return error;
    }
    if(type === 'task') {
      const { error } = await sb.from('tasks').insert([{
        title: d.title || d.task || '(untitled)',
        importance: d.importance || 'Medium',
        status: (d.status && d.status[0].toUpperCase() + d.status.slice(1)) || 'Open',
        deadline_date: d.deadline_date || null,
        reminder_date: d.reminder_date || null,
        category: d.category || null,
        notes: d.notes || null,
        deal_card_id: d.deal_card_id || null,
        contact_id: d.contact_id || null,
        leasing_card_id: d.leasing_card_id || null,
        date_logged: d.date_logged || new Date().toISOString().slice(0,10),
        meeting_label: rec.source_meeting_label || null,
        meeting_id: rec.source_meeting_id || null,
      }]);
      return error;
    }
    if(type === 'deal_new') {
      const { error } = await sb.from('deal_cards').insert([{
        address: d.address || null,
        suburb: d.suburb || null,
        state: d.state || null,
        sector: d.sector || null,
        strategy: d.strategy || null,
        process_type: d.process_type || null,
        vendor: d.vendor || null,
        headline_price: d.headline_price || null,
        reported_yield: d.reported_yield || null,
        status: d.status || 'Rumoured',
        confidence: d.confidence || 'Rumoured',
        source: d.source || null,
        notes: d.notes || null,
        meeting_label: rec.source_meeting_label || null,
        meeting_id: rec.source_meeting_id || null,
      }]);
      return error;
    }
    if(type === 'deal_update') {
      if(!d.id) return new Error('deal_update missing id');
      const { id, ...rest } = d;
      const { error } = await sb.from('deal_cards').update(rest).eq('id', id);
      return error;
    }
    return new Error('Unknown record_type: ' + type);
  };

  const approve = async (rec) => {
    setWorking(prev => new Set([...prev, rec.id]));
    try {
      const writeErr = await writeToLiveTable(rec);
      if(writeErr) { showToast('Write failed: ' + writeErr.message); return; }
      await sb.from('pending_review').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', rec.id);
      setRecords(prev => prev.filter(r => r.id !== rec.id));
      window.VT_PENDING_COUNT = Math.max(0, (window.VT_PENDING_COUNT || 0) - 1);
      showToast('Approved');
    } catch(e) {
      showToast('Error: ' + e.message);
    }
    setWorking(prev => { const s = new Set(prev); s.delete(rec.id); return s; });
  };

  const reject = async (rec) => {
    setWorking(prev => new Set([...prev, rec.id]));
    try {
      await sb.from('pending_review').update({ status: 'rejected', reviewed_at: new Date().toISOString() }).eq('id', rec.id);
      setRecords(prev => prev.filter(r => r.id !== rec.id));
      window.VT_PENDING_COUNT = Math.max(0, (window.VT_PENDING_COUNT || 0) - 1);
      showToast('Rejected');
    } catch(e) {
      showToast('Error: ' + e.message);
    }
    setWorking(prev => { const s = new Set(prev); s.delete(rec.id); return s; });
  };

  const approveAll = async () => {
    if(!records.length) return;
    if(!confirm(`Approve all ${records.length} pending records?`)) return;
    for(const rec of records) { await approve(rec); }
  };

  if(loading) return (
    <div className="screen-pad" style={{textAlign:'center', paddingTop:64}}>
      <div className="muted">Loading pending records…</div>
    </div>
  );

  if(!records.length) return (
    <div className="screen-pad">
      <div className="empty" style={{textAlign:'center', paddingTop:64}}>
        <div style={{fontSize:32, marginBottom:12}}>✓</div>
        <div style={{fontWeight:600, fontSize:17}}>Nothing pending</div>
        <div className="muted text-sm" style={{marginTop:6}}>All clear — no records waiting for review.</div>
      </div>
    </div>
  );

  // Group by type for rendering
  const groups = {};
  records.forEach(r => {
    if(!groups[r.record_type]) groups[r.record_type] = [];
    groups[r.record_type].push(r);
  });

  const renderDataPreview = (proposed_data, record_type) => {
    if(!proposed_data) return null;
    const d = proposed_data;
    const rows = [];
    if(record_type === 'intel') {
      if(d.intel_date) rows.push(['Date', d.intel_date]);
      if(d.asset_class) rows.push(['Asset class', d.asset_class]);
      if(d.geography) rows.push(['Geography', d.geography]);
      if(d.strategy) rows.push(['Strategy', d.strategy]);
      if(d.confidence) rows.push(['Confidence', d.confidence]);
      if(d.intel_type) rows.push(['Type', d.intel_type]);
      if(d.source) rows.push(['Source', d.source]);
      if(d.summary) rows.push(['Summary', d.summary]);
    } else if(record_type === 'contact_new' || record_type === 'contact_update') {
      if(d.name) rows.push(['Name', d.name]);
      if(d.firm) rows.push(['Firm', d.firm]);
      if(d.role_title) rows.push(['Role', d.role_title]);
      if(d.email) rows.push(['Email', d.email]);
      if(d.city) rows.push(['City', d.city]);
      if(d.relationship_tier) rows.push(['Tier', d.relationship_tier]);
      if(d.last_contact_summary) rows.push(['Last contact', d.last_contact_summary]);
    } else if(record_type === 'task') {
      if(d.title || d.task) rows.push(['Task', d.title || d.task]);
      if(d.importance) rows.push(['Importance', d.importance]);
      if(d.deadline_date) rows.push(['Deadline', d.deadline_date]);
      if(d.category) rows.push(['Category', d.category]);
      if(d.notes) rows.push(['Notes', d.notes]);
    } else if(record_type === 'deal_new' || record_type === 'deal_update') {
      if(d.address) rows.push(['Address', d.address]);
      if(d.sector) rows.push(['Sector', d.sector]);
      if(d.strategy) rows.push(['Strategy', d.strategy]);
      if(d.headline_price) rows.push(['Price', '$' + Number(d.headline_price).toLocaleString()]);
      if(d.status) rows.push(['Status', d.status]);
      if(d.notes) rows.push(['Notes', d.notes]);
    }
    return (
      <div style={{marginTop:10, paddingTop:10, borderTop:'1px solid var(--rule)'}}>
        {rows.map(([k,v]) => (
          <div key={k} style={{display:'flex', gap:8, marginBottom:4, fontSize:12, lineHeight:1.4}}>
            <span style={{color:'var(--ink-3)', minWidth:90, flexShrink:0, fontWeight:500}}>{k}</span>
            <span style={{color:'var(--ink-1)', wordBreak:'break-word'}}>{String(v)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="screen-pad">
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20}}>
        <div>
          <div style={{fontWeight:700, fontSize:17}}>{records.length} record{records.length !== 1 ? 's' : ''} pending review</div>
          <div className="muted text-sm" style={{marginTop:2}}>Extracted from Granola by the team. Approve to write to the live database.</div>
        </div>
        <button className="btn btn--accent" onClick={approveAll}>
          Approve all ({records.length})
        </button>
      </div>

      {Object.entries(groups).map(([type, recs]) => (
        <div key={type} style={{marginBottom:28}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
            <span style={{
              display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11,
              fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase',
              background: TYPE_COLORS[type] + '18', color: TYPE_COLORS[type]
            }}>
              {TYPE_LABELS[type] || type}
            </span>
            <span className="muted text-sm">{recs.length} item{recs.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="stack">
            {recs.map(rec => {
              const busy = working.has(rec.id);
              return (
                <div key={rec.id} className="card" style={{padding:'14px 16px'}}>
                  <div style={{display:'flex', alignItems:'flex-start', gap:10}}>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontWeight:600, fontSize:13, lineHeight:1.4, marginBottom:2}}>
                        {rec.display_label || '(no label)'}
                      </div>
                      {rec.source_meeting_label && (
                        <div className="muted text-sm" style={{display:'flex', alignItems:'center', gap:4}}>
                          <Icon name="granola" size={10}/>
                          {rec.source_meeting_label}
                        </div>
                      )}
                      {renderDataPreview(rec.proposed_data, rec.record_type)}
                    </div>
                    <div style={{display:'flex', flexDirection:'column', gap:6, flexShrink:0}}>
                      <button
                        className="btn btn--accent"
                        style={{fontSize:12, padding:'5px 12px'}}
                        disabled={busy}
                        onClick={() => approve(rec)}
                      >
                        {busy ? '…' : 'Approve'}
                      </button>
                      <button
                        className="btn btn--danger"
                        style={{fontSize:12, padding:'5px 12px'}}
                        disabled={busy}
                        onClick={() => reject(rec)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

Object.assign(window, {
  ScreenDashboard, ScreenActions, ScreenCRM, ScreenPipeline,
  ScreenDeals, ScreenLeasing, ScreenIntel, ScreenStrategy, ScreenReview,
});
