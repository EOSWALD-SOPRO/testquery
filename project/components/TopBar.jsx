// Top chrome: tabs, environment switch, primary actions
function TopBar({ env, onEnv, running, onRun, onCommit, dirty, tabs, activeTab, onTab, onCloseTab, branch }) {
  return (
    <div className="topbar">
      <div className="tabs">
        {tabs.map(t => (
          <div key={t.id}
               className={`tab${t.id === activeTab ? " is-active" : ""}`}
               onClick={() => onTab(t.id)}>
            <IcFile size={12}/>
            <span className="tab-name">{t.name}</span>
            {t.dirty && <span className="tab-dot"/>}
            <button className="tab-x" onClick={e => { e.stopPropagation(); onCloseTab(t.id); }}><IcX size={11}/></button>
          </div>
        ))}
      </div>

      <div className="topbar-right">
        <BranchChip branch={branch}/>
        <EnvSwitch value={env} onChange={onEnv}/>
        <div className="topbar-sep"/>
        <button className={`btn btn-run${running ? " is-running" : ""}`} onClick={onRun} disabled={running}>
          {running ? <IcStop size={13}/> : <IcPlay size={13}/>}
          <span>{running ? "Exécution…" : "Exécuter"}</span>
          <kbd>⌘↵</kbd>
        </button>
        <button className="btn btn-commit" onClick={onCommit} disabled={!dirty}>
          <IcCommit size={13}/>
          <span>Commit &amp; PR</span>
        </button>
      </div>
    </div>
  );
}

function BranchChip({ branch }) {
  return (
    <div className="branch-chip">
      <IcBranch size={12}/>
      <span>{branch}</span>
    </div>
  );
}

function EnvSwitch({ value, onChange }) {
  return (
    <div className={`env env-${value.toLowerCase()}`}>
      <span className="env-label">env</span>
      <div className="env-seg">
        <button className={value === "TRN" ? "is-on" : ""} onClick={() => onChange("TRN")}>
          <span className="env-dot env-dot-trn"/> TRN
        </button>
        <button className={value === "PRD" ? "is-on" : ""} onClick={() => onChange("PRD")}>
          <span className="env-dot env-dot-prd"/> PRD
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { TopBar, EnvSwitch, BranchChip });
