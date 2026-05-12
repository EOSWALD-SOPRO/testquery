import React from 'react';
import { Sidebar }      from './components/Sidebar';
import { TopBar }       from './components/TopBar';
import { SqlEditor }    from './components/SqlEditor';
import { BottomPanel }  from './components/BottomPanel';
import { CommitDialog } from './components/CommitDialog';
import { TweaksPanel }  from './components/TweaksPanel';
import { WorkCenterDetail } from './components/WorkCenterDetail';
import { WorkCenterBrowser } from './components/WorkCenterBrowser';
import { PullRequestsView } from './components/PullRequestsView';
import { AdminView } from './components/AdminPanel';
import { ActivityBar } from './components/ActivityBar';
import { IcSpark } from './components/Icons';
import { executeQuery, fetchQueries, fetchWorkCenters, fetchAttributeModels } from './api/queries';
import { getBranches, createBranch, checkoutBranch, getCommitHistory } from './api/github';

// Map a backend CommitInfo (Hash/ShortHash/Message/Author/Date) to the shape
// BottomPanel expects ({ hash, msg, when, branch }). The backend has no
// branch-per-commit notion in the simple history listing, so we leave it blank
// and let the UI fall back gracefully.
function commitToHistoryItem(c) {
  const iso = c.date || c.Date;
  let when = '';
  if (iso) {
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) {
      const diffMs = Date.now() - d.getTime();
      const min = Math.round(diffMs / 60000);
      if (min < 1)         when = "a l'instant";
      else if (min < 60)   when = `il y a ${min} min`;
      else if (min < 1440) when = `il y a ${Math.round(min / 60)} h`;
      else                 when = d.toLocaleDateString('fr-FR');
    }
  }
  return {
    hash:   c.shortHash || c.ShortHash || (c.hash || c.Hash || '').slice(0, 7),
    msg:    c.message   || c.Message   || '',
    author: c.author    || c.Author    || '',
    when,
    branch: '',
  };
}

