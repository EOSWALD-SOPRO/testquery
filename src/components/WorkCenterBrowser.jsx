import React from 'react';
import { IcSearch, IcFolder } from './Icons';
import { WORKCENTERS } from '../data/mockData';
import { WorkCenterCard } from './WorkCenterDetail';

export function WorkCenterBrowser({ queries, onPickQuery }) {
  const [q, setQ]            = React.useState("");
  const [selectedId, setSel] = React.useState(WORKCENTERS[0]?.id ?? null);

  const filtered = WORKCENTERS.filter(w =>
    !q
    || w.name.toLowerCase().includes(q.toLowerCase())
    || w.title.toLowerCase().includes(q.toLowerCase())
    || w.establishment.toLowerCase().includes(q.toLowerCase())
    || String(w.id).includes(q)
  );

  // Group by establishment
  const groups = {};
  filtered.forEach(w => { (groups[w.establishment] ||= []).push(w); });
  const groupKeys = Object.keys(groups).sort();

  // PS+CU count per WC for the small badge in the list
  const usageById = React.useMemo(() => {
    const map = {};
    queries.forEach(q => { map[q.workCenterId] = (map[q.workCenterId] || 0) + 1; });
    return map;
  }, [queries]);

  const selected = WORKCENTERS.find(w => w.id === selectedId);

  return (
    <div className="wc-browser">
      <aside className="wc-browser-list">
        <div className="wc-browser-head">
          <div className="wc-browser-title">Postes de charge</div>
          <div className="wc-browser-sub">{WORKCENTERS.length} postes · {Object.keys(usageById).length} avec requêtes</div>
        </div>
        <div className="sidebar-search">
          <IcSearch size={14}/>
          <input
            placeholder="Rechercher un poste, établissement…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <div className="wc-browser-scroll">
          {groupKeys.map(key => (
            <div key={key} className="grp">
              <div className="grp-head" style={{ cursor: 'default' }}>
                <IcFolder size={14}/>
                <span>{key}</span>
                <span className="grp-count">{groups[key].length}</span>
              </div>
              <div className="grp-items">
                {groups[key].map(w => (
                  <button key={w.id}
                    className={`wc-browser-item${w.id === selectedId ? ' is-active' : ''}`}
                    onClick={() => setSel(w.id)}>
                    <div className="wc-browser-item-main">
                      <div className="wc-browser-item-name">{w.name}</div>
                      <div className="wc-browser-item-title">{w.title}</div>
                    </div>
                    {usageById[w.id] > 0 && (
                      <span className="wc-browser-item-count">{usageById[w.id]}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {groupKeys.length === 0 && (
            <div className="sidebar-empty">Aucun poste ne correspond.</div>
          )}
        </div>
      </aside>

      <div className="wc-browser-pane">
        {selected ? (
          <WorkCenterCard
            workCenter={selected}
            queries={queries}
            onPickQuery={onPickQuery}
          />
        ) : (
          <div className="wc-empty">Sélectionne un poste à gauche.</div>
        )}
      </div>
    </div>
  );
}
