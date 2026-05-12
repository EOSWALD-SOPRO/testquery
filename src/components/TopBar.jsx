import React from 'react';
import { IcFile, IcX, IcBranch, IcPlay, IcStop, IcCommit, IcPlus, IcCheck, IcAlert, IcChevDn } from './Icons';

export function TopBar({ env, onEnv, rowLimit, onRowLimit, running, onRun, onCommit, dirty, tabs, activeTab, onTab, onCloseTab, branch, branches, onBranchChange, onCreateBranch }) {
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
        <LimitSelector value={rowLimit} onChange={onRowLimit}/>
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

// Preset row-limit choices exposed in the TopBar.
//
// Sizing rationale: this is a debug tool for production queries that are normally
// scoped by program or OF (= a few dozen rows). 50 is the typical real-world ceiling,
// so it's the default. The bigger presets exist for two reasons:
//   - spot-check a query without a filter (still bounded so the browser survives),
//   - detect a missing filter — if a result hits 250/500, you forgot a WHERE.
//
// `risk` levels:
//   "soft" (250) — bigger than you'd expect, filter probably missing,
//   "hard" (500) — definitely missing a filter; the non-virtualized table starts to lag.
//
// There is deliberately no "unlimited" option: real-world tests showed 2000+ rows
// already make the page sluggish, and a runaway SELECT can return tens of thousands
// of rows. Filter your query upstream — that's what this tool is here to help with.
const LIMIT_OPTIONS = [
  { value:  25, label:  "25", risk: null   },
  { value:  50, label:  "50", risk: null   },
  { value: 100, label: "100", risk: null   },
  { value: 250, label: "250", risk: "null" },
  { value: 500, label: "500", risk: "soft" },
];

export function LimitSelector({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  // Close on outside click — cheap implementation, no library.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Fallback to "50" (index 1) when an unknown value is passed — matches the default
  // set in App.jsx so the UI shows a coherent state instead of an unrelated preset.
  const current = LIMIT_OPTIONS.find(o => o.value === value) || LIMIT_OPTIONS[1];

  return (
    <div className="limit-wrapper" ref={ref}>
      <button
        className={`limit-chip${current.risk ? ` limit-risk-${current.risk}` : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Nombre maximum de lignes a recuperer"
      >
        <span className="limit-label">limite</span>
        <span className="limit-value">{current.label}</span>
        {current.risk && <IcAlert size={11}/>}
        <IcChevDn size={11}/>
      </button>

      {open && (
        <div className="limit-dropdown" role="listbox">
          <div className="limit-dropdown-head">Lignes max</div>
          {LIMIT_OPTIONS.map(opt => (
            <button
              key={opt.label}
              role="option"
              aria-selected={opt.value === value}
              className={`limit-item${opt.value === value ? ' is-active' : ''}${opt.risk ? ` limit-risk-${opt.risk}` : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              <span className="limit-item-label">{opt.label}</span>
              {opt.risk === 'soft' && <span className="limit-item-warn">attention risque de lagger</span>}
              {opt.value === value && <IcCheck size={11}/>}
            </button>
          ))}
          <div className="limit-dropdown-foot">
            Outil de debug : filtre ta requete par programme ou OF.
          </div>
        </div>
      )}
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
