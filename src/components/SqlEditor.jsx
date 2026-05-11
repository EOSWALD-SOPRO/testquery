import CodeMirror from '@uiw/react-codemirror';
import { sql, MSSQL } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';

const panelTheme = EditorView.theme({
  '.cm-scroller': { fontFamily: 'var(--font-mono)', fontSize: '12.5px', lineHeight: '1.55' },
  '.cm-gutters':  { borderRight: '1px solid var(--border-soft)' },
});

const basicSetup = {
  lineNumbers: true,
  foldGutter: false,
  highlightActiveLine: false,
  highlightActiveLineGutter: false,
  autocompletion: false,
};

const extensions = [sql({ dialect: MSSQL }), panelTheme];

export function SqlEditor({ value, onChange }) {
  return (
    <div className="editor-wrap">
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={oneDark}
        extensions={extensions}
        basicSetup={basicSetup}
      />
    </div>
  );
}