export default function App() {
  const [tweaks, setTweaks] = React.useState({
    theme: "dark", accent: "amber", density: "cozy", layout: "split",
  });
  const setTweak = (k, v) => setTweaks(t => ({ ...t, [k]: v }));
  const [tweaksOpen, setTweaksOpen] = React.useState(false);

  // Sync theme + accent onto <html>
  React.useEffect(() => {
    const html = document.documentElement;
    html.dataset.theme  = tweaks.theme;
    html.dataset.accent = tweaks.accent;
  }, [tweaks.theme, tweaks.accent]);

  // Queries from API
  const [queries, setQueries] = React.useState([]);
  const [queriesLoading, setQueriesLoading] = React.useState(true);

  React.useEffect(() => {
    fetchQueries()
      .then(data => {
        setQueries(data);
        setQueriesLoading(false);
      })
      .catch(err => {
        console.error('[API] fetchQueries failed:', err);
        setQueriesLoading(false);
      });
  }, []);

  // Catalogs (WorkCenters + AttributeModels) — loaded once and propagated to children.
  const [workCenters, setWorkCenters] = React.useState([]);
  const [attributeModels, setAttributeModels] = React.useState([]);

  React.useEffect(() => {
    fetchWorkCenters()
      .then(setWorkCenters)
      .catch(err => console.error('[API] fetchWorkCenters failed:', err));
    fetchAttributeModels()
      .then(setAttributeModels)
      .catch(err => console.error('[API] fetchAttributeModels failed:', err));
  }, []);

  // Local-repo commit history (BottomPanel "Historique" tab).
  const [history, setHistory] = React.useState([]);
  React.useEffect(() => {
    getCommitHistory(20)
      .then(list => setHistory((list || []).map(commitToHistoryItem)))
      .catch(err => console.error('[API] getCommitHistory failed:', err));
  }, []);

  // Branches from API — single source of truth is the backend's local git repo
  const [currentBranch, setCurrentBranch] = React.useState('main');
  const [branches, setBranches] = React.useState(['main']);

  const refreshBranches = React.useCallback(async () => {
    try {
      const data = await getBranches();
      setCurrentBranch(data.current || 'main');
      setBranches(data.branches || ['main']);
    } catch (err) {
      console.error('[API] getBranches failed:', err);
    }
  }, []);

  React.useEffect(() => { refreshBranches(); }, [refreshBranches]);

  const handleCreateBranch = async (name) => {
    try {
      await createBranch(name);
      await refreshBranches();
    } catch (err) {
      console.error('[API] createBranch failed:', err);
      alert(`Erreur lors de la creation de la branche: ${err.message || err}`);
    }
  };

  const handleBranchChange = async (name) => {
    if (name === currentBranch) return;
    try {
      await checkoutBranch(name);
      await refreshBranches();
    } catch (err) {
      console.error('[API] checkoutBranch failed:', err);
      alert(`Impossible de basculer sur '${name}': ${err.message || err}`);
    }
  };

  // App state
  const [env,     setEnv]     = React.useState("TRN");
  const [running, setRunning] = React.useState(false);
  // Default to 50 rows. This tool is for debugging production queries, and real-world
  // queries are scoped by program or OF — so a typical run returns at most a few dozen
  // rows. The table isn't virtualized either: 2000+ rows already lag noticeably.
  // 50 covers the normal case and the higher presets exist only for exploratory checks
  // (or to spot when a filter is missing because the result hits the ceiling).
  const [rowLimit, setRowLimit] = React.useState(50);
  const [result,  setResult]  = React.useState({
    columns: [],
    rows: [],
    took: 0,
    plan: "",
    truncated: false,
    appliedLimit: null,
  });
  const [view,   setView]   = React.useState("results");
  const [prOpen, setPrOpen] = React.useState(false);

  // Tabs
  const [tabs, setTabs] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState(null);
  const activeQueryMeta = queries.find(q => q.id === activeTab) || queries[0] || { id: '', name: '', branch: 'main', source: '', attributeModel: null, workCenterId: null, requestId: null };

  // Top-level navigation: editor / admin (extensible to wc-browser etc. later)
  const [mode, setMode] = React.useState('editor');

  // WorkCenter detail modal (still triggered contextually from a chip click)
  const [selectedWc, setSelectedWc] = React.useState(null);
  const wcById = React.useMemo(
    () => Object.fromEntries(workCenters.map(w => [w.id, w])),
    [workCenters]
  );
  const activeWc = activeQueryMeta.workCenterId ? wcById[activeQueryMeta.workCenterId] : null;

  // Editor buffers (one per tab)
  const [buffers, setBuffers] = React.useState({});
  const [baselines, setBaselines] = React.useState({});

  // Initialize first tab when queries load
  React.useEffect(() => {
    if (queries.length > 0 && tabs.length === 0) {
      const first = queries[0];
      setTabs([{ id: first.id, name: first.name, dirty: false, branch: first.branch }]);
      setActiveTab(first.id);
      setBuffers({ [first.id]: first.sql || `-- ${first.name}\nSELECT 1;` });
      setBaselines({ [first.id]: first.sql || '' });
    }
  }, [queries, tabs.length]);
  const code    = buffers[activeTab] || "";
  const setCode = (v) => setBuffers(b => ({ ...b, [activeTab]: v }));
  const dirty   = code !== (baselines[activeTab] || "");

  // Sidebar: open or add a tab
  const pick = (id) => {
    if (!tabs.some(t => t.id === id)) {
      const meta = queries.find(q => q.id === id);
      if (meta) {
        setTabs(t => [...t, { id, name: meta.name, dirty: false, branch: meta.branch }]);
        if (!buffers[id]) {
          setBuffers(b => ({ ...b, [id]: meta.sql || `-- ${meta.name}\nSELECT 1;` }));
          setBaselines(bl => ({ ...bl, [id]: meta.sql || '' }));
        }
      }
    }
    setActiveTab(id);
  };

  const closeTab = (id) => {
    const idx  = tabs.findIndex(t => t.id === id);
    const next = tabs.filter(t => t.id !== id);
    setTabs(next);
    if (activeTab === id && next.length) setActiveTab(next[Math.max(0, idx - 1)].id);
  };

  const onNew = () => {
    const id = "new-" + Date.now();
    setTabs(t => [...t, { id, name: "nouvelle_requete.sql", dirty: true, branch: "feature/new" }]);
    setBuffers(b => ({ ...b, [id]: "-- Nouvelle requete\nSELECT " }));
    setActiveTab(id);
  };

  // Execute query via API
  const run = React.useCallback(async () => {
    setRunning(true);
    setView(v => (v !== "results" ? v : "results"));
    try {
      const data = await executeQuery(code, env, rowLimit);
      setResult(data);
    } catch (err) {
      console.error('[API] executeQuery failed:', err);
    } finally {
      setRunning(false);
    }
  }, [code, env, rowLimit]);

  // Keyboard shortcut ⌘↵ / Ctrl+↵
  React.useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); run(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [run]);

  return (
    <div className={`app app-mode-${mode}`} data-layout={tweaks.layout} data-density={tweaks.density}>
      <ActivityBar mode={mode} onModeChange={setMode}/>

      {mode === 'admin' && (
        <div className="main">
          <AdminView
            queries={queries}
            workCenters={workCenters}
            attributeModels={attributeModels}
          />
        </div>
      )}

      {mode === 'workcenters' && (
        <div className="main">
          <WorkCenterBrowser
            queries={queries}
            workCenters={workCenters}
            onPickQuery={(id) => { pick(id); setMode('editor'); }}
          />
        </div>
      )}

      {mode === 'prs' && (
        <div className="main"><PullRequestsView/></div>
      )}

      {mode === 'editor' && <>
      <Sidebar queries={queries} activeId={activeTab} onPick={pick} onNew={onNew} loading={queriesLoading}/>

      <div className="main">
        <TopBar
          env={env} onEnv={setEnv}
          rowLimit={rowLimit} onRowLimit={setRowLimit}
          running={running} onRun={run}
          onCommit={() => setPrOpen(true)}
          dirty={dirty}
          tabs={tabs.map(t => ({ ...t, dirty: t.id === activeTab ? dirty : t.dirty }))}
          activeTab={activeTab} onTab={setActiveTab} onCloseTab={closeTab}
          branch={currentBranch}
          branches={branches}
          onBranchChange={handleBranchChange}
          onCreateBranch={handleCreateBranch}
        />

        <div className="workspace">
          <div className="editor-panel">
            <div className="editor-head">
              <span className={`editor-source editor-source-${activeQueryMeta.source}`}>
                {activeQueryMeta.source === 'cu_parameter' ? 'CUParameter' : 'ProductionScreen'}
              </span>
              <span className="editor-head-name">{activeQueryMeta.name}</span>
              <span className="editor-head-id">{activeQueryMeta.id}</span>
              {dirty && <span className="editor-badge editor-badge-mod">modifiee</span>}
              <span className="editor-head-fill"/>
              <span className="editor-head-meta">{code.split("\n").length} lignes · {code.length} car.</span>
            </div>
            <div className="editor-tags">
              <div className="editor-tag-row">
                {activeQueryMeta.requestId != null && (
                  <span className="editor-tag-pair">
                    <span className="editor-tag-label">Request</span>
                    <span className="chip chip-req">#{activeQueryMeta.requestId}</span>
                  </span>
                )}
                {activeQueryMeta.attributeModel && (
                  <span className="editor-tag-pair">
                    <span className="editor-tag-label">Modèle</span>
                    <span className="chip chip-am">{activeQueryMeta.attributeModel}</span>
                  </span>
                )}
                {activeWc && (
                  <span className="editor-tag-pair">
                    <span className="editor-tag-label">Poste</span>
                    <button className="chip chip-wc" onClick={() => setSelectedWc(activeWc)} title={`${activeWc.title} · ${activeWc.establishment}`}>
                      {activeWc.name}
                    </button>
                    <span className="editor-tag-soft">{activeWc.establishment}</span>
                  </span>
                )}
              </div>
            </div>
            <SqlEditor value={code} onChange={setCode}/>
          </div>

          <BottomPanel
            result={result}
            env={env}
            query={code}
            history={history}
            view={view}
            onView={setView}
          />
        </div>
      </div>
      </>}

      <WorkCenterDetail
        workCenter={selectedWc}
        queries={queries}
        onClose={() => setSelectedWc(null)}
        onPickQuery={pick}
      />

      <CommitDialog
        open={prOpen}
        onClose={() => setPrOpen(false)}
        query={code}
        baseQuery={baselines[activeTab] || ""}
        branch={currentBranch}
        queryId={activeTab}
      />

      {!tweaksOpen && (
        <button className="tweak-toggle" onClick={() => setTweaksOpen(true)}>
          <IcSpark size={12}/> Tweaks
        </button>
      )}
      <TweaksPanel open={tweaksOpen} onClose={() => setTweaksOpen(false)} tweaks={tweaks} setTweak={setTweak}/>
    </div>
  );
}
