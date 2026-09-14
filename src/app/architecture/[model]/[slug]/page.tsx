import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ModuleVizView } from '@/components/moduleviz'
import { MODELS } from '@/lib/models'
import { getModule, getModules } from '@/lib/modules'
import { MODEL_PARAMS, MODEL_ROUTE, getModelByRoute, modulePath } from '@/lib/routes'

/** 静态导出：3 个模型 × 各自模块，共 14 页 */
export function generateStaticParams() {
  return MODEL_PARAMS.flatMap(({ model }) => {
    const id = getModelByRoute(model)!
    return getModules(id).map((mod) => ({ model, slug: mod.slug }))
  })
}

export function generateMetadata({ params }: { params: { model: string; slug: string } }) {
  const id = getModelByRoute(params.model)
  if (!id) return {}
  const mod = getModule(id, params.slug)
  if (!mod) return {}
  return {
    title: `${mod.name} · ${MODELS[id].name} · seeing-llm`,
    description: mod.oneLine,
  }
}

/** 每个可视化的小节标题 —— 让它读起来像「为什么值得拖一下」，而不是「组件 v3」 */
const VIZ_TITLE: Record<string, { title: string; lead: string }> = {
  'attention-scaling': {
    title: '为什么必须上线性注意力',
    lead: '拖动序列长度，看全注意力的 L² 项是怎么失控的。注意短序列段 —— 线性注意力并不总是更省。',
  },
  'moe-routing': {
    title: '路由塌缩是怎么发生的',
    lead: '连续送几批 token 进去，看专家负载怎么开始偏心；打开负载均衡再看基尼系数的变化。',
  },
  'ced-flow': {
    title: 'prompt 侧的 KV 到底要算几遍',
    lead: '对比 decoder-only 与 CED 各要维护多少份 prompt KV。收益全部来自「把 P 从 n 份压成 1 份」。',
  },
  'csa-modes': {
    title: '稀疏挑选漏掉的 key，还能找回来吗',
    lead: '切换三种策略、调大索引器噪声 —— 看「一次漏选」怎么让后续整段 Reuse 层都看不见那个 key。',
  },
  'delta-rule': {
    title: '「写入前先擦除」到底救了什么',
    lead: '点「覆写第 1 条」：纯累加得到的是新旧值的混合，Delta 规则写出来的是精确的新值。',
  },
  'mtp-draft': {
    title: '草稿长度该选几',
    lead: '接受率才是决定有没有收益的那档参数；草稿长度只是在给定接受率下挑一个局部最优。',
  },
}

