import { IcTable, IcHistory, IcAlert, IcBranch, IcDiff } from './Icons';

function formatNumber(n) {
  return new Intl.NumberFormat('fr-FR').format(n);
}

export function BottomPanel({ result, env, query, history, view, onView }) {
  return (
    <div className="bottom">
      <div className="bottom-tabs">
        <button className={`btab${view === "results"  ? " is-active" : ""}`} onClick={() => onView("results")}>
          <IcTable size={13}/> Resultats
          {result && <span className={`btab-count${result.truncated ? ' btab-count-warn' : ''}`}>{formatNumber(result.rows.length)}{result.truncated ? '+' : ''}</span>}
        </button>
        <button className={`btab${view === "history"  ? " is-active" : ""}`} onClick={() => onView("history")}>
          <IcHistory size={13}/> Historique
        </button>
        <button className={`btab${view === "messages" ? " is-active" : ""}`} onClick={() => onView("messages")}>
          <IcAlert size={13}/> Messages
        </button>
        <div className="bottom-meta">
          {result && (
            <>
              <span className="meta-item">
                <span className={`meta-dot meta-dot-${env.toLowerCase()}`}/>
                {env === "TRN" ? "sql-trn.soprofen.local" : "sql-prd.soprofen.local"}
              </span>
              <span className={`meta-item${result.truncated ? ' meta-item-warn' : ''}`}>
                {formatNumber(result.rows.length)} lignes
                {result.truncated && <span className="meta-trunc"> · tronque</span>}
              </span>
              <span className="meta-item">{result.took} ms</span>
              <span className="meta-item">{result.plan}</span>
            </>
          )}
        </div>
      </div>

      <div className="bottom-body">
        {view === "results"  && <ResultsTable result={result}/>}
        {view === "history"  && <HistoryList items={history}/>}
        {view === "messages" && <MessagesList env={env} query={query}/>}
      </div>
    </div>
  );
}

function ResultsTable({ result }) {
  if (!result) {
    return <div className="empty">Executez la requete pour afficher les resultats.<br/><span className="empty-hint">⌘↵</span></div>;
  }
  return (
    <div className="tbl-wrap">
      {result.truncated && (
        <div className="truncate-banner" role="alert">
          <IcAlert size={12}/>
          <span className="truncate-banner-strong">Resultat tronque</span>
          <span className="truncate-banner-msg">
            Seules les {formatNumber(result.appliedLimit ?? result.rows.length)} premieres lignes sont affichees.
            Pense a filtrer par programme ou OF (clause WHERE) — sinon augmente la limite via
            le selecteur «&nbsp;limite&nbsp;» en haut a droite.
          </span>
        </div>
      )}
      <table className="tbl">
        <thead>
          <tr>
            <th className="tbl-idx">#</th>
            {result.columns.map(c => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((r, i) => (
            <tr key={i}>
              <td className="tbl-idx">{i + 1}</td>
              {r.map((cell, j) => {
                const col = result.columns[j];
                const cls = typeof cell === "number" ? "num" : col === "poste_travail" ? "chip-cell" : "";
                return (
                  <td key={j} className={cls}>
                    {col === "poste_travail"
                      ? <span className="cell-chip">{cell}</span>
                      : String(cell)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryList({ items }) {
  return (
    <div className="hist">
      {items.map((h, i) => (
        <div key={i} className="hist-row">
          <div className="hist-hash">{h.hash}</div>
          <div className="hist-msg">{h.msg}</div>
          <div className="hist-branch"><IcBranch size={11}/> {h.branch}</div>
          <div className="hist-author">{h.author}</div>
          <div className="hist-when">{h.when}</div>
          <button className="hist-btn"><IcDiff size={12}/> diff</button>
        </div>
      ))}
    </div>
  );
}

function MessagesList({ env, query }) {
  const host = env === "TRN" ? "sql-trn.soprofen.local" : "sql-prd.soprofen.local";
  const hints = [
    { lvl: "ok",   txt: `Connecte a ${host} (role: readonly_dev)` },
    { lvl: "info", txt: "Plan d'execution: Clustered Index Seek sur ordres_fabrication_pk, Hash Match Join (articles, postes)" },
    { lvl: "warn", txt: "DATEADD(day, 2, ...) — pense a documenter la fenetre temporelle dans le commentaire d'entete." },
    { lvl: "ok",   txt: "Aucune requete DML detectee. Mode lecture seule actif." },
  ];
  return (
    <div className="msgs">
      {hints.map((h, i) => (
        <div key={i} className={`msg msg-${h.lvl}`}>
          <span className="msg-dot"/>
          <span className="msg-time">{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).slice(0, 5)}:{20 + i * 3}</span>
          <span className="msg-txt">{h.txt}</span>
        </div>
      ))}
    </div>
  );
}
