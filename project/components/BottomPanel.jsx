// Bottom panel: tabs for Results / Production preview / History / Messages
function BottomPanel({ result, env, query, history, view, onView }) {
  return (
    <div className="bottom">
      <div className="bottom-tabs">
        <button className={`btab${view === "results"  ? " is-active" : ""}`} onClick={() => onView("results")}>
          <IcTable size={13}/> Resultats
          {result && <span className="btab-count">{result.rows.length}</span>}
        </button>
        <button className={`btab${view === "preview"  ? " is-active" : ""}`} onClick={() => onView("preview")}>
          <IcMonitor size={13}/> Apercu ecran atelier
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
                <span className={`meta-dot meta-dot-${env.toLowerCase()}`}/> {env === "TRN" ? "pg-trn.soprofen.local" : "pg-prd.soprofen.local"}
              </span>
              <span className="meta-item">{result.rows.length} lignes</span>
              <span className="meta-item">{result.took} ms</span>
              <span className="meta-item">{result.plan}</span>
            </>
          )}
        </div>
      </div>

      <div className="bottom-body">
        {view === "results"  && <ResultsTable result={result}/>}
        {view === "preview"  && <ShopFloorPreview rows={result?.rows || []} columns={result?.columns || []}/>}
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
                let cls = "";
                if (typeof cell === "number") cls = "num";
                if (col === "poste_travail") cls = "chip-cell";
                return <td key={j} className={cls}>{
                  col === "poste_travail"
                    ? <span className="cell-chip">{cell}</span>
                    : String(cell)
                }</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// The shop-floor screen mockup — what operators actually see
function ShopFloorPreview({ rows, columns }) {
  const poste = "VR-02-ASSEMB";
  const ops = rows
    .filter(r => r[columns.indexOf("poste_travail")] === poste)
    .slice(0, 5);

  const now = ops[0];
  const queue = ops.slice(1);

  return (
    <div className="sf-wrap">
      <div className="sf-meta">
        <div>
          <div className="sf-meta-label">Ecran cible</div>
          <div className="sf-meta-value">VR-02-ASSEMB · écran mural atelier 1</div>
        </div>
        <div>
          <div className="sf-meta-label">Rafraichissement</div>
          <div className="sf-meta-value">auto · toutes les 30s</div>
        </div>
        <div>
          <div className="sf-meta-label">Lignes mappees</div>
          <div className="sf-meta-value">{ops.length} / {rows.length}</div>
        </div>
        <div className="sf-meta-fill"/>
        <button className="btn-ghost"><IcEye size={13}/> Plein ecran</button>
      </div>

      <div className="sf-screen">
        <div className="sf-header">
          <div className="sf-poste">
            <div className="sf-poste-code">VR-02-ASSEMB</div>
            <div className="sf-poste-name">Assemblage coffre — Volets roulants</div>
          </div>
          <div className="sf-clock">
            <div className="sf-time">10:42</div>
            <div className="sf-date">mer. 22 avr.</div>
          </div>
        </div>

        {now ? (
          <div className="sf-now">
            <div className="sf-now-tag">EN COURS</div>
            <div className="sf-now-main">
              <div className="sf-of">{now[columns.indexOf("num_ordre")]}</div>
              <div className="sf-op">{now[columns.indexOf("libelle")]}</div>
            </div>
            <div className="sf-now-grid">
              <div><div className="sf-k">Article</div><div className="sf-v">{now[columns.indexOf("ref_article")]}</div></div>
              <div><div className="sf-k">Dimensions</div><div className="sf-v">{now[columns.indexOf("dimensions")]} mm</div></div>
              <div><div className="sf-k">Quantite</div><div className="sf-v sf-v-big">{now[columns.indexOf("quantite")]}</div></div>
              <div><div className="sf-k">Duree std.</div><div className="sf-v">{now[columns.indexOf("duree_standard_min")]} min</div></div>
            </div>
          </div>
        ) : (
          <div className="sf-empty">Aucune operation planifiee sur ce poste.</div>
        )}

        <div className="sf-queue">
          <div className="sf-queue-head">A SUIVRE</div>
          {queue.map((r, i) => (
            <div key={i} className="sf-q-row">
              <div className="sf-q-seq">#{r[columns.indexOf("sequence")]}</div>
              <div className="sf-q-of">{r[columns.indexOf("num_ordre")]}</div>
              <div className="sf-q-op">{r[columns.indexOf("libelle")]}</div>
              <div className="sf-q-art">{r[columns.indexOf("ref_article")]}</div>
              <div className="sf-q-dim">{r[columns.indexOf("dimensions")]} mm</div>
              <div className="sf-q-qty">×{r[columns.indexOf("quantite")]}</div>
              <div className="sf-q-dur">{r[columns.indexOf("duree_standard_min")]}′</div>
            </div>
          ))}
        </div>
      </div>
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
  const hints = [
    { lvl: "ok",   txt: `Connecte a ${env === "TRN" ? "pg-trn.soprofen.local" : "pg-prd.soprofen.local"} (role: readonly_dev)` },
    { lvl: "info", txt: "Plan d'execution: Index Scan sur ordres_fabrication_pk, Hash Join (articles, postes)" },
    { lvl: "warn", txt: "INTERVAL '2 days' — pense a documenter la fenetre temporelle dans le commentaire d'entete." },
    { lvl: "ok",   txt: "Aucune requete DML detectee. Mode lecture seule actif." },
  ];
  return (
    <div className="msgs">
      {hints.map((h, i) => (
        <div key={i} className={`msg msg-${h.lvl}`}>
          <span className="msg-dot"/>
          <span className="msg-time">10:41:{20 + i * 3}</span>
          <span className="msg-txt">{h.txt}</span>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { BottomPanel, ResultsTable, ShopFloorPreview, HistoryList, MessagesList });
