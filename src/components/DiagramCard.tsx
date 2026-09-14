import Image from 'next/image'
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
        <Image
          src={getDiagramPath(id, 'md')}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
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