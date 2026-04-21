import React from 'react';

// SQL Server keywords + common TSQL extensions
const KEYWORDS = /^(SELECT|FROM|WHERE|AND|OR|NOT|IN|AS|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|HAVING|TOP|OFFSET|FETCH|NEXT|ROWS|ONLY|UNION|ALL|CASE|WHEN|THEN|ELSE|END|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|VIEW|INDEX|ALTER|DROP|WITH|DISTINCT|BETWEEN|IS|NULL|LIKE|GETDATE|DATEADD|DATEDIFF|CONVERT|CAST|COALESCE|ISNULL|EXISTS|ASC|DESC|NOLOCK|NOEXPAND|GO|EXEC|EXECUTE|DECLARE|BEGIN|COMMIT|ROLLBACK|TRANSACTION|TRAN|PRINT)$/i;

function highlightSql(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const rest = src.slice(i);
    let m;
    if ((m = rest.match(/^--[^\n]*/)))              { tokens.push(["cm", m[0]]); i += m[0].length; continue; }
    if ((m = rest.match(/^'([^'\\]|\\.)*'/)))       { tokens.push(["st", m[0]]); i += m[0].length; continue; }
    if ((m = rest.match(/^\b\d+(\.\d+)?\b/)))       { tokens.push(["nu", m[0]]); i += m[0].length; continue; }
    if ((m = rest.match(/^[A-Za-z_@#][A-Za-z0-9_]*/))) {
      const w = m[0];
      tokens.push([KEYWORDS.test(w) ? "kw" : "id", w]);
      i += w.length; continue;
    }
    if ((m = rest.match(/^[(),;.*+\-/<>=!|%@]+/)))  { tokens.push(["pu", m[0]]); i += m[0].length; continue; }
    if ((m = rest.match(/^\s+/)))                   { tokens.push(["ws", m[0]]); i += m[0].length; continue; }
    tokens.push(["tx", rest[0]]); i += 1;
  }
  return tokens;
}

export function SqlCodeView({ code, lineNumbers = true, highlightLines = [] }) {
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
              {line.length === 0 && " "}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function SqlEditor({ value, onChange }) {
  const taRef  = React.useRef(null);
  const preRef = React.useRef(null);

  const syncScroll = () => {
    if (!taRef.current || !preRef.current) return;
    preRef.current.scrollTop  = taRef.current.scrollTop;
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
