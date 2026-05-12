import { IcX } from './Icons';
import { StatusDot } from './Sidebar';

const REQ_PALETTE = [
  'oklch(0.78 0.14 75)',    // amber
  'oklch(0.72 0.12 230)',   // blue
  'oklch(0.72 0.15 150)',   // green
  'oklch(0.78 0.16 290)',   // purple
  'oklch(0.68 0.18 25)',    // red-orange
  'oklch(0.78 0.15 50)',    // orange
];
const colorForRequest = (rid, list) => REQ_PALETTE[list.indexOf(rid) % REQ_PALETTE.length];

// Reusable inner content — used both by the modal and by the WorkCenter browser pane.
export function WorkCenterCard({ workCenter, queries, onPickQuery, onClose }) {
  const related   = queries.filter(q => q.workCenterId === workCenter.id);
  const psEntries = related.filter(q => q.source === 'production_screen');
  const cuEntries = related.filter(q => q.source === 'cu_parameter');

  const sortedPs   = [...psEntries].sort((a, b) => a.attributeModel.localeCompare(b.attributeModel));
  const requestIds = [...new Set(sortedPs.map(e => e.requestId))].sort((a, b) => a - b);
  const reqUses    = Object.fromEntries(requestIds.map(rid => [rid, sortedPs.filter(e => e.requestId === rid).length]));
  const sharedReqs = requestIds.filter(rid => reqUses[rid] > 1).length;

  return (
    <>
      <div className="modal-head">
        <div>
          <div className="modal-eyebrow">WorkCenter · {workCenter.establishment}</div>
          <div className="modal-title">{workCenter.name}</div>
          <div className="wc-subtitle">{workCenter.title} · Id {workCenter.id}</div>
        </div>
        {onClose && <button className="icon-btn" onClick={onClose}><IcX size={14}/></button>}
      </div>

      <div className="wc-summary">
        <span><b>{psEntries.length}</b> modèles configurés</span>
        <span className="wc-sep">·</span>
        <span><b>{requestIds.length}</b> Request{requestIds.length > 1 ? 's' : ''}</span>
        {sharedReqs > 0 && (
          <>
            <span className="wc-sep">·</span>
            <span className="wc-summary-shared">⇆ {sharedReqs} SQL partagé{sharedReqs > 1 ? 's' : ''}</span>
          </>
        )}
        <span className="wc-sep">·</span>
        <span><b>{cuEntries.length}</b> CUParameter</span>
      </div>

      <div className="modal-body">
        {sortedPs.length > 0 && (
          <div className="wc-block">
            <div className="wc-block-title">ProductionScreen — un AttributeModel par ligne</div>
            <table className="wc-table">
              <thead>
                <tr>
                  <th>AttributeModel</th>
                  <th>Request</th>
                  <th>Branche</th>
                  <th>Auteur</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sortedPs.map(e => {
                  const color  = colorForRequest(e.requestId, requestIds);
                  const shared = reqUses[e.requestId] > 1;
                  return (
                    <tr key={e.id}
                      className="wc-trow"
                      style={{ '--req-color': color }}
                      onClick={() => onPickQuery(e.id)}>
                      <td><span className="chip chip-am">{e.attributeModel}</span></td>
                      <td>
                        <span className="wc-req" style={{ color }}>#{e.requestId}</span>
                        {shared && <span className="wc-shared-mark" title="SQL partagé">⇆</span>}
                      </td>
                      <td className="wc-cell-mono">{e.branch}</td>
                      <td className="wc-cell-soft">{e.author}</td>
                      <td><StatusDot status={e.status}/></td>
                      <td className="wc-cell-arrow">→</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sharedReqs > 0 && (
              <div className="wc-legend">
                <span className="wc-legend-mark">⇆</span>
                <span>Lignes partageant la même couleur = même Request = même SQL</span>
              </div>
            )}
          </div>
        )}

        {cuEntries.length > 0 && (
          <div className="wc-block">
            <div className="wc-block-title">CUParameter — Request unique pour ce poste</div>
            {cuEntries.map(e => (
              <button key={e.id} className="wc-cu-card" onClick={() => onPickQuery(e.id)}>
                <div className="wc-cu-main">
                  <div className="wc-cu-name">{e.name}</div>
                  <div className="wc-cu-id">{e.id}</div>
                </div>
                <span className="wc-cell-mono">{e.branch}</span>
                <StatusDot status={e.status}/>
                <span className="wc-cell-arrow">→</span>
              </button>
            ))}
          </div>
        )}

        {sortedPs.length === 0 && cuEntries.length === 0 && (
          <div className="wc-empty">Aucune requete n'utilise ce WorkCenter.</div>
        )}
      </div>
    </>
  );
}

// Modal wrapper — clicked from a chip in the editor head.
export function WorkCenterDetail({ workCenter, queries, onClose, onPickQuery }) {
  if (!workCenter) return null;
  const handlePick = (id) => { onPickQuery(id); onClose(); };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wc" onClick={e => e.stopPropagation()}>
        <WorkCenterCard
          workCenter={workCenter}
          queries={queries}
          onPickQuery={handlePick}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
