import Link from 'next/link'

export default function PlaceholderPage({ title, track, eta }: { title: string; track: string; eta: string }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <div className="inline-block px-3 py-1 rounded-full bg-ink-100 text-xs font-mono text-ink-600 mb-4">
        {track} · 预计 {eta} 上线
      </div>
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      <p className="text-ink-600 mb-8 leading-relaxed">
        本页内容正在按 seeing-llm 建设方案 v2.1 推进。当前阶段为 P0（项目骨架 + 图片流水线），
        内容将在 P1–P3 阶段陆续交付。
      </p>
      <Link
        href={`${base}/`}
        className="inline-flex items-center px-5 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
      >
        ← 返回首页
      </Link>
    </div>
  )
}