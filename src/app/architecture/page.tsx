import Link from 'next/link'
import { LayerWall } from '@/components/LayerWall'
import { MODEL_LIST } from '@/lib/models'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

/** 各模型模块的交付节奏 */
const MODULE_STATUS: Record<string, 'live' | 'next' | 'planned'> = {
  // P3 才做 V4.1 / Qwen3.8 的模块页
  kda: 'planned',
  'gated-mla': 'planned',
  attnres: 'planned',
  'latent-moe': 'planned',
  'situ-glu': 'planned',
}

export const metadata = {
  title: '架构解剖 · seeing-llm',
  description: 'Kimi K3 / DeepSeek V4.1 Flash / Qwen3.8 三个开源旗舰的逐层解剖，14 个模块页。',
}

export default function ArchitecturePage() {
  const totalModules = MODEL_LIST.reduce((n, m) => n + m.modules.length, 0)

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="eyebrow mb-2">Track A</div>
      <h1 className="text-3xl md:text-4xl font-bold mb-3">架构解剖</h1>
      <p className="text-fg-muted max-w-3xl leading-relaxed mb-4">
        把三个开源旗舰逐层拆开。不是「念参数」，而是回答一个问题：
        <span className="text-fg">每一处设计是在解决什么矛盾、付出了什么代价。</span>
      </p>
      <div className="flex flex-wrap gap-4 mb-12 font-mono text-xs text-fg-dim">
        <span><span className="text-neon">3</span> 个焦点模型</span>
        <span><span className="text-neon">{totalModules}</span> 个模块页</span>
        <span><span className="text-neon">12</span> 个历史模型全景表（P3）</span>
      </div>

      {/* 层墙 */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-4">先看清骨架</h2>
        <div className="panel p-6">
          <LayerWall ids={['k3', 'qwen', 'v4']} maxLayers={13} />
        </div>
        <p className="text-sm text-fg-muted mt-4 leading-relaxed max-w-3xl">
          K3 与 Qwen3.8 共用同一副宏循环（<span className="font-mono text-fg">23 × 4</span>），
          差异全部集中在「线性注意力」和「全注意力」各自怎么实现 —— 所以它们可以逐层对齐比较。
          V4.1 Flash 是另一条路：它把 Encoder 请回来做全局 KV，属于纵向切分而非层间配比。
        </p>
      </section>

      {/* 模块清单 */}
      {MODEL_LIST.map((m) => (
        <section key={m.id} className="mb-12">
          <div className="flex items-baseline gap-3 mb-1">
            <span className={`font-bold text-lg ${m.textClass}`}>{m.name}</span>
            <span className="font-mono text-xs text-fg-dim">{m.arch.formula}</span>
          </div>
          <p className="text-sm text-fg-muted mb-4">{m.headline}</p>

          <div className="grid md:grid-cols-2 gap-4">
            {m.modules.map((mod) => {
              const st = MODULE_STATUS[mod.slug] ?? 'planned'
              return (
                <div
                  key={mod.slug}
                  className="panel p-4 border-l-2 flex flex-col"
                  style={{ borderLeftColor: m.hex }}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <h3 className={`font-semibold ${m.textClass}`}>{mod.name}</h3>
                    <Badge status={st} />
                  </div>
                  <p className="text-sm text-fg-muted leading-relaxed">{mod.oneLine}</p>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {/* 12 模型全景表 */}
      <section>
        <h2 className="text-xl font-bold mb-4">12 模型全景表</h2>
        <div className="panel p-6">
          <p className="text-fg-muted text-sm leading-relaxed mb-3">
            除了三个焦点模型，P3 会补一张覆盖 12 个代表性开源模型的全景对照表，
            把「层骨架 / 注意力配比 / 专家稀疏度 / KV 路线 / 上下文」这些维度铺开看趋势。
          </p>
          <p className="text-xs font-mono text-fg-dim">
            注：此前参考的 <span className="text-fg-muted">CalvinXKY/InfraTech</span> 仓库已滞后 ——
            其 <span className="font-mono">models/</span> 目录仅 11 项，且不含 qwen3_8 与 deepseek_v4_1_flash。
            焦点模型的原图与技术细节改从 HF 模型卡、ModelScope 与官方技术报告取。
          </p>
        </div>
      </section>

      <div className="mt-12">
        <Link href={`${base}/`} className="btn-ghost">← 返回首页</Link>
      </div>
    </div>
  )
}

function Badge({ status }: { status: 'live' | 'next' | 'planned' }) {
  const map = {
    live:    { t: '已上线', c: 'text-neon border-neon/40 bg-neon/10' },
    next:    { t: 'P1 中',  c: 'text-k3 border-k3/40 bg-k3/10' },
    planned: { t: '待开发', c: 'text-fg-dim border-line bg-white/[0.02]' },
  }
  const s = map[status]
  return <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${s.c}`}>{s.t}</span>
}
