import React from 'react';
import { IcFile, IcX, IcBranch, IcPlay, IcStop, IcCommit, IcPlus, IcCheck } from './Icons';

export function TopBar({ env, onEnv, running, onRun, onCommit, dirty, tabs, activeTab, onTab, onCloseTab, branch, branches, onBranchChange, onCreateBranch }) {
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
        <BranchChip
          branch={branch}
          branches={branches}
          onBranchChange={onBranchChange}
          onCreateBranch={onCreateBranch}
        />
        <EnvSwitch value={env} onChange={onEnv}/>
        <div className="topbar-sep"/>
        <button className={`btn btn-run${running ? " is-running" : ""}`} onClick={onRun} disabled={running}>
          {running ? <IcStop size={13}/> : <IcPlay size={13}/>}
          <span>{running ? "Execution…" : "Executer"}</span>
          <kbd>⌘↵</kbd>
        </button>
        <button className="btn btn-commit" onClick={onCommit} disabled={!dirty || branch === 'main'}>
          <IcCommit size={13}/>
          <span>Commit &amp; PR</span>
        </button>
      </div>
    </div>
  );
}

export function BranchChip({ branch, branches = [], onBranchChange, onCreateBranch }) {
  const [open, setOpen] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (creating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creating]);

  const handleCreate = () => {
    if (newName.trim()) {
      const branchName = 'feature/' + newName.trim().toLowerCase().replace(/\s+/g, '-');
      onCreateBranch?.(branchName);
      setNewName('');
      setCreating(false);
      setOpen(false);
    }
  };

  return (
    <div className="branch-chip-wrapper">
      <div className="branch-chip" onClick={() => setOpen(!open)}>
        <IcBranch size={12}/>
        <span>{branch}</span>
        {branch === 'main' && <span className="branch-warn">cree une branche pour commiter</span>}
      </div>

      {open && (
        <div className="branch-dropdown">
          <div className="branch-dropdown-head">Branches</div>

          {creating ? (
            <div className="branch-create-form">
              <span className="branch-prefix">feature/</span>
              <input
                ref={inputRef}
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="nom-de-branche"
              />
              <button onClick={handleCreate}><IcCheck size={12}/></button>
            </div>
          ) : (
            <button className="branch-item branch-new" onClick={() => setCreating(true)}>
              <IcPlus size={12}/> Nouvelle branche
            </button>
          )}

          <div className="branch-list">
            {branches.map(b => (
              <button
                key={b}
                className={`branch-item${b === branch ? ' is-active' : ''}`}
                onClick={() => { onBranchChange?.(b); setOpen(false); }}
              >
                <IcBranch size={11}/> {b}
                {b === branch && <IcCheck size={11}/>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function EnvSwitch({ value, onChange }) {
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
