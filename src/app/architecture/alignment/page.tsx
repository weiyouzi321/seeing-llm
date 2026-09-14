import Link from 'next/link'
import { WallAlign } from '@/components/WallAlign'
import { modulePath } from '@/lib/routes'

export const metadata = {
  title: '双模型层墙对齐 · seeing-llm',
  description:
    'Kimi K3 与 Qwen3.8 的宏循环完全同构（23 × 4），差异只在四个可对比的位置：线性注意力位与全注意力位各自怎么实现。',
}

export default function AlignmentPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="font-mono text-xs text-fg-dim mb-6">
        <Link href="/architecture" className="hover:text-neon transition">架构解剖</Link>
        <span className="mx-2">/</span>
        <span className="text-fg">层墙对齐</span>
      </div>

      <div className="eyebrow mb-2">Layer Wall · Alignment</div>
      <h1 className="text-3xl md:text-4xl font-bold mb-3">双模型层墙对齐</h1>
      <p className="text-lg text-fg-muted max-w-3xl leading-relaxed mb-4">
        <span className="text-k3">Kimi K3</span> 与 <span className="text-qwen">Qwen3.8</span>{' '}
        共用同一副宏循环 ——
        <span className="font-mono text-fg"> 23 × 4</span>，
        差异被压缩到四个可以直接对比的位置。把它并排摊开，「这两个模型很像」就不再是一句印象。
      </p>
      <p className="font-mono text-xs text-fg-dim mb-10">
        K3：1 稠密 + 23 × (3 KDA + 1 Gated MLA) = 93 · Qwen3.8：23 × (3 Gated DeltaNet + 1 Gated
        Attention) = 92
      </p>

      <section className="mb-14">
        <WallAlign />
      </section>

      {/* 四个位置的对照表 */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-4">四个位置，摊开看</h2>
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left p-3 eyebrow font-normal">宏循环内的位置</th>
                <th className="text-left p-3 eyebrow font-normal text-k3">Kimi K3</th>
                <th className="text-left p-3 eyebrow font-normal text-qwen">Qwen3.8</th>
                <th className="text-left p-3 eyebrow font-normal">差别在哪</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.pos} className="border-b border-line/50 align-top">
                  <td className="p-3 font-mono text-xs text-fg-dim whitespace-nowrap">{r.pos}</td>
                  <td className="p-3 text-fg-muted">
                    {r.k3}
                    {r.k3Link && (
                      <div className="mt-1">
                        <Link href={modulePath('k3', r.k3Link)} className="font-mono text-[11px] text-k3">
                          模块页 →
                        </Link>
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-fg-muted">
                    {r.qwen}
                    {r.qwenLink && (
                      <div className="mt-1">
                        <Link href={modulePath('qwen', r.qwenLink)} className="font-mono text-[11px] text-qwen">
                          模块页 →
                        </Link>
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-fg-dim text-xs leading-relaxed">{r.diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 为什么值得做这张图 */}
      <section className="mb-14">
        <h2 className="text-xl font-bold mb-4">这张图在说什么</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {INSIGHTS.map((it) => (
            <div key={it.t} className="panel p-5">
              <div className="eyebrow mb-2">{it.tag}</div>
              <h3 className="font-semibold mb-2">{it.t}</h3>
              <p className="text-sm text-fg-muted leading-relaxed">{it.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-4">
        <Link href="/architecture" className="btn-ghost">← 返回架构解剖</Link>
        <Link href="/topics" className="btn-ghost">横向专题 →</Link>
      </div>
    </div>
  )
}

const ROWS = [
  {
    pos: '第 1–3 位（线性）',
    k3: 'KDA · Kimi Delta Attention',
    k3Link: 'kda',
    qwen: 'Gated DeltaNet · 128 V / 16 QK（dim 128）',
    qwenLink: 'gated-deltanet',
    diff: '同为「线性注意力 + 门控」，差别在实现细节与头数配置。两者都不存 KV。',
  },
  {
    pos: '第 4 位（全注意力）',
    k3: 'Gated MLA · latent 3584',
    k3Link: 'gated-mla',
    qwen: 'Gated Attention · 64 Q / 4 KV，RoPE 仅 64 维',
    qwenLink: 'gated-attention',
    diff: '都在补线性层丢掉的表达力。一个把 KV 压成 latent，一个用 16:1 极端 GQA 摊薄。',
  },
  {
    pos: '前缀',
    k3: '1 层稠密（把输入抬到隐藏维）',
    k3Link: null,
    qwen: '无前缀，直接进入宏循环',
    qwenLink: null,
    diff: '93 与 92 的唯一差别 —— 不是结构不同，只是 K3 多了一层入口。',
  },
  {
    pos: 'MoE 位置',
    k3: '896 选 16 + 2 共享（1/56）',
    k3Link: 'latent-moe',
    qwen: '512 选 10 + 1 共享（1/51）',
    qwenLink: null,
    diff: '挂在 FFN 位上，与层骨架正交。稀疏度接近，稳定手段不同。',
  },
]

const INSIGHTS = [
  {
    tag: 'Insight 01',
    t: '3:1 不是巧合',
    body: 'n 层线性配 1 层全注意力，需要存 KV 的层占比就是 1/(n+1)。n = 3 恰好落在「KV 削减 75%」与「每 4 层还能清理一次状态」的平衡点上。',
  },
  {
    tag: 'Insight 02',
    t: '同样的目标，不同的零件',
    body: '两边要的都是「把 KV 压下来」，但一个压缩 KV 的维度（latent），一个压缩 KV 的头数（16:1 GQA）。这意味着它们在推理系统上的优化空间并不一样。',
  },
  {
    tag: 'Insight 03',
    t: 'V4.1 Flash 不在这个坐标系里',
    body: '它没有层间配比，而是纵向切分（20 编码 + 20 解码）。所以它不能跟这两个同源模型逐层对齐 —— 它的杠杆在「跨层共享主 KV」和「FP4 压缩」上。',
  },
]
