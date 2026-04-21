// Tweaks panel — live toggles to explore the design
function TweaksPanel({ open, onClose, tweaks, setTweak }) {
  if (!open) return null;
  return (
    <div className="tweaks">
      <div className="tweaks-head">
        <div className="tweaks-title">Tweaks</div>
        <button className="icon-btn" onClick={onClose}><IcX size={13}/></button>
      </div>

      <TweakGroup label="Theme">
        <Seg value={tweaks.theme} onChange={v => setTweak("theme", v)}
             options={[["dark","Dark"],["light","Light"]]}/>
      </TweakGroup>

      <TweakGroup label="Accent">
        <div className="swatches">
          {[
            ["amber",   "oklch(0.78 0.14 75)"],
            ["indigo",  "oklch(0.68 0.17 270)"],
            ["emerald", "oklch(0.72 0.14 160)"],
            ["rose",    "oklch(0.70 0.17 15)"],
            ["cyan",    "oklch(0.75 0.12 210)"],
          ].map(([k, c]) => (
            <button key={k}
              className={`sw${tweaks.accent === k ? " is-on" : ""}`}
              style={{ background: c }}
              onClick={() => setTweak("accent", k)}/>
          ))}
        </div>
      </TweakGroup>

      <TweakGroup label="Densite editeur">
        <Seg value={tweaks.density} onChange={v => setTweak("density", v)}
             options={[["compact","Compacte"],["cozy","Confort"]]}/>
      </TweakGroup>

      <TweakGroup label="Apercu ecran atelier">
        <Seg value={tweaks.preview ? "on" : "off"} onChange={v => setTweak("preview", v === "on")}
             options={[["on","Visible"],["off","Masque"]]}/>
      </TweakGroup>

      <TweakGroup label="Style resultats">
        <Seg value={tweaks.resultStyle} onChange={v => setTweak("resultStyle", v)}
             options={[["table","Tableau"],["cards","Cartes"]]}/>
      </TweakGroup>

      <TweakGroup label="Mise en page">
        <Seg value={tweaks.layout} onChange={v => setTweak("layout", v)}
             options={[["split","Split H"],["stack","Empilee"]]}/>
      </TweakGroup>
    </div>
  );
}

function TweakGroup({ label, children }) {
  return (
    <div className="tw-grp">
      <div className="tw-label">{label}</div>
      <div className="tw-ctrl">{children}</div>
    </div>
  );
}

function Seg({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map(([k, l]) => (
        <button key={k} className={value === k ? "is-on" : ""} onClick={() => onChange(k)}>{l}</button>
      ))}
    </div>
  );
}

Object.assign(window, { TweaksPanel });
