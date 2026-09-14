import Link from 'next/link'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-void/80 backdrop-blur-md border-b border-line">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="relative inline-block w-7 h-7 rounded-md bg-accent-bar" aria-hidden />
          <span className="font-mono font-bold text-[15px] tracking-tight group-hover:text-glow transition">
            seeing-llm
          </span>
          <span className="text-[11px] font-mono text-fg-dim hidden md:inline">看见大模型</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <NavLink href="/architecture">架构解剖</NavLink>
          <NavLink href="/topics">专题</NavLink>
          <NavLink href="/training">训练流程</NavLink>
          <NavLink href="/ops">算子</NavLink>
          <NavLink href="/about">关于</NavLink>
        </nav>
      </div>
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-md text-fg-muted hover:text-fg hover:bg-white/[0.04] transition"
    >
      {children}
    </Link>
  )
}
