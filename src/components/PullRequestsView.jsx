import React from 'react';
import { IcSearch, IcBranch, IcCheck, IcX, IcAlert, IcCommit } from './Icons';
import { fetchPullRequests, getPullRequestStatus } from '../api/github';

const STATE_LABEL = {
  'open':           { label: 'En revue',          cls: 'pr-state-review' },
  'review':         { label: 'En revue',          cls: 'pr-state-review' },
  'checks-running': { label: 'Checks en cours',   cls: 'pr-state-running'},
  'checks-failed':  { label: 'Checks échoués',    cls: 'pr-state-failed' },
  'merged':         { label: 'Mergée',            cls: 'pr-state-merged' },
  'closed':         { label: 'Fermée',            cls: 'pr-state-failed' },
};

const FILTERS = [
  { key: 'open',   label: 'Ouvertes',  match: pr => pr.state !== 'merged' && pr.state !== 'closed' },
  { key: 'merged', label: 'Mergées',   match: pr => pr.state === 'merged' },
  { key: 'all',    label: 'Toutes',    match: () => true },
];

export function PullRequestsView() {
  const [filter, setFilter] = React.useState('open');
  const [q, setQ]           = React.useState("");
  const [selectedNum, setSel] = React.useState(null);
  const [prs, setPrs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  // Lazy-loaded checks/details keyed by PR number — backend list endpoint is summary-only.
  const [details, setDetails] = React.useState({});

  React.useEffect(() => {
    setLoading(true);
    // The backend filters by state server-side, but to keep tab counts accurate
    // we fetch "all" once and filter client-side.
    fetchPullRequests('all')
      .then(list => {
        setPrs(list || []);
        if ((list || []).length > 0) setSel(list[0].number);
      })
      .catch(err => console.error('[API] fetchPullRequests failed:', err))
      .finally(() => setLoading(false));
  }, []);

  // Pull checks lazily when the user selects a PR.
  React.useEffect(() => {
    if (selectedNum == null) return;
    if (details[selectedNum]) return;
    getPullRequestStatus(selectedNum)
      .then(status => setDetails(d => ({ ...d, [selectedNum]: status })))
      .catch(err => console.error('[API] getPullRequestStatus failed:', err));
  }, [selectedNum, details]);

  const filterFn = FILTERS.find(f => f.key === filter)?.match || (() => true);
  const filtered = prs
    .filter(filterFn)
    .filter(pr => !q
      || (pr.title || '').toLowerCase().includes(q.toLowerCase())
      || (pr.branch || '').toLowerCase().includes(q.toLowerCase())
      || (pr.author || '').toLowerCase().includes(q.toLowerCase())
      || String(pr.number).includes(q)
    );

  const counts = FILTERS.reduce((acc, f) => {
    acc[f.key] = prs.filter(f.match).length;
    return acc;
  }, {});

  const selected = prs.find(p => p.number === selectedNum);

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
          {loading && (
            <div className="sidebar-empty">Chargement…</div>
          )}
          {!loading && filtered.map(pr => {
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
          {!loading && filtered.length === 0 && (
            <div className="sidebar-empty">Aucune PR ne correspond.</div>
          )}
        </div>
      </aside>

      <div className="pr-pane">
        {selected
          ? <PullRequestDetail pr={selected} detail={details[selected.number]}/>
          : <div className="wc-empty">{loading ? 'Chargement…' : 'Sélectionne une PR à gauche.'}</div>
        }
      </div>
    </div>
  );
}

function PullRequestDetail({ pr, detail }) {
  // The summary endpoint and the status endpoint each contribute different pieces.
  // Use whichever has data; fall back to "—" when neither does.
  const meta = STATE_LABEL[pr.state] || STATE_LABEL.review;
  const checks    = detail?.checks    || pr.checks    || [];
  const files     = pr.files                          || [];
  const reviewers = pr.reviewers                      || [];
  const body      = pr.body                           || '';
  const baseRef   = pr.base                           || 'main';
  const createdAt = pr.createdAt ? new Date(pr.createdAt) : null;
  const createdStr = createdAt && !Number.isNaN(createdAt.getTime())
    ? createdAt.toLocaleString('fr-FR')
    : '';
  const isMerged  = (detail?.merged) || pr.state === 'merged';

  return (
    <>
      <div className="modal-head">
        <div>
          <div className="modal-eyebrow">PR #{pr.number}{pr.author ? ` · ouverte par ${pr.author}` : ''}</div>
          <div className="modal-title">{pr.title}</div>
          <div className="wc-subtitle">
            <IcBranch size={11}/> {pr.branch} → {baseRef}{createdStr && ` · ${createdStr}`}
            {pr.url && <> · <a href={pr.url} target="_blank" rel="noreferrer">GitHub ↗</a></>}
          </div>
        </div>
        <span className={`pr-state-badge ${meta.cls}`}>{meta.label}</span>
      </div>

      <div className="modal-body">
        {body && (
          <div className="wc-block">
            <div className="wc-block-title">Description</div>
            <p className="pr-body">{body}</p>
          </div>
        )}

        <div className="wc-block">
          <div className="wc-block-title">GitHub Actions ({checks.length} check{checks.length > 1 ? 's' : ''})</div>
          <div className="pr-checks">
            {checks.length === 0 && (
              <div className="wc-empty">{detail ? 'Aucun check rapporté.' : 'Chargement des checks…'}</div>
            )}
            {checks.map(c => <CheckRow key={c.name} check={c}/>)}
          </div>
        </div>

        {files.length > 0 && (
          <div className="wc-block">
            <div className="wc-block-title">Fichiers modifiés ({files.length})</div>
            <div className="pr-files">
              {files.map(f => (
                <div key={f} className="pr-file"><IcCommit size={11}/> {f}</div>
              ))}
            </div>
          </div>
        )}

        {reviewers.length > 0 && (
          <div className="wc-block">
            <div className="wc-block-title">Reviewers ({reviewers.length})</div>
            <div className="chip-row">
              {reviewers.map(r => <span key={r} className="chip chip-est">{r}</span>)}
            </div>
          </div>
        )}

        {!isMerged && (
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
