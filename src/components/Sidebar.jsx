import React from 'react';
import { IcBolt, IcPlus, IcSearch, IcChevDn, IcFolder, IcFile, IcSettings } from './Icons';

const SOURCES = [
  { key: 'production_screen', label: 'Écran de prod' },
  { key: 'cu_parameter',      label: 'Requêtes CU'  },
];

// AttributeModel grouping is only meaningful for ProductionScreen — CUParameter has no notion.
const GROUP_BYS_PS = [
  { key: 'establishment',  label: 'Établissement'  },
  { key: 'attributeModel', label: 'AttributeModel' },
];
const GROUP_BYS_CU = [
  { key: 'establishment',  label: 'Établissement'  },
];

export function Sidebar({ queries, activeId, onPick, onNew }) {
  const [source, setSource]       = React.useState('production_screen');
  const [groupBy, setGroupBy]     = React.useState('establishment');
  const [q, setQ]                 = React.useState("");
  const [collapsed, setCollapsed] = React.useState({});

  // Force back to "establishment" when switching to CU (AttributeModel doesn't apply).
  React.useEffect(() => {
    if (source === 'cu_parameter' && groupBy === 'attributeModel') setGroupBy('establishment');
  }, [source, groupBy]);

  const groupBys = source === 'cu_parameter' ? GROUP_BYS_CU : GROUP_BYS_PS;

  const sourceCounts = SOURCES.reduce((acc, s) => {
    acc[s.key] = queries.filter(x => x.source === s.key).length;
    return acc;
  }, {});

  const matchesSearch = (it) => {
    if (!q) return true;
    const n = q.toLowerCase();
    return (
      it.id.toLowerCase().includes(n) ||
      it.name.toLowerCase().includes(n) ||
      String(it.requestId ?? '').includes(n) ||
      (it.workCenter || '').toLowerCase().includes(n) ||
      (it.establishment || '').toLowerCase().includes(n) ||
      (it.attributeModel || '').toLowerCase().includes(n)
    );
  };

  const filtered = queries.filter(x => x.source === source).filter(matchesSearch);

  const groups = {};
  filtered.forEach(it => {
    const key = groupBy === 'attributeModel'
      ? (it.attributeModel || '(sans modèle)')
      : (it.establishment   || '(sans étab.)');
    (groups[key] ||= []).push(it);
  });
  const groupKeys = Object.keys(groups).sort();

  const isOpen = key => !collapsed[key];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark"><IcBolt size={14}/></div>
        <div className="brand-name">
          <div className="brand-title">Production Query Editor</div>
          <div className="brand-sub">SOPROFEN · atelier production</div>
        </div>
      </div>

      <div className="sidebar-actions">
        <button className="btn btn-new" onClick={onNew}><IcPlus size={14}/> Nouvelle requete</button>
      </div>

      <div className="sidebar-source-tabs">
        {SOURCES.map(s => (
          <button key={s.key}
            className={`src-tab${source === s.key ? ' is-on' : ''}`}
            onClick={() => setSource(s.key)}>
            <span className="src-tab-label">{s.label}</span>
            <span className="src-tab-count">{sourceCounts[s.key] || 0}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-search">
        <IcSearch size={14}/>
        <input
          placeholder="Recherche : id, requestId, WorkCenter, etab., AttributeModel…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </div>

      {groupBys.length > 1 && (
        <div className="sidebar-groupby">
          <span className="sidebar-groupby-label">Grouper par</span>
          <div className="seg seg-mini">
            {groupBys.map(g => (
              <button key={g.key}
                className={groupBy === g.key ? 'is-on' : ''}
                onClick={() => setGroupBy(g.key)}>{g.label}</button>
            ))}
          </div>
        </div>
      )}

      <div className="sidebar-list">
        {groupKeys.map(key => (
          <div key={key} className="grp">
            <button className="grp-head" onClick={() => setCollapsed(o => ({ ...o, [key]: isOpen(key) }))}>
              <IcChevDn size={12} style={{ transform: isOpen(key) ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform .15s" }}/>
              <IcFolder size={14}/>
              <span>{key}</span>
              <span className="grp-count">{groups[key].length}</span>
            </button>
            {isOpen(key) && (
              <div className="grp-items">
                {groups[key].map(it => (
                  <button key={`${key}-${it.id}`}
                    className={`qitem${it.id === activeId ? " is-active" : ""}`}
                    onClick={() => onPick(it.id)}
                    title={`${it.id} — ${it.name}`}>
                    <div className="qitem-row">
                      <IcFile size={12}/>
                      <span className="qitem-name">{it.name}</span>
                      <StatusDot status={it.status}/>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {groupKeys.length === 0 && (
          <div className="sidebar-empty">Aucune requete ne correspond.</div>
        )}
      </div>

      <div className="sidebar-foot">
        <div className="user-chip">
          <div className="avatar">EO</div>
          <div>
            <div className="user-name">e.oswald</div>
            <div className="user-sub">devops · SOPROFEN</div>
          </div>
          <button className="icon-btn" title="Parametres"><IcSettings size={14}/></button>
        </div>
      </div>
    </aside>
  );
}

export function StatusDot({ status }) {
  const map = {
    clean:     { cls: "ok",  label: "synchro" },
    modified:  { cls: "wip", label: "modifiee" },
    "pr-open": { cls: "pr",  label: "PR ouverte" },
  };
  const m = map[status] || map.clean;
  return <span className={`sd sd-${m.cls}`} title={m.label}/>;
}