export default function ModulePage({ params }: { params: { model: string; slug: string } }) {
  const id = getModelByRoute(params.model)
  if (!id) notFound()
  const m = MODELS[id]
  const mod = getModule(id, params.slug)
  if (!mod) notFound()

  const mods = getModules(id)
  const idx = mods.findIndex((x) => x.slug === mod.slug)
  const prev = idx > 0 ? mods[idx - 1] : null
  const next = idx < mods.length - 1 ? mods[idx + 1] : null
  const vizTitle = mod.viz ? VIZ_TITLE[mod.viz] : null

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {/* 面包屑 */}
      <div className="font-mono text-xs text-fg-dim mb-6">
        <Link href="/architecture" className="hover:text-neon transition">架构解剖</Link>
        <span className="mx-2">/</span>
        <Link href={`/architecture/${MODEL_ROUTE[id]}`} className="hover:text-neon transition">
          {m.name}
        </Link>
        <span className="mx-2">/</span>
        <span className={m.textClass}>{mod.name}</span>
      </div>

      {/* 标题 */}
      <div className="eyebrow mb-2">
        {m.name} 模块 {String(idx + 1).padStart(2, '0')} / {String(mods.length).padStart(2, '0')}
      </div>
      <h1 className="text-3xl md:text-4xl font-bold mb-1" style={{ color: m.hex }}>{mod.name}</h1>
      {mod.fullName && <div className="font-mono text-xs text-fg-dim mb-3">{mod.fullName}</div>}
      <p className="text-lg text-fg-muted leading-relaxed mb-10">{mod.oneLine}</p>

      {/* 三段：问题 / 设计 / 取舍 */}
      <div className="space-y-5 mb-12">
        <Block tag="问题" color="#FB923C" title="它要解决什么矛盾">
          {mod.problem}
        </Block>
        <Block tag="设计" color="#22D3EE" title="它怎么解决">
          {mod.design}
        </Block>
        <Block tag="取舍" color="#A78BFA" title="代价是什么">
          {mod.tradeoff}
        </Block>
      </div>

      {/* 交互可视化 */}
      {mod.viz && vizTitle && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-2">{vizTitle.title}</h2>
          <p className="text-sm text-fg-muted mb-4 leading-relaxed">{vizTitle.lead}</p>
          <ModuleVizView viz={mod.viz} />
        </section>
      )}

      {/* 要点 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">关键要点</h2>
        <div className="panel divide-y divide-line">
          {mod.points.map((p) => (
            <div key={p.k} className="p-4 flex gap-4 text-sm">
              <span className="font-mono text-xs text-fg-dim w-32 shrink-0 pt-0.5">{p.k}</span>
              <span className="text-fg-muted leading-relaxed">{p.v}</span>
            </div>
          ))}
        </div>
        {mod.source && (
          <p className="text-xs font-mono text-fg-dim mt-3">参考：{mod.source}</p>
        )}
      </section>

      {/* 横向延伸 */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-3">同一件事，别家怎么做</h2>
        <CrossLinks model={id} slug={mod.slug} />
      </section>

      {/* 上下导航 */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        {prev ? (
          <Link
            href={modulePath(id, prev.slug)}
            className="panel p-4 hover:bg-white/[0.02] transition"
          >
            <div className="eyebrow mb-1">← 上一个</div>
            <div className="font-semibold" style={{ color: m.hex }}>{prev.name}</div>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={modulePath(id, next.slug)}
            className="panel p-4 text-right hover:bg-white/[0.02] transition"
          >
            <div className="eyebrow mb-1">下一个 →</div>
            <div className="font-semibold" style={{ color: m.hex }}>{next.name}</div>
          </Link>
        )}
      </div>

      <Link href={`/architecture/${MODEL_ROUTE[id]}`} className="btn-ghost">
        ← 返回 {m.name} 概览
      </Link>
    </div>
  )
}

/* ---------------- 子件 ---------------- */

function Block({
  tag,
  color,
  title,
  children,
}: {
  tag: string
  color: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="panel p-5 border-l-2" style={{ borderLeftColor: color }}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="font-mono text-[10px] px-2 py-0.5 rounded border"
          style={{ color, borderColor: `${color}66`, background: `${color}1A` }}
        >
          {tag}
        </span>
        <h2 className="font-semibold">{title}</h2>
      </div>
      <p className="text-sm text-fg-muted leading-relaxed">{children}</p>
    </div>
  )
}

/** 按需手写的横向对照 —— 把单个模块挂回「三家的横向取舍」上 */
type CrossTarget = { model: 'k3' | 'v4' | 'qwen' | 'ops'; slug: string; why: string }

