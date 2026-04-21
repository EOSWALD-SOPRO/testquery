import React from 'react';
import { Sidebar }      from './components/Sidebar';
import { TopBar }       from './components/TopBar';
import { SqlEditor }    from './components/SqlEditor';
import { BottomPanel }  from './components/BottomPanel';
import { CommitDialog } from './components/CommitDialog';
import { TweaksPanel }  from './components/TweaksPanel';
import { IcSpark, IcFolder, IcChevron } from './components/Icons';
import { QUERIES, DEFAULT_QUERY, RESULT_COLUMNS, RESULT_ROWS, HISTORY } from './data/mockData';
import { executeQuery } from './api/queries';

export default function App() {
  const [tweaks, setTweaks] = React.useState({
    theme: "dark", accent: "amber", density: "cozy",
    preview: true, resultStyle: "table", layout: "split",
  });
  const setTweak = (k, v) => setTweaks(t => ({ ...t, [k]: v }));
  const [tweaksOpen, setTweaksOpen] = React.useState(false);

  // Sync theme + accent onto <html>
  React.useEffect(() => {
    const html = document.documentElement;
    html.dataset.theme  = tweaks.theme;
    html.dataset.accent = tweaks.accent;
  }, [tweaks.theme, tweaks.accent]);

  // App state
  const [env,     setEnv]     = React.useState("TRN");
  const [running, setRunning] = React.useState(false);
  const [result,  setResult]  = React.useState({
    columns: RESULT_COLUMNS,
    rows: RESULT_ROWS,
    took: 46,
    plan: "Clustered Index Seek + Hash Match Join",
  });
  const [view,   setView]   = React.useState("preview");
  const [prOpen, setPrOpen] = React.useState(false);

  // Tabs
  const [tabs, setTabs] = React.useState([
    { id: "q1", name: "operations_assemblage.sql", dirty: true,  branch: "feature/vr-ops-v3" },
    { id: "q5", name: "operations_panneaux.sql",   dirty: false, branch: "fix/pg-order-116"  },
  ]);
  const [activeTab, setActiveTab] = React.useState("q1");
  const activeQueryMeta = QUERIES.find(q => q.id === activeTab) || QUERIES[0];

  // Editor buffers (one per tab)
  const [buffers, setBuffers] = React.useState({
    q1: DEFAULT_QUERY,
    q5: `-- Operations panneaux portes de garage
SELECT
    op.num_ordre,
    op.sequence,
    op.libelle,
    art.ref_article,
    art.dimensions
FROM   production.ordres_fabrication op
JOIN   articles art ON art.id_article = op.id_article
WHERE  op.famille_produit = 'PG'
  AND  op.statut = 'PLANIFIE'
ORDER  BY op.num_ordre, op.sequence;`,
  });

  const [baselines] = React.useState({ q1: DEFAULT_QUERY, q5: buffers.q5 });
  const code    = buffers[activeTab] || "";
  const setCode = (v) => setBuffers(b => ({ ...b, [activeTab]: v }));
  const dirty   = code !== (baselines[activeTab] || "");

  // Sidebar: open or add a tab
  const pick = (id) => {
    if (!tabs.some(t => t.id === id)) {
      const meta = QUERIES.find(q => q.id === id);
      if (meta) {
        setTabs(t => [...t, { id, name: meta.name, dirty: false, branch: meta.branch }]);
        if (!buffers[id]) setBuffers(b => ({ ...b, [id]: `-- ${meta.name}\nSELECT 1;` }));
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
    <div className="app" data-layout={tweaks.layout} data-density={tweaks.density}>
      <Sidebar queries={QUERIES} activeId={activeTab} onPick={pick} onNew={onNew}/>

      <div className="main">
        <TopBar
          env={env} onEnv={setEnv}
          running={running} onRun={run}
          onCommit={() => setPrOpen(true)}
          dirty={dirty}
          tabs={tabs.map(t => ({ ...t, dirty: t.id === activeTab ? dirty : t.dirty }))}
          activeTab={activeTab} onTab={setActiveTab} onCloseTab={closeTab}
          branch={activeQueryMeta.branch}
        />

        <div className="workspace">
          <div className="editor-panel">
            <div className="editor-head">
              <span className="editor-head-path">
                <IcFolder size={11}/>
                <b>sql/{activeQueryMeta.folder.toLowerCase().replace(/\s+/g, "-")}</b>
                <IcChevron size={10}/>
                <span>{activeQueryMeta.name}</span>
              </span>
              {dirty && <span className="editor-badge editor-badge-mod">modifiee</span>}
              <span className="editor-head-fill"/>
              <span>{code.split("\n").length} lignes · {code.length} car.</span>
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

      <CommitDialog
        open={prOpen}
        onClose={() => setPrOpen(false)}
        query={code}
        baseQuery={baselines[activeTab] || ""}
        branch={activeQueryMeta.branch}
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
