import Link from 'next/link'
import { LayerWall } from '@/components/LayerWall'
import { MODEL_LIST } from '@/lib/models'
import { getModule, MODULE_COUNT } from '@/lib/modules'
import { modulePath, MODEL_ROUTE } from '@/lib/routes'

export const metadata = {
  title: '架构解剖 · seeing-llm',
  description: 'Kimi K3 / DeepSeek V4.1 Flash / Qwen3.8 三个开源旗舰的逐层解剖，14 个模块页。',
}

export default function ArchitecturePage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="eyebrow mb-2">Track A</div>
      <h1 className="text-3xl md:text-4xl font-bold mb-3">架构解剖</h1>
      <p className="text-fg-muted max-w-3xl leading-relaxed mb-4">
        把三个开源旗舰逐层拆开。不是「念参数」，而是回答一个问题：
        <span className="text-fg">每一处设计是在解决什么矛盾、付出了什么代价。</span>
      </p>
      <div className="flex flex-wrap gap-4 mb-10 font-mono text-xs text-fg-dim">
        <span><span className="text-neon">3</span> 个焦点模型</span>
        <span><span className="text-neon">{MODULE_COUNT}</span> 个模块页</span>
        <span><span className="text-neon">6</span> 个模块交互组件</span>
        <span><span className="text-neon">2</span> 个横向专题</span>
        <span><span className="text-neon">12</span> 个模型全景</span>
        <span><span className="text-neon">24</span> 个演进节点</span>
      </div>

      {/* 入口条 */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
        <Link href="/architecture/panorama" className="card-interactive p-4">
          <div className="eyebrow mb-1">A1 · 看趋势</div>
          <div className="font-semibold mb-1">12 模型全景对比</div>
          <p className="text-xs text-fg-muted leading-relaxed">
            总参 / 激活 / 稀疏度 / 注意力形态 / 上下文，三种可切换轴的散点图。
          </p>
        </Link>
        <Link href="/architecture/evolution" className="card-interactive p-4">
          <div className="eyebrow mb-1">A5 · 看来历</div>
          <div className="font-semibold mb-1">演进时间轴 2017→2026</div>
          <p className="text-xs text-fg-muted leading-relaxed">
            24 个节点、五条线索，每个都写清它是今天哪个模块的前身。
          </p>
        </Link>
        <Link href="/architecture/alignment" className="card-interactive p-4">
          <div className="eyebrow mb-1">最有原创价值的一张</div>
          <div className="font-semibold mb-1">双模型层墙对齐 ⟷</div>
          <p className="text-xs text-fg-muted leading-relaxed">
            K3 与 Qwen3.8 的宏循环完全同构（23 × 4），逐层对齐后差异只剩四个位置。
          </p>
        </Link>
        <Link href="/topics" className="card-interactive p-4">
          <div className="eyebrow mb-1">同一问题的三种解法</div>
          <div className="font-semibold mb-1">横向专题 →</div>
          <p className="text-xs text-fg-muted leading-relaxed">
            MoE 稀疏度三家对比 · KV Cache 三条路线，每个都带可拖组件。
          </p>
        </Link>
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
      {MODEL_LIST.map((m) => {
        const route = MODEL_ROUTE[m.id]
        return (
          <section key={m.id} className="mb-12">
            <div className="flex items-baseline gap-3 mb-1 flex-wrap">
              <span className={`font-bold text-lg ${m.textClass}`}>{m.name}</span>
              <span className="font-mono text-xs text-fg-dim">{m.arch.formula}</span>
            </div>
            <p className="text-sm text-fg-muted mb-4">{m.headline}</p>

            <div className="grid md:grid-cols-2 gap-4">
              {m.modules.map((mod) => {
                const doc = getModule(m.id, mod.slug)
                const live = !!doc
                const inner = (
                  <>
                    <div className="flex items-center gap-2.5 mb-2">
                      <h3 className={`font-semibold ${m.textClass}`}>{mod.name}</h3>
                      {doc?.viz && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded border border-neon/40 text-neon bg-neon/10">
                          可交互
                        </span>
                      )}
                      {live && <span className="font-mono text-[10px] text-fg-dim ml-auto">→</span>}
                    </div>
                    <p className="text-sm text-fg-muted leading-relaxed mb-2">{mod.oneLine}</p>
                    {doc && (
                      <span className="font-mono text-[10px] text-fg-dim">
                        {doc.points.length} 项要点 · 含设计取舍
                      </span>
                    )}
                    {!live && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-line text-fg-dim bg-white/[0.02]">
                        待开发
                      </span>
                    )}
                  </>
                )

                return live ? (
                  <Link
                    key={mod.slug}
                    href={modulePath(m.id, mod.slug)}
                    className="card-interactive p-4 border-l-2 flex flex-col"
                    style={{ borderLeftColor: m.hex }}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div
                    key={mod.slug}
                    className="panel p-4 border-l-2 flex flex-col opacity-70"
                    style={{ borderLeftColor: m.hex }}
                  >
                    {inner}
                  </div>
                )
              })}
            </div>

            <div className="mt-3">
              <Link
                href={`/architecture/${route}`}
                className={`font-mono text-xs ${m.textClass} hover:text-glow transition`}
              >
                打开 {m.name} 概览页 →
              </Link>
            </div>
          </section>
        )
      })}

      {/* 两翼：全景表 + 时间轴 */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-4">把三个模型放回坐标系里</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/architecture/panorama" className="card-interactive p-5">
            <div className="eyebrow mb-2">空间维度 · 同一时刻别人在做什么</div>
            <h3 className="font-semibold mb-2">12 模型全景对比</h3>
            <p className="text-sm text-fg-muted leading-relaxed mb-3">
              总参数从 405B 涨到 2.8T，激活参数却始终在 5B–104B 之间 —— 这个脱钩是过去两年最大的变化。
              表里还能按「只看 MoE / 只看混合注意力 / 只看 1M 上下文 / 只看宽松许可」筛。
            </p>
            <span className="font-mono text-[11px] text-neon">打开全景表 →</span>
          </Link>
          <Link href="/architecture/evolution" className="card-interactive p-5">
            <div className="eyebrow mb-2">时间维度 · 这个设计从哪来</div>
            <h3 className="font-semibold mb-2">演进时间轴 2017 → 2026</h3>
            <p className="text-sm text-fg-muted leading-relaxed mb-3">
              24 个节点分五条线索：注意力、稀疏化、上下文与精度、骨架、训练与对齐。
              每个节点都写清它是今天哪个模块的前身 —— 比如 2020 年的线性注意力，就是 KDA 的前身。
            </p>
            <span className="font-mono text-[11px] text-neon">打开时间轴 →</span>
          </Link>
        </div>
      </section>

      <div className="mt-12">
        <Link href="/" className="btn-ghost">← 返回首页</Link>
      </div>
    </div>
  )
}
