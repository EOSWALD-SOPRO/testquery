import React from 'react';
import { IcPlus } from './Icons';

const TABS = [
  { key: 'workcenters', label: 'WorkCenters'      },
  { key: 'screens',     label: 'ProductionScreen' },
  { key: 'attrmodels',  label: 'AttributeModels'  },
];

const STUB_TOAST = "Édition non disponible — branche un backend pour activer la sauvegarde.";

// Inline admin view (rendered as a full panel inside .main, not a modal).
export function AdminView({ queries, workCenters = [], attributeModels = [] }) {
  const [tab, setTab] = React.useState('workcenters');
  const [toast, setToast] = React.useState(null);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const fireStub = () => setToast(STUB_TOAST);

  return (
    <div className="admin-view">
      <header className="admin-view-head">
        <div>
          <div className="admin-view-eyebrow">Administration</div>
          <h1 className="admin-view-title">Gestion des tables</h1>
          <p className="admin-view-sub">
            Édition WorkCenter, ProductionScreen, AttributeModel — prototype d'écran (no-op tant qu'il n'y a pas de backend).
          </p>
        </div>
      </header>

      <div className="admin-tabs">
        {TABS.map(t => (
          <button key={t.key}
            className={`admin-tab${tab === t.key ? ' is-on' : ''}`}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div className="admin-body">
        {tab === 'workcenters' && <WorkCentersTab workCenters={workCenters} onAction={fireStub}/>}
        {tab === 'screens'     && <ScreensTab queries={queries} onAction={fireStub}/>}
        {tab === 'attrmodels'  && <AttrModelsTab attributeModels={attributeModels} onAction={fireStub}/>}
      </div>

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}

function WorkCentersTab({ workCenters, onAction }) {
  const ests = [...new Set(workCenters.map(w => w.establishment))].sort();
  return (
    <>
      <div className="admin-toolbar">
        <span className="admin-count">{workCenters.length} postes · {ests.length} établissements</span>
        <button className="btn btn-ghost" onClick={onAction}><IcPlus size={12}/> Nouveau WorkCenter</button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Title</th>
            <th>Établissement</th>
            <th>Hidden</th>
            <th>Packaging</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {workCenters.map(w => (
            <tr key={w.id}>
              <td className="cell-mono">{w.id}</td>
              <td className="cell-mono cell-strong">{w.name}</td>
              <td>{w.title}</td>
              <td><span className="chip chip-est">{w.establishment}</span></td>
              <td><BitToggle value={false} onChange={onAction}/></td>
              <td><BitToggle value={false} onChange={onAction}/></td>
              <td><button className="row-action" onClick={onAction}>Éditer</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function ScreensTab({ queries, onAction }) {
  const psEntries = queries.filter(q => q.source === 'production_screen');
  return (
    <>
      <div className="admin-toolbar">
        <span className="admin-count">{psEntries.length} entrées dbo.ProductionScreen</span>
        <button className="btn btn-ghost" onClick={onAction}><IcPlus size={12}/> Nouvelle entrée</button>
      </div>
      <p className="admin-hint">Chaque ligne = un mapping <code>(RequestId, WorkCenter, AttributeModel)</code> avec ses 3 paramètres bool.</p>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Request</th>
            <th>WorkCenter</th>
            <th>AttributeModel</th>
            <th title="dbo.ProductionScreen.ShouldUseComponent">UseComponent</th>
            <th title="dbo.ProductionScreen.IsReadonly">Readonly</th>
            <th title="dbo.ProductionScreen.UseColumnSelection">ColumnSelection</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {psEntries.map(e => (
            <tr key={e.id}>
              <td className="cell-mono cell-strong">#{e.requestId}</td>
              <td className="cell-mono">{e.workCenter}</td>
              <td><span className="chip chip-am">{e.attributeModel}</span></td>
              <td><BitToggle value={e.shouldUseComponent} onChange={onAction}/></td>
              <td><BitToggle value={e.isReadonly}         onChange={onAction}/></td>
              <td><BitToggle value={e.useColumnSelection} onChange={onAction}/></td>
              <td><button className="row-action" onClick={onAction}>Éditer</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function AttrModelsTab({ attributeModels, onAction }) {
  return (
    <>
      <div className="admin-toolbar">
        <span className="admin-count">{attributeModels.length} modèles d'attribut</span>
        <button className="btn btn-ghost" onClick={onAction}><IcPlus size={12}/> Nouveau modèle</button>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
            <th>Title</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {attributeModels.map(am => (
            <tr key={am.name}>
              <td className="cell-mono">{am.id}</td>
              <td className="cell-mono cell-strong">{am.name}</td>
              <td>{am.title}</td>
              <td><button className="row-action" onClick={onAction}>Éditer</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function BitToggle({ value, onChange }) {
  return (
    <button
      className={`bit-toggle${value ? ' is-on' : ''}`}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      title={value ? 'true' : 'false'}>
      <span className="bit-knob"/>
    </button>
  );
}
