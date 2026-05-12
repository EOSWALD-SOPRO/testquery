import { IcFile, IcMonitor, IcPullReq, IcSettings } from './Icons';

const MODES = [
  { key: 'editor',      label: 'Éditeur', icon: IcFile     },
  { key: 'workcenters', label: 'Postes',  icon: IcMonitor  },
  { key: 'prs',         label: 'PRs',     icon: IcPullReq  },
  { key: 'admin',       label: 'Admin',   icon: IcSettings },
];

export function ActivityBar({ mode, onModeChange }) {
  return (
    <nav className="activity-bar">
      {MODES.map(m => {
        const Ic = m.icon;
        return (
          <button key={m.key}
            className={`activity-icon${mode === m.key ? ' is-on' : ''}`}
            onClick={() => onModeChange(m.key)}
            title={m.label}>
            <Ic size={18}/>
            <span className="activity-label">{m.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
