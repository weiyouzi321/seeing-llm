import Link from 'next/link'

export default function PlaceholderPage({
  title,
  track,
  eta,
  children,
}: {
  title: string
  track: string
  eta: string
  children?: React.ReactNode
}) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line bg-white/[0.02] mb-5">
        <span className="w-1.5 h-1.5 rounded-full bg-k3" aria-hidden />
        <span className="text-xs font-mono text-fg-muted">{track}</span>
        <span className="text-xs font-mono text-fg-dim">预计 {eta}</span>
      </div>
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      {children ?? (
        <p className="text-fg-muted mb-8 leading-relaxed">
          本页内容正在按 seeing-llm 建设方案 v2.1 推进。当前阶段为 P1（Kimi K3 垂直切片），
          该轨道内容将在对应里程碑陆续交付。
        </p>
      )}
      <Link href="/" className="btn-ghost mt-4">
        ← 返回首页
      </Link>
    </div>
  )
}
