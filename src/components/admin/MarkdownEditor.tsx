import { useMemo } from "react";

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre><code>${code}</code></pre>`);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/^###### (.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^##### (.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^(\s*)- (.+)$/gm, "<li>$2</li>");
  html = html.replace(/(<li>[\s\S]+?<\/li>)/g, "<ul>$1</ul>").replace(/<\/ul>\s*<ul>/g, "");
  html = html.replace(/^(\s*)\d+\. (.+)$/gm, "<oli>$2</oli>");
  html = html.replace(/(<oli>[\s\S]+?<\/oli>)/g, "<ol>$1</ol>").replace(/<\/ol>\s*<ol>/g, "");
  html = html.replace(/<oli>/g, "<li>").replace(/<\/oli>/g, "</li>");
  html = html.split(/\n{2,}/).map((block) => {
    if (/^<(h\d|ul|ol|pre|blockquote|table)/.test(block.trim())) return block;
    return `<p>${block.replace(/\n/g, "<br/>")}</p>`;
  }).join("\n");
  return html;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  height?: number;
}

export default function MarkdownEditor({ value, onChange, height = 480 }: Props) {
  const rendered = useMemo(() => renderMarkdown(value), [value]);
  const stats = useMemo(() => {
    const words = (value.match(/\b\w+\b/g) ?? []).length;
    const chars = value.length;
    const mins = Math.max(1, Math.round(words / 200));
    return { words, chars, mins };
  }, [value]);

  function insertMd(prefix: string, suffix = "") {
    const el = document.activeElement as HTMLTextAreaElement | null;
    if (!el || el.tagName !== "TEXTAREA") return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1 rounded-lg border p-1" style={{ borderColor: "var(--color-border-subtle)", background: "rgba(14,14,14,0.5)" }}>
        <ToolbarBtn onClick={() => insertMd("**", "**")}><strong>B</strong></ToolbarBtn>
        <ToolbarBtn onClick={() => insertMd("*", "*")}><em>I</em></ToolbarBtn>
        <ToolbarBtn onClick={() => insertMd("# ")}>H1</ToolbarBtn>
        <ToolbarBtn onClick={() => insertMd("## ")}>H2</ToolbarBtn>
        <ToolbarBtn onClick={() => insertMd("- ")}>• List</ToolbarBtn>
        <ToolbarBtn onClick={() => insertMd("1. ")}>1. List</ToolbarBtn>
        <ToolbarBtn onClick={() => insertMd("[", "](url)")}>Link</ToolbarBtn>
        <ToolbarBtn onClick={() => insertMd("> ")}>Quote</ToolbarBtn>
        <ToolbarBtn onClick={() => insertMd("`", "`")}>Code</ToolbarBtn>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2" style={{ height }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input h-full resize-none"
          style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, lineHeight: 1.65 }}
        />
        <div className="prose-gold overflow-y-auto rounded-lg border p-5 h-full" style={{ borderColor: "var(--color-border-subtle)", background: "rgba(14,14,14,0.5)" }} dangerouslySetInnerHTML={{ __html: rendered }} />
      </div>
      <div className="mt-2 flex items-center justify-end gap-4 text-[11px]" style={{ color: "var(--color-text-tertiary)", fontFamily: "var(--font-mono)" }}>
        <span>{stats.words} Wörter</span>
        <span>·</span>
        <span>{stats.chars} Zeichen</span>
        <span>·</span>
        <span>{stats.mins} Min. Lesezeit</span>
      </div>
    </div>
  );
}

function ToolbarBtn({ onClick, children }: { onClick: () => void; children: any }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded px-2 py-1 text-xs transition-colors hover:bg-white/5"
      style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}
    >
      {children}
    </button>
  );
}
