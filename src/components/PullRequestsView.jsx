import React from 'react';
import { IcSearch, IcBranch, IcCheck, IcX, IcAlert, IcCommit } from './Icons';
import { PULL_REQUESTS } from '../data/mockData';

const STATE_LABEL = {
  'review':         { label: 'En revue',          cls: 'pr-state-review' },
  'checks-running': { label: 'Checks en cours',   cls: 'pr-state-running'},
  'checks-failed':  { label: 'Checks échoués',    cls: 'pr-state-failed' },
  'merged':         { label: 'Mergée',            cls: 'pr-state-merged' },
};

const FILTERS = [
  { key: 'open',   label: 'Ouvertes',  match: pr => pr.state !== 'merged' },
  { key: 'merged', label: 'Mergées',   match: pr => pr.state === 'merged' },
  { key: 'all',    label: 'Toutes',    match: () => true },
];

export function PullRequestsView() {
  const [filter, setFilter] = React.useState('open');
  const [q, setQ]           = React.useState("");
  const [selectedNum, setSel] = React.useState(PULL_REQUESTS[0]?.number ?? null);

  const filterFn = FILTERS.find(f => f.key === filter)?.match || (() => true);
  const filtered = PULL_REQUESTS
    .filter(filterFn)
    .filter(pr => !q
      || pr.title.toLowerCase().includes(q.toLowerCase())
      || pr.branch.toLowerCase().includes(q.toLowerCase())
      || pr.author.toLowerCase().includes(q.toLowerCase())
      || String(pr.number).includes(q)
    );

  const counts = FILTERS.reduce((acc, f) => {
    acc[f.key] = PULL_REQUESTS.filter(f.match).length;
    return acc;
  }, {});

  const selected = PULL_REQUESTS.find(p => p.number === selectedNum);

  return (
    <div className="pr-view">
      <aside className="pr-list">
        <div className="pr-list-head">
          <div className="pr-list-title">Pull Requests</div>
          <div className="pr-list-sub">SOPROFEN · pipeline TRN → PRD</div>
        </div>

        <div className="sidebar-source-tabs">
          {FILTERS.map(f => (
            <button key={f.key}
              className={`src-tab${filter === f.key ? ' is-on' : ''}`}
              onClick={() => setFilter(f.key)}>
              <span className="src-tab-label">{f.label}</span>
              <span className="src-tab-count">{counts[f.key]}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-search">
          <IcSearch size={14}/>
          <input
            placeholder="Rechercher PR, branche, auteur…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>

        <div className="pr-list-scroll">
          {filtered.map(pr => {
            const meta = STATE_LABEL[pr.state] || STATE_LABEL.review;
            return (
              <button key={pr.number}
                className={`pr-list-item${pr.number === selectedNum ? ' is-active' : ''}`}
                onClick={() => setSel(pr.number)}>
                <div className="pr-list-row">
                  <span className={`pr-state-dot ${meta.cls}`}/>
                  <span className="pr-list-num">#{pr.number}</span>
                  <span className="pr-list-author">{pr.author}</span>
                </div>
                <div className="pr-list-title">{pr.title}</div>
                <div className="pr-list-branch"><IcBranch size={10}/> {pr.branch}</div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="sidebar-empty">Aucune PR ne correspond.</div>
          )}
        </div>
      </aside>

      <div className="pr-pane">
        {selected ? <PullRequestDetail pr={selected}/> : <div className="wc-empty">Sélectionne une PR à gauche.</div>}
      </div>
    </div>
  );
}

function PullRequestDetail({ pr }) {
  const meta = STATE_LABEL[pr.state] || STATE_LABEL.review;
  return (
    <>
      <div className="modal-head">
        <div>
          <div className="modal-eyebrow">PR #{pr.number} · ouverte par {pr.author}</div>
          <div className="modal-title">{pr.title}</div>
          <div className="wc-subtitle">
            <IcBranch size={11}/> {pr.branch} → {pr.base} · {new Date(pr.createdAt).toLocaleString('fr-FR')}
          </div>
        </div>
        <span className={`pr-state-badge ${meta.cls}`}>{meta.label}</span>
      </div>

      <div className="modal-body">
        <div className="wc-block">
          <div className="wc-block-title">Description</div>
          <p className="pr-body">{pr.body}</p>
        </div>

        <div className="wc-block">
          <div className="wc-block-title">GitHub Actions ({pr.checks.length} checks)</div>
          <div className="pr-checks">
            {pr.checks.map(c => <CheckRow key={c.name} check={c}/>)}
          </div>
        </div>

        <div className="wc-block">
          <div className="wc-block-title">Fichiers modifiés ({pr.files.length})</div>
          <div className="pr-files">
            {pr.files.map(f => (
              <div key={f} className="pr-file"><IcCommit size={11}/> {f}</div>
            ))}
          </div>
        </div>

        <div className="wc-block">
          <div className="wc-block-title">Reviewers ({pr.reviewers.length})</div>
          <div className="chip-row">
            {pr.reviewers.map(r => <span key={r} className="chip chip-est">{r}</span>)}
          </div>
        </div>

        {pr.state !== 'merged' && (
          <div className="pr-actions">
            <button className="btn-ghost" disabled title="Backend requis">Approuver</button>
            <button className="btn btn-commit" disabled title="Backend requis">Merger vers main</button>
          </div>
        )}
      </div>
    </>
  );
}

function CheckRow({ check }) {
  let Icon, cls, label;
  if (check.conclusion === 'passed' || check.status === 'success') {
    Icon = IcCheck; cls = 'pr-check-ok';      label = 'Réussi';
  } else if (check.conclusion === 'failed') {
    Icon = IcX;     cls = 'pr-check-fail';    label = 'Échoué';
  } else if (check.status === 'running') {
    Icon = IcAlert; cls = 'pr-check-running'; label = 'En cours…';
  } else {
    Icon = IcAlert; cls = 'pr-check-wait';    label = 'En attente';
  }
  return (
    <div className={`pr-check ${cls}`}>
      <Icon size={12}/>
      <span className="pr-check-name">{check.name}</span>
      <span className="pr-check-status">{label}</span>
    </div>
  );
}
