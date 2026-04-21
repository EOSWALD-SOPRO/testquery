// Commit & Pull Request dialog — the heart of the workflow
function CommitDialog({ open, onClose, query, baseQuery, branch }) {
  const [title,   setTitle]   = React.useState("feat(vr): ajout duree_standard_min sur ops assemblage");
  const [body,    setBody]    = React.useState("Ajoute la colonne `duree_standard_min` pour afficher la duree standard sur les ecrans de l'atelier VR.\n\nTeste sur TRN — ok sur les OF du 22/04.");
  const [step,    setStep]    = React.useState(0); // 0 review, 1 pushing, 2 done
  const [reviewers, setReviewers] = React.useState(["a.meyer", "c.fischer"]);

  if (!open) return null;

  const diff = computeDiff(baseQuery, query);

  const onSubmit = () => {
    setStep(1);
    setTimeout(() => setStep(2), 1800);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {step === 0 && (
          <>
            <div className="modal-head">
              <div>
                <div className="modal-eyebrow">Revue de code requise</div>
                <div className="modal-title">Commit &amp; ouverture de Pull Request</div>
              </div>
              <button className="icon-btn" onClick={onClose}><IcX size={14}/></button>
            </div>

            <div className="modal-body">
              <div className="pr-flow">
                <FlowStep n="1" label="Commit"   active done/>
                <FlowLine done/>
                <FlowStep n="2" label="Push"     active done/>
                <FlowLine done/>
                <FlowStep n="3" label="Pull Request" active/>
                <FlowLine/>
                <FlowStep n="4" label="GitHub Actions · TRN"/>
                <FlowLine/>
                <FlowStep n="5" label="Merge → PRD"/>
              </div>

              <div className="pr-grid">
                <div className="pr-left">
                  <label className="pr-label">Titre du commit</label>
                  <input className="pr-input" value={title} onChange={e => setTitle(e.target.value)}/>

                  <label className="pr-label">Description</label>
                  <textarea className="pr-textarea" rows={5} value={body} onChange={e => setBody(e.target.value)}/>

                  <div className="pr-row">
                    <div className="pr-field">
                      <label className="pr-label">Branche</label>
                      <div className="pr-static"><IcBranch size={12}/> {branch} → main</div>
                    </div>
                    <div className="pr-field">
                      <label className="pr-label">Fichier</label>
                      <div className="pr-static"><IcFile size={12}/> sql/vr/operations_assemblage.sql</div>
                    </div>
                  </div>

                  <label className="pr-label">Reviewers</label>
                  <div className="pr-reviewers">
                    {reviewers.map(r => (
                      <span key={r} className="revchip">
                        <span className="avatar avatar-xs">{r.split(".").map(s => s[0]).join("").toUpperCase()}</span>
                        {r}
                        <button onClick={() => setReviewers(reviewers.filter(x => x !== r))}><IcX size={10}/></button>
                      </span>
                    ))}
                    <button className="revchip revchip-add"><IcPlus size={10}/> ajouter</button>
                  </div>

                  <div className="pr-checks">
                    <CheckRow ok label="Syntaxe SQL valide"/>
                    <CheckRow ok label="Teste sur environnement TRN · 13 lignes"/>
                    <CheckRow ok label="Pas de DML (lecture seule)"/>
                    <CheckRow warn label="Commentaire d'entete present mais fenetre temporelle non documentee"/>
                  </div>
                </div>

                <div className="pr-right">
                  <div className="pr-right-head">Diff ({diff.added} ajouts · {diff.removed} suppressions)</div>
                  <div className="pr-diff">
                    {diff.lines.map((l, i) => (
                      <div key={i} className={`dfl dfl-${l.kind}`}>
                        <span className="dfl-sign">{l.kind === "add" ? "+" : l.kind === "rem" ? "−" : " "}</span>
                        <span className="dfl-ln">{l.lnum}</span>
                        <span className="dfl-code">{l.text || "\u00A0"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <div className="modal-foot-info">
                Apres la creation: GitHub Actions deploiera sur <b>TRN</b>. Le merge declenchera le deploiement sur <b>PRD</b>.
              </div>
              <div className="modal-foot-actions">
                <button className="btn-ghost" onClick={onClose}>Annuler</button>
                <button className="btn btn-commit" onClick={onSubmit}>
                  <IcCommit size={13}/> Commit · Push · Créer la PR
                </button>
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <div className="modal-center">
            <div className="spinner"/>
            <div className="pr-status-title">Commit → Push → Pull Request</div>
            <div className="pr-status-sub">git push origin {branch}</div>
          </div>
        )}

        {step === 2 && (
          <div className="modal-center">
            <div className="success-mark"><IcCheck size={26}/></div>
            <div className="pr-status-title">Pull Request #247 créée</div>
            <div className="pr-status-sub">feat(vr): ajout duree_standard_min sur ops assemblage</div>
            <div className="pr-status-actions-stack">
              <div className="pr-actions-item">
                <span className="ga-dot ga-run"/>
                <div className="ga-texts">
                  <div className="ga-title">deploy-trn · en cours</div>
                  <div className="ga-sub">GitHub Actions · demarre il y a 8 s</div>
                </div>
              </div>
              <div className="pr-actions-item">
                <span className="ga-dot ga-wait"/>
                <div className="ga-texts">
                  <div className="ga-title">merge-to-prd · en attente</div>
                  <div className="ga-sub">necessite 1 review approuvee</div>
                </div>
              </div>
            </div>
            <div className="modal-foot-actions" style={{ marginTop: 20 }}>
              <button className="btn-ghost" onClick={onClose}>Fermer</button>
              <button className="btn btn-run">Ouvrir dans GitHub →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FlowStep({ n, label, active, done }) {
  return (
    <div className={`fs${active ? " is-active" : ""}${done ? " is-done" : ""}`}>
      <div className="fs-n">{done ? <IcCheck size={11}/> : n}</div>
      <div className="fs-l">{label}</div>
    </div>
  );
}
const FlowLine = ({ done }) => <div className={`fl${done ? " is-done" : ""}`}/>;

function CheckRow({ ok, warn, label }) {
  return (
    <div className={`chkrow chkrow-${ok ? "ok" : warn ? "warn" : "bad"}`}>
      <span className="chkrow-icon">{ok ? <IcCheck size={11}/> : <IcAlert size={11}/>}</span>
      <span>{label}</span>
    </div>
  );
}

// Simple line-level diff for the dialog
function computeDiff(a, b) {
  const A = a.split("\n");
  const B = b.split("\n");
  const lines = [];
  let i = 0, j = 0, added = 0, removed = 0;
  while (i < A.length || j < B.length) {
    if (i < A.length && j < B.length && A[i] === B[j]) {
      lines.push({ kind: "ctx", lnum: j + 1, text: B[j] });
      i++; j++;
    } else if (j < B.length && !A.includes(B[j])) {
      lines.push({ kind: "add", lnum: j + 1, text: B[j] });
      added++; j++;
    } else if (i < A.length && !B.includes(A[i])) {
      lines.push({ kind: "rem", lnum: "", text: A[i] });
      removed++; i++;
    } else {
      if (j < B.length) { lines.push({ kind: "ctx", lnum: j + 1, text: B[j] }); i++; j++; }
      else break;
    }
  }
  // Compress long context runs
  const out = [];
  let ctxRun = 0;
  for (const l of lines) {
    if (l.kind === "ctx") ctxRun++; else ctxRun = 0;
    if (l.kind === "ctx" && ctxRun > 3) continue;
    out.push(l);
  }
  return { lines: out, added, removed };
}

Object.assign(window, { CommitDialog, computeDiff });
