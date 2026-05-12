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
import { HISTORY, WORKCENTERS } from './data/mockData';
import { executeQuery, fetchQueries } from './api/queries';
import { getBranches, createBranch, checkoutBranch } from './api/github';

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
  const [result,  setResult]  = React.useState({
    columns: [],
    rows: [],
    took: 0,
    plan: "",
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
  const wcById = React.useMemo(() => Object.fromEntries(WORKCENTERS.map(w => [w.id, w])), []);
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
      const data = await executeQuery(code, env);
      setResult(data);
    } catch (err) {
      console.error('[API] executeQuery failed:', err);
    } finally {
      setRunning(false);
    }
  }, [code, env]);

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
        <div className="main"><AdminView queries={queries}/></div>
      )}

      {mode === 'workcenters' && (
        <div className="main">
          <WorkCenterBrowser
            queries={queries}
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
            history={HISTORY}
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
