import { getDiagramPath, type DiagramId } from '@/lib/diagrams'

export function DiagramCard({
  id,
  title,
  sub,
  model,
}: {
  id: DiagramId
  title: string
  sub: string
  model: 'K3' | 'V4' | 'Qwen'
}) {
  const accentClass =
    model === 'K3' ? 'border-k3' : model === 'V4' ? 'border-v4' : 'border-qwen'
  const textClass =
    model === 'K3' ? 'text-k3' : model === 'V4' ? 'text-v4' : 'text-qwen'

  return (
    <div className={`bg-white rounded-xl border border-ink-200 border-t-4 ${accentClass} overflow-hidden card-hover`}>
      <div className="relative aspect-[4/3] bg-ink-100">
        {/* 静态导出模式：用普通 <img> 而非 next/image，避免 loader 配置坑 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getDiagramPath(id, 'md')}
          alt={title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <div className={`text-xs font-mono mb-1 ${textClass}`}>{model}</div>
        <h3 className="font-bold text-base mb-1">{title}</h3>
        <p className="text-xs text-ink-600 leading-relaxed">{sub}</p>
      </div>
    </div>
  )
}