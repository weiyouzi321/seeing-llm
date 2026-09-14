import Link from 'next/link'
import { Brain, GitBranch, FlaskConical } from 'lucide-react'
import { LayerWall } from '@/components/LayerWall'
import { MODEL_LIST, MODELS, COMPARE, ROADMAP, TOPICS, type ModelId, type PhaseStatus } from '@/lib/models'
import { modelPath } from '@/lib/routes'

const base = process.env.NEXT_PUBLIC_BASE_PATH || ''

const TRACKS = [
  {
    id: 'A',
    title: '轨道 A · 架构解剖',
    subtitle: '把 700 亿到 2.8 万亿参数的模型拆给你看',
    body: '聚焦 Kimi K3、DeepSeek V4.1 Flash、Qwen3.8 三家最新开源旗舰。14 个模块页，每页一个「它为什么这样设计」的可拖可点组件。',
    icon: Brain,
    accent: 'k3' as ModelId,
    bullets: ['KDA / Gated MLA / AttnRes', 'CED + CSA2 + FP4 KV', 'Gated DeltaNet / Gated Attention'],
    href: '/architecture',
  },
  {
    id: 'B',
    title: '轨道 B · 训练全流程',
    subtitle: '从 8 阶段 MiniMind 看一份大模型是怎么炼出来的',
    body: '把 MiniMind（3090 单卡、约 3 元跑完全流程）的 8 个训练阶段串成可视时间线，每个阶段一段代码、一张曲线、一个「这一步在干嘛」的解释。',
    icon: GitBranch,
    accent: 'v4' as ModelId,
    bullets: ['Tokenizer → Pretrain → SFT', 'DPO → GRPO → RLHF', 'Reasoning / 评测 / 蒸馏'],
    href: '/training',
  },
  {
    id: 'C',
    title: '轨道 C · 算子与策略',
    subtitle: '把 PyTorch 源码变成「画给你看」的可执行小工具',
    body: 'TorchCode 高频前 20 个算子，每个一页：可视化张量、3 行公式、可拖滑块改参数。剩余 21 个走「待补清单」长期滚动。',
    icon: FlaskConical,
    accent: 'qwen' as ModelId,
    bullets: ['16 个 🔥 + 4 个补充', 'ReLU → Linear → Attention', 'RoPE / Top-k / Beam Search'],
    href: '/ops',
  },
]

