import Link from 'next/link'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-ink-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href={`${base}/`} className="flex items-center gap-2 font-bold">
          <span className="inline-block w-7 h-7 rounded-md bg-gradient-hero" aria-hidden />
          <span className="text-lg">seeing-llm</span>
          <span className="text-xs font-mono text-ink-500 hidden md:inline">看见大模型</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <NavLink href={`${base}/architecture`}>架构解剖</NavLink>
          <NavLink href={`${base}/training`}>训练流程</NavLink>
          <NavLink href={`${base}/ops`}>算子</NavLink>
          <NavLink href={`${base}/about`}>关于</NavLink>
        </nav>
      </div>
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-md text-ink-700 hover:bg-ink-100 transition"
    >
      {children}
    </Link>
  )
}