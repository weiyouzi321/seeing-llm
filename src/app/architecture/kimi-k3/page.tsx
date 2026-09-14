import Link from 'next/link'
import { LayerWall } from '@/components/LayerWall'
import { RatioExplorer } from '@/components/RatioExplorer'
import { MODELS } from '@/lib/models'
import { K3_MODULES } from '@/lib/k3'

export const metadata = {
  title: 'Kimi K3 解剖 · seeing-llm',
  description: 'Kimi K3 逐层解剖：93 层 = 1 稠密 + 23×(3 KDA + 1 Gated MLA)，2.8T/104B，896 选 16 的 MoE，1M 上下文。',
}

export default function KimiK3Page() {
  const m = MODELS.k3

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* 面包屑 */}
      <div className="font-mono text-xs text-fg-dim mb-6">
        <Link href="/architecture" className="hover:text-neon transition">架构解剖</Link>
        <span className="mx-2">/</span>
        <span className="text-k3">Kimi K3</span>
      </div>

      {/* Hero */}
      <div className="eyebrow mb-2">{m.released} 发布</div>
      <h1 className="text-3xl md:text-5xl font-bold mb-3">
        <span className="text-k3">Kimi K3</span>
      </h1>
      <p className="text-lg text-fg-muted max-w-3xl leading-relaxed mb-4">{m.headline}</p>
      <p className="font-mono text-xs text-fg-dim mb-10">{m.fullName}</p>

      {/* 关键数字 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
        {[
          { k: '总参数', v: '2.8T' },
          { k: '激活参数', v: '104B' },
          { k: '层数', v: '93' },
          { k: '上下文', v: '1M' },
        ].map((s) => (
          <div key={s.k} className="panel p-4">
            <div className="font-mono text-2xl font-semibold text-k3">{s.v}</div>
            <div className="text-xs text-fg-dim mt-1">{s.k}</div>
          </div>
        ))}
      </div>

      {/* 层墙 */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-2">层骨架</h2>
        <p className="text-sm text-fg-muted mb-4 max-w-3xl leading-relaxed">
          {m.arch.formula}。前面 1 层稠密把输入抬到隐藏维，
          之后进入 23 次宏循环：3 层 KDA（线性，不存 KV）+ 1 层 Gated MLA（全注意力，要存 KV）。
        </p>
        <div className="panel p-6">
          <LayerWall ids={['k3']} maxLayers={17} />
        </div>
      </section>

      {/* 配比探索器 */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-2">为什么是 3:1</h2>
        <p className="text-sm text-fg-muted mb-4 max-w-3xl leading-relaxed">
          拖动滑块改变线性/全注意力的配比，看 KV Cache 削减与表达力之间的取舍。
          K3 与 Qwen3.8 都停在 3:1 —— 削减 75% 的 KV，同时每 4 层保留一次全注意力兜底。
        </p>
        <RatioExplorer />
      </section>

      {/* 完整规格 */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-4">完整规格</h2>
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {m.spec.map((row, i) => (
                <tr key={row.label} className={i < m.spec.length - 1 ? 'border-b border-line/50' : ''}>
                  <td className="p-3 font-mono text-xs text-fg-dim w-48">{row.label}</td>
                  <td className="p-3 text-fg-muted">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs font-mono text-fg-dim mt-3">
          许可：Kimi K3 License（非 MIT/Apache）—— 非商业教育用途不受限，但需保留来源标注。
        </p>
      </section>

      {/* 模块入口 */}
      <section>
        <h2 className="text-xl font-bold mb-4">5 个模块</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {K3_MODULES.map((mod) => (
            <Link
              key={mod.slug}
              href={`/architecture/kimi-k3/${mod.slug}`}
              className="card-interactive p-5 border-l-2"
              style={{ borderLeftColor: m.hex }}
            >
              <h3 className="font-semibold text-k3 mb-1.5">{mod.name}</h3>
              <p className="text-sm text-fg-muted leading-relaxed mb-3">{mod.oneLine}</p>
              <span className="font-mono text-[11px] text-fg-dim">
                {mod.points.length} 项要点 · 含设计取舍 →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-12">
        <Link href="/architecture" className="btn-ghost">← 返回架构解剖</Link>
      </div>
    </div>
  )
}
