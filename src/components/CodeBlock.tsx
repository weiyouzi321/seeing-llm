import type { ReactNode } from 'react'

/**
 * 代码块（服务端组件，纯渲染 + 轻量着色）
 * 只处理注释 / 字符串 / 关键字 / 数字 —— 够教学用，不引第三方高亮器。
 */
const KW = new Set([
  'def', 'return', 'if', 'else', 'elif', 'for', 'while', 'in', 'range',
  'not', 'and', 'or', 'import', 'from', 'class', 'lambda', 'None', 'True', 'False',
])

const RE = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|#[^\n]*|\b[A-Za-z_][A-Za-z0-9_]*\b|\b\d+(?:\.\d+)?\b)/g

function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  RE.lastIndex = 0
  while ((m = RE.exec(code)) !== null) {
    if (m.index > last) out.push(code.slice(last, m.index))
    const t = m[0]
    let color: string | null = null
    if (t.startsWith('#')) color = '#5A6B85'
    else if (t.startsWith('"') || t.startsWith("'")) color = '#FB923C'
    else if (KW.has(t)) color = '#A78BFA'
    else if (/^\d/.test(t)) color = '#22D3EE'
    if (color) out.push(<span key={key++} style={{ color }}>{t}</span>)
    else out.push(t)
    last = m.index + t.length
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}

export function CodeBlock({ code, caption }: { code: string; caption?: string }) {
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-line bg-raised/50">
        <span className="eyebrow">{caption || 'PyTorch 教学实现'}</span>
        <span className="font-mono text-[10px] text-fg-dim">python</span>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed font-mono text-fg-muted">
        <code>{highlight(code)}</code>
      </pre>
    </div>
  )
}