export default function HomePage() {
  return (
    <div>
      {/* ============ Hero ============ */}
      <section className="relative">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="eyebrow mb-6 animate-fade-in-up">
            seeing-llm &nbsp;/&nbsp; v2.1 &nbsp;/&nbsp; 规格冻结 &nbsp;/&nbsp; 2026-09-14
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6 animate-fade-in-up">
            看见大模型
            <span className="cursor-blink ml-1" aria-hidden />
          </h1>

          <p className="text-lg md:text-2xl text-fg-muted max-w-3xl mb-4 animate-fade-in-up leading-relaxed">
            把「大模型是怎么造出来的」从论文与源码里拎出来，
            <span className="text-fg">变成可点、可拖、可算给你看</span>的交互式教材。
          </p>

          <p className="text-base text-fg-dim max-w-3xl mb-10 animate-fade-in-up leading-relaxed">
            三个最新最知名的开源旗舰 ——
            <span className="text-k3 font-semibold"> Kimi K3</span> ·
            <span className="text-v4 font-semibold"> DeepSeek V4.1 Flash</span> ·
            <span className="text-qwen font-semibold"> Qwen3.8</span> ——
            一份完整的训练流程，一批 PyTorch 高频算子。
          </p>

          <div className="flex flex-wrap gap-4 mb-16 animate-fade-in-up">
            <Link href="/architecture" className="btn-primary">
              先看层骨架对比 →
            </Link>
            <Link href="/plan" className="btn-ghost">
              建设方案 v2.1
            </Link>
          </div>

          {/* 数据条 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl">
            <Stat value="3" label="焦点模型" />
            <Stat value="14" label="架构模块页" />
            <Stat value="93" label="最深模型层数" />
            <Stat value="20" label="高频算子" />
          </div>
        </div>
        <div className="rule" />
      </section>

      {/* ============ 焦点模型 ============ */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <SectionHead
          eyebrow="Focus Models"
          title="三个焦点模型"
          desc="都是 2026 年最新、权重已开放的开源旗舰。点开任一卡片进入它的解剖页。"
        />
        <div className="grid md:grid-cols-3 gap-5">
          {MODEL_LIST.map((m) => (
            <Link
              key={m.id}
              href={modelPath(m.id)}
              className="panel p-5 border-t-2 flex flex-col card-interactive"
              style={{ borderTopColor: m.hex }}
            >
              <div className="eyebrow mb-1.5">{m.released}</div>
              <h3 className={`font-bold text-lg mb-0.5 ${m.textClass}`}>{m.name}</h3>
              <div className="font-mono text-[11px] text-fg-dim mb-3">{m.fullName}</div>
              <p className="text-sm text-fg-muted leading-relaxed mb-4">{m.headline}</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <Metric label="总参数" value={m.params.total} hex={m.hex} />
                <Metric label="层数" value={String(m.arch.total)} hex={m.hex} />
              </div>

              <div className="border-t border-line pt-3 mt-auto">
                <div className="eyebrow mb-2">模块</div>
                <ul className="space-y-1">
                  {m.modules.map((mod) => (
                    <li key={mod.slug} className="text-xs text-fg-muted leading-relaxed">
                      <span className={`font-mono ${m.textClass}`}>·</span> {mod.name}
                      <span className="text-fg-dim"> — {mod.oneLine}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 font-mono text-[11px] text-fg-dim">
                进入 {m.name} 解剖页 →
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6"><div className="rule" /></div>

      {/* ============ 层骨架对比（核心交互） ============ */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <SectionHead
          eyebrow="Layer Architecture"
          title="层骨架对比 · 双模型层墙"
          desc="K3 与 Qwen3.8 的宏循环完全同构（23 × 4），差别只在「线性注意力」与「全注意力」各自怎么实现 —— 这是本站最有原创价值的一张图。"
        />
        <div className="panel p-6">
          <LayerWall ids={['k3', 'qwen', 'v4']} maxLayers={13} />
        </div>
        <div className="mt-4">
          <Link href="/architecture/alignment" className="btn-ghost">
            打开完整的双模型对齐层墙 →
          </Link>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6"><div className="rule" /></div>

      {/* ============ 横向专题 ============ */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <SectionHead
          eyebrow="Cross-cutting Topics"
          title="横向专题 · 同一问题的三种解法"
          desc="单个模型的解剖页只能看到一种答案。把三家并排放，取舍才显出来 —— 每个专题都配一个可拖组件。"
        />
        <div className="grid md:grid-cols-2 gap-5">
          {TOPICS.map((t) => (
            <Link key={t.slug} href={`/topics/${t.slug}`} className="card-interactive p-6">
              <div className="eyebrow mb-2">{t.entries.length} 家并排</div>
              <h3 className="text-xl font-bold mb-2">{t.title}</h3>
              <p className="text-sm text-fg mb-3 font-mono leading-relaxed">「{t.question}」</p>
              <p className="text-sm text-fg-muted leading-relaxed mb-4">{t.body}</p>
              <div className="flex flex-wrap gap-2">
                {t.entries.map((e) => (
                  <span
                    key={e.model}
                    className="font-mono text-[10px] px-2 py-0.5 rounded border"
                    style={{
                      color: MODELS[e.model].hex,
                      borderColor: `${MODELS[e.model].hex}55`,
                      background: `${MODELS[e.model].hex}12`,
                    }}
                  >
                    {MODELS[e.model].name}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6"><div className="rule" /></div>

      {/* ============ 规格对照表 ============ */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <SectionHead
          eyebrow="Specification"
          title="关键维度横向对照"
          desc="十项最能区分设计取向的指标并排放。数据核实于 2026-09-14，来源见页脚仓库。"
        />
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left p-3 eyebrow font-normal">维度</th>
                <th className="text-left p-3 eyebrow font-normal text-k3">Kimi K3</th>
                <th className="text-left p-3 eyebrow font-normal text-v4">V4.1 Flash</th>
                <th className="text-left p-3 eyebrow font-normal text-qwen">Qwen3.8</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((r) => (
                <tr key={r.dim} className="border-b border-line/50 hover:bg-white/[0.02] transition">
                  <td className="p-3 font-mono text-xs text-fg-dim whitespace-nowrap">{r.dim}</td>
                  <td className="p-3 text-fg-muted">{r.k3}</td>
                  <td className="p-3 text-fg-muted">{r.v4}</td>
                  <td className="p-3 text-fg-muted">{r.qwen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6"><div className="rule" /></div>

      {/* ============ 三轨 ============ */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <SectionHead
          eyebrow="Information Architecture"
          title="三轨信息架构"
          desc="站点由三条轨道组成，彼此通过「同一问题的三种解法」横向专题交叉链接。"
        />
        <div className="grid md:grid-cols-3 gap-5">
          {TRACKS.map((t) => {
            const Icon = t.icon
            const m = MODELS[t.accent]
            return (
              <Link key={t.id} href={t.href} className="card-interactive p-6 border-t-2" style={{ borderTopColor: m.hex }}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5" style={{ color: m.hex }} />
                  <span className="eyebrow">轨道 {t.id}</span>
                </div>
                <h3 className="text-xl font-bold mb-1">{t.title}</h3>
                <p className="text-sm text-fg-dim mb-4">{t.subtitle}</p>
                <p className="text-fg-muted mb-4 leading-relaxed text-sm">{t.body}</p>
                <ul className="text-xs text-fg-dim space-y-1 font-mono">
                  {t.bullets.map((b) => (
                    <li key={b}>· {b}</li>
                  ))}
                </ul>
              </Link>
            )
          })}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6"><div className="rule" /></div>

      {/* ============ 建设路线图 ============ */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <SectionHead
          eyebrow="Roadmap"
          title="建设路线图"
          desc="P0–P2 已上线，P3 进行中。进度随仓库同步更新。"
        />
        <div className="panel p-6 space-y-0">
          {ROADMAP.map((p, i) => (
            <div key={p.id} className="flex gap-4">
              <div className="flex flex-col items-center pt-1">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background:
                      p.status === 'done' ? '#22D3EE' : p.status === 'doing' ? '#A78BFA' : '#1B2740',
                    boxShadow: p.status === 'doing' ? '0 0 12px #A78BFA' : undefined,
                  }}
                />
                {i < ROADMAP.length - 1 && <span className="w-px flex-1 bg-line mt-1" />}
              </div>
              <div className={i < ROADMAP.length - 1 ? 'pb-7' : ''}>
                <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                  <span className="font-mono text-xs text-fg-dim">{p.id}</span>
                  <span className={`font-semibold ${p.status === 'todo' ? 'text-fg-muted' : 'text-fg'}`}>
                    {p.title}
                  </span>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-sm text-fg-muted leading-relaxed">{p.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ---------------- 小组件 ---------------- */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="stat-value text-2xl md:text-3xl">{value}</div>
      <div className="text-sm text-fg-dim mt-1">{label}</div>
    </div>
  )
}

function Metric({ label, value, hex }: { label: string; value: string; hex: string }) {
  return (
    <div className="rounded-lg border border-line bg-raised/40 px-3 py-2">
      <div className="font-mono font-semibold text-base" style={{ color: hex }}>
        {value}
      </div>
      <div className="text-[11px] text-fg-dim mt-0.5">{label}</div>
    </div>
  )
}

function SectionHead({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <div className="mb-8">
      <div className="eyebrow mb-2">{eyebrow}</div>
      <h2 className="text-2xl md:text-3xl font-bold mb-2.5">{title}</h2>
      <p className="text-fg-muted max-w-3xl leading-relaxed">{desc}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: PhaseStatus }) {
  const map: Record<PhaseStatus, { text: string; cls: string }> = {
    done:  { text: '已上线', cls: 'text-neon border-neon/40 bg-neon/10' },
    doing: { text: '进行中', cls: 'text-k3 border-k3/40 bg-k3/10' },
    todo:  { text: '待开始', cls: 'text-fg-dim border-line bg-white/[0.02]' },
  }
  const s = map[status]
  return (
    <span className={`font-mono text-[10px] px-2 py-0.5 rounded border ${s.cls}`}>{s.text}</span>
  )
}