const CROSS: Record<string, CrossTarget[]> = {
  'k3:kda': [
    { model: 'qwen', slug: 'gated-deltanet', why: '另一个层位置的同题答案' },
    { model: 'v4', slug: 'csa2', why: '不确定线性化，而是稀疏化' },
  ],
  'k3:gated-mla': [
    { model: 'qwen', slug: 'gated-attention', why: '极端 GQA 摊薄 KV' },
    { model: 'v4', slug: 'kv-compression', why: 'FP4 主 KV 走压缩路线' },
  ],
  'k3:latent-moe': [
    { model: 'v4', slug: 'mhc', why: '更激进的稀疏度靠什么兜底' },
    { model: 'ops', slug: 'moe-routing', why: '路由塌缩的算子级演示' },
  ],
  'k3:situ-glu': [{ model: 'ops', slug: 'relu', why: '朴素 ReLU 的曲线对比' }],
  'k3:attnres': [{ model: 'v4', slug: 'mhc', why: '残差改造的另一条路线' }],
  'v4:ced': [{ model: 'ops', slug: 'kv-cache', why: 'KV Cache 为什么这么贵' }],
  'v4:csa2': [
    { model: 'k3', slug: 'kda', why: '另一个终结 L² 的答案' },
    { model: 'v4', slug: 'kv-compression', why: '主 KV 为什么要压缩存储' },
  ],
  'v4:kv-compression': [
    { model: 'k3', slug: 'gated-mla', why: '减少层数派的答案' },
    { model: 'qwen', slug: 'gated-attention', why: '16:1 GQA 派' },
  ],
  'v4:engram': [{ model: 'v4', slug: 'dspark', why: '另一侧针对访存瓶颈' }],
  'v4:mhc': [{ model: 'k3', slug: 'attnres', why: '残差改造的另一条路线' }],
  'v4:dspark': [
    { model: 'qwen', slug: 'mtp', why: '多步预测也能当草稿器' },
    { model: 'ops', slug: 'beam-search', why: '解码策略家族' },
  ],
  'qwen:gated-deltanet': [
    { model: 'k3', slug: 'kda', why: '同位置的另一种线性实现' },
    { model: 'ops', slug: 'linear-attention', why: '线性注意力的算子级演示' },
  ],
  'qwen:gated-attention': [
    { model: 'k3', slug: 'gated-mla', why: '用 latent 压 KV' },
    { model: 'ops', slug: 'gqa', why: 'GQA 的头分组可视化' },
  ],
  'qwen:mtp': [
    { model: 'v4', slug: 'dspark', why: '另一套草稿 + 验证' },
    { model: 'ops', slug: 'top-k-top-p', why: '采样策略' },
  ],
}

function CrossLinks({ model, slug }: { model: string; slug: string }) {
  const items = CROSS[`${model}:${slug}`] ?? []
  if (items.length === 0) {
    return (
      <p className="text-sm text-fg-muted leading-relaxed">
        这个模块暂时没有配对的横向对照 —— 想看它怎么参与整体取舍，去
        <Link href="/topics" className="text-neon"> 横向专题 </Link>
        或直接翻 <Link href="/architecture/alignment" className="text-neon">双模型层墙对齐</Link>。
      </p>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {items.map((it) => {
        const href = it.model === 'ops' ? `/ops/${it.slug}` : modulePath(it.model, it.slug)
        const label = it.model === 'ops' ? '算子' : MODELS[it.model].name
        const color = it.model === 'ops' ? '#94A3B8' : MODELS[it.model].hex
        return (
          <Link
            key={`${it.model}:${it.slug}`}
            href={href}
            className="card-interactive p-4 border-l-2"
            style={{ borderLeftColor: color }}
          >
            <div className="eyebrow mb-1" style={{ color }}>
              {label}
            </div>
            <div className="font-semibold text-sm mb-1">{CROSS_NAME[it.slug] ?? it.slug}</div>
            <p className="text-xs text-fg-muted leading-relaxed">{it.why}</p>
          </Link>
        )
      })}
    </div>
  )
}

/** 交叉链接目标的显示名（避免再去查一遍数据源） */
const CROSS_NAME: Record<string, string> = {
  kda: 'KDA',
  'gated-mla': 'Gated MLA',
  attnres: 'AttnRes',
  'latent-moe': 'Stable LatentMoE',
  'situ-glu': 'SiTU-GLU',
  ced: 'CED',
  csa2: 'CSA2',
  'kv-compression': 'KV 压缩',
  engram: 'Engram',
  mhc: 'Single-Pass mHC',
  dspark: 'DSpark',
  'gated-deltanet': 'Gated DeltaNet',
  'gated-attention': 'Gated Attention',
  mtp: 'MTP',
  relu: 'ReLU',
  'moe-routing': 'MoE 路由',
  'kv-cache': 'KV Cache',
  'beam-search': 'Beam Search',
  'linear-attention': '线性注意力',
  gqa: 'GQA',
  'top-k-top-p': 'Top-k / Top-p 采样',
}
