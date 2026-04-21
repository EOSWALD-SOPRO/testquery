// Lightweight SQL syntax highlighter — no external deps
const SQL_KW = /\b(SELECT|FROM|WHERE|AND|OR|NOT|IN|AS|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|UNION|ALL|CASE|WHEN|THEN|ELSE|END|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|VIEW|INDEX|ALTER|DROP|WITH|DISTINCT|BETWEEN|IS|NULL|LIKE|INTERVAL|CURRENT_DATE|CURRENT_TIMESTAMP|CAST|COALESCE|EXISTS|ASC|DESC)\b/gi;

function highlightSql(src) {
  // tokenize preserving order
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const rest = src.slice(i);
    let m;
    // line comment
    if ((m = rest.match(/^--[^\n]*/))) { tokens.push(["cm", m[0]]); i += m[0].length; continue; }
    // string
    if ((m = rest.match(/^'([^'\\]|\\.)*'/))) { tokens.push(["st", m[0]]); i += m[0].length; continue; }
    // number
    if ((m = rest.match(/^\b\d+\b/))) { tokens.push(["nu", m[0]]); i += m[0].length; continue; }
    // keyword (case-insensitive, word boundary)
    if ((m = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/))) {
      const w = m[0];
      if (/^(SELECT|FROM|WHERE|AND|OR|NOT|IN|AS|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|UNION|ALL|CASE|WHEN|THEN|ELSE|END|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|VIEW|INDEX|ALTER|DROP|WITH|DISTINCT|BETWEEN|IS|NULL|LIKE|INTERVAL|CURRENT_DATE|CURRENT_TIMESTAMP|CAST|COALESCE|EXISTS|ASC|DESC)$/i.test(w)) {
        tokens.push(["kw", w]);
      } else {
        tokens.push(["id", w]);
      }
      i += w.length; continue;
    }
    // punctuation
    if ((m = rest.match(/^[(),;.*+\-/<>=!|%]+/))) { tokens.push(["pu", m[0]]); i += m[0].length; continue; }
    // whitespace
    if ((m = rest.match(/^\s+/))) { tokens.push(["ws", m[0]]); i += m[0].length; continue; }
    tokens.push(["tx", rest[0]]); i += 1;
  }
  return tokens;
}

function SqlCodeView({ code, lineNumbers = true, highlightLines = [] }) {
  const lines = code.split("\n");
  return (
    <div className="sql-view">
      {lines.map((line, idx) => {
        const tokens = highlightSql(line);
        const isHL = highlightLines.includes(idx + 1);
        return (
          <div key={idx} className={`sql-line${isHL ? " sql-line--hl" : ""}`}>
            {lineNumbers && <span className="sql-ln">{idx + 1}</span>}
            <span className="sql-code">
              {tokens.map((t, i) => <span key={i} className={`tk-${t[0]}`}>{t[1]}</span>)}
              {line.length === 0 && "\u00A0"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Editable SQL editor — overlay-based so we get real syntax highlighting
// while keeping the textarea caret/selection/undo behavior.
function SqlEditor({ value, onChange }) {
  const taRef = React.useRef(null);
  const preRef = React.useRef(null);

  const syncScroll = () => {
    if (!taRef.current || !preRef.current) return;
    preRef.current.scrollTop = taRef.current.scrollTop;
    preRef.current.scrollLeft = taRef.current.scrollLeft;
  };

  const lines = value.split("\n");

  return (
    <div className="editor-wrap">
      <div className="editor-gutter">
        {lines.map((_, i) => <div key={i} className="editor-ln">{i + 1}</div>)}
      </div>
      <div className="editor-scroll">
        <pre className="editor-pre" ref={preRef}>
          {highlightSql(value).map((t, i) => <span key={i} className={`tk-${t[0]}`}>{t[1]}</span>)}
          {"\n"}
        </pre>
        <textarea
          ref={taRef}
          className="editor-ta"
          spellCheck={false}
          value={value}
          onChange={e => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={e => {
            if (e.key === "Tab") {
              e.preventDefault();
              const t = e.target;
              const s = t.selectionStart, en = t.selectionEnd;
              const nv = value.slice(0, s) + "    " + value.slice(en);
              onChange(nv);
              requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = s + 4; });
            }
          }}
        />
      </div>
    </div>
  );
}

Object.assign(window, { SqlCodeView, SqlEditor, highlightSql });
