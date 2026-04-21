// Left rail — query library grouped by folder with search + status badges
function Sidebar({ queries, activeId, onPick, onNew }) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState({ "Volets Roulants": true, "Portes de Garage": true, "Stores": false, "Commun": false });

  const filtered = queries.filter(x =>
    !q || x.name.toLowerCase().includes(q.toLowerCase()) || x.folder.toLowerCase().includes(q.toLowerCase())
  );
  const groups = {};
  filtered.forEach(x => { (groups[x.folder] ||= []).push(x); });

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark"><IcBolt size={14} /></div>
        <div className="brand-name">
          <div className="brand-title">Production Query Editor</div>
          <div className="brand-sub">SOPROFEN · atelier production</div>
        </div>
      </div>

      <div className="sidebar-actions">
        <button className="btn btn-new" onClick={onNew}><IcPlus size={14}/> Nouvelle requete</button>
      </div>

      <div className="sidebar-search">
        <IcSearch size={14} />
        <input placeholder="Rechercher une requete…" value={q} onChange={e => setQ(e.target.value)} />
        <kbd>⌘K</kbd>
      </div>

      <div className="sidebar-list">
        {Object.entries(groups).map(([folder, items]) => (
          <div key={folder} className="grp">
            <button className="grp-head" onClick={() => setOpen(o => ({...o, [folder]: !o[folder]}))}>
              <IcChevDn size={12} style={{ transform: open[folder] ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform .15s" }}/>
              <IcFolder size={14}/>
              <span>{folder}</span>
              <span className="grp-count">{items.length}</span>
            </button>
            {open[folder] && (
              <div className="grp-items">
                {items.map(it => (
                  <button key={it.id}
                    className={`grp-item${it.id === activeId ? " is-active" : ""}`}
                    onClick={() => onPick(it.id)}>
                    <IcFile size={13}/>
                    <span className="grp-item-name">{it.name}</span>
                    <StatusDot status={it.status}/>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="sidebar-foot">
        <div className="user-chip">
          <div className="avatar">TL</div>
          <div>
            <div className="user-name">t.laurent</div>
            <div className="user-sub">devops · SOPROFEN</div>
          </div>
          <button className="icon-btn" title="Parametres"><IcSettings size={14}/></button>
        </div>
      </div>
    </aside>
  );
}

function StatusDot({ status }) {
  const map = {
    clean:    { cls: "ok",  label: "synchro" },
    modified: { cls: "wip", label: "modifiee" },
    "pr-open":{ cls: "pr",  label: "PR ouverte" },
  };
  const m = map[status] || map.clean;
  return <span className={`sd sd-${m.cls}`} title={m.label}/>;
}

Object.assign(window, { Sidebar, StatusDot });
