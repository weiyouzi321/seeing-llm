/**
 * 三个焦点模型的真实规格 —— 全站唯一数据源。
 *
 * 数据来源：官方模型卡 / 技术报告 / HF & ModelScope 权重仓库，核实于 2026-09-14。
 * ⚠️ 改动此处即改动全站渲染，务必以官方来源复核后再动。
 */

export type ModelId = 'k3' | 'v4' | 'qwen'

/** 子层类型：决定可视化配色 */
export type LayerKind = 'linear' | 'full' | 'dense' | 'enc' | 'dec'

export interface Seg {
  kind: LayerKind
  label: string
  sub: string
  count: number
}

export interface LayerArch {
  /** macro = 宏循环（K3 / Qwen3.8）；split = 纵向切分（V4.1 Flash） */
  style: 'macro' | 'split'
  formula: string
  total: number
  prefix?: Seg[]
  macro?: Seg[]
  repeat?: number
  groups?: { title: string; sub: string; kind: LayerKind; count: number }[]
}

export interface SpecRow {
  label: string
  value: string
}

export interface ModuleRef {
  slug: string
  name: string
  oneLine: string
}

export interface FocusModel {
  id: ModelId
  name: string
  fullName: string
  /** Tailwind 类名（显式写死，不要用 `text-${id}` 动态拼接 —— JIT 扫不到） */
  textClass: string
  borderClass: string
  bgClass: string
  dotClass: string
  /** 内联样式用的 hex */
  hex: string
  released: string
  headline: string
  params: { total: string; active: string }
  arch: LayerArch
  spec: SpecRow[]
  modules: ModuleRef[]
}

/* ------------------------------------------------------------------ */
/* 层配色：线性注意力 / 全注意力 / 稠密 / 编码 / 解码                     */
/* ------------------------------------------------------------------ */

export const LAYER_STYLE: Record<LayerKind, { fill: string; stroke: string; text: string; label: string }> = {
  linear: { fill: 'rgba(167,139,250,0.16)', stroke: '#A78BFA', text: '#C4B5FD', label: '线性注意力' },
  full:   { fill: 'rgba(34,211,238,0.16)',  stroke: '#22D3EE', text: '#67E8F9', label: '全注意力' },
  dense:  { fill: 'rgba(148,163,184,0.16)', stroke: '#94A3B8', text: '#CBD5E1', label: '稠密层' },
  enc:    { fill: 'rgba(34,211,238,0.16)',  stroke: '#22D3EE', text: '#67E8F9', label: '编码器' },
  dec:    { fill: 'rgba(251,146,60,0.16)',  stroke: '#FB923C', text: '#FDBA74', label: '解码器' },
}

/* ------------------------------------------------------------------ */
/* Kimi K3                                                             */
/* ------------------------------------------------------------------ */

const K3: FocusModel = {
  id: 'k3',
  name: 'Kimi K3',
  fullName: 'moonshotai/Kimi-K3',
  textClass: 'text-k3',
  borderClass: 'border-k3',
  bgClass: 'bg-k3',
  dotClass: 'bg-k3',
  hex: '#A78BFA',
  released: '2026-07-16',
  headline: '把线性注意力推到 3:1 —— 每 4 层只有 1 层做全注意力',
  params: { total: '2.8T', active: '104B' },
  arch: {
    style: 'macro',
    formula: '1 稠密 + 23 × (3 KDA + 1 Gated MLA) = 93 层',
    total: 93,
    prefix: [{ kind: 'dense', label: 'Dense', sub: '稠密层', count: 1 }],
    macro: [
      { kind: 'linear', label: 'KDA', sub: 'Kimi Delta Attention', count: 3 },
      { kind: 'full', label: 'Gated MLA', sub: '门控多头潜在注意力', count: 1 },
    ],
    repeat: 23,
  },
  spec: [
    { label: '总参数 / 激活', value: '2.8T / 104B' },
    { label: '层数', value: '93 = 1 + 23 × 4' },
    { label: '专家配置', value: '896 选 16 + 2 共享' },
    { label: '隐藏维 / 注意力头', value: '7168 / 96' },
    { label: 'Latent / 专家中间维', value: '3584 / 3072' },
    { label: '词表', value: '160K' },
    { label: '上下文', value: '1M' },
    { label: '激活函数', value: 'SiTU-GLU' },
    { label: '视觉塔', value: 'MoonViT-V2 · 401M' },
    { label: '量化', value: 'MXFP4 权重 / MXFP8 激活' },
  ],
  modules: [
    { slug: 'kda', name: 'KDA', oneLine: 'Kimi Delta Attention —— 用增量规则做线性注意力，把长上下文的代价摊平' },
    { slug: 'gated-mla', name: 'Gated MLA', oneLine: '门控多头潜在注意力 —— 每 4 层一次的全注意力，负责补回线性层的表达力' },
    { slug: 'attnres', name: 'AttnRes', oneLine: '注意力残差 —— 用不到 2% 的额外算力换 1.25× 训练效率' },
    { slug: 'latent-moe', name: 'Stable LatentMoE', oneLine: '896 选 16 的稀疏路由怎么训练才不崩' },
    { slug: 'situ-glu', name: 'SiTU-GLU', oneLine: 'K3 自研激活函数，兼顾低精度稳定与表达力' },
  ],
}

/* ------------------------------------------------------------------ */
/* DeepSeek V4.1 Flash                                                 */
/* ------------------------------------------------------------------ */

const V4: FocusModel = {
  id: 'v4',
  name: 'DeepSeek V4.1 Flash',
  fullName: 'deepseek-ai/DeepSeek-V4.1-Flash',
  textClass: 'text-v4',
  borderClass: 'border-v4',
  bgClass: 'bg-v4',
  dotClass: 'bg-v4',
  hex: '#22D3EE',
  released: '2026-09-10',
  headline: '不是「更深的 Decoder」，而是把 Encoder 拉回来做全局 KV',
  params: { total: '552B', active: 'prefill 8B / decode 16B' },
  arch: {
    style: 'split',
    formula: 'CED 40 层 = 20 编码 + 20 解码',
    total: 40,
    groups: [
      { title: 'Causal Encoder', sub: '20 层 · 建全局 KV', kind: 'enc', count: 20 },
      { title: 'Decoder', sub: '20 层 · 复用编码器 KV', kind: 'dec', count: 20 },
    ],
  },
  spec: [
    { label: '总参数', value: '552B MoE' },
    { label: '层数', value: '40 = 20 编码 + 20 解码' },
    { label: '激活参数', value: 'prefill 8B / decode 16B（非对称）' },
    { label: '专家配置', value: '384 选 6 + 1 共享' },
    { label: '稀疏注意力', value: 'CSA2 · Full / Reindex / Reuse 三模式' },
    { label: 'KV Cache', value: 'FP4 主 KV · 890 字节 / token' },
    { label: '条件记忆', value: 'Engram 196B' },
    { label: '残差', value: 'Single-Pass mHC' },
    { label: '解码加速', value: 'DSpark 半自回归草稿' },
    { label: '后训练', value: 'SFT → RL → OPD' },
  ],
  modules: [
    { slug: 'ced', name: 'CED', oneLine: 'Causal Encoder-Decoder —— 解码器的全局 KV 由编码器末层投影而来' },
    { slug: 'csa2', name: 'CSA2', oneLine: '每层三选一的稀疏模式：Full / Reindex / Reuse，跨层共享主 KV' },
    { slug: 'kv-compression', name: 'KV 压缩', oneLine: 'FP4 主 KV + SWA Bounded Replay，每 token 压到 890 字节' },
    { slug: 'engram', name: 'Engram', oneLine: '196B 条件记忆 —— 按 token 稀疏查表，把知识从计算里拆出来' },
    { slug: 'mhc', name: 'Single-Pass mHC', oneLine: 'Mega-mHC kernel，把流形约束残差合并成单次扫描' },
    { slug: 'dspark', name: 'DSpark', oneLine: '半自回归草稿 + 置信度调度验证' },
  ],
}

/* ------------------------------------------------------------------ */
/* Qwen3.8-2.4T-A95B                                                   */
/* ------------------------------------------------------------------ */

const QWEN: FocusModel = {
  id: 'qwen',
  name: 'Qwen3.8-2.4T-A95B',
  fullName: 'Qwen/Qwen3.8-2.4T-A95B',
  textClass: 'text-qwen',
  borderClass: 'border-qwen',
  bgClass: 'bg-qwen',
  dotClass: 'bg-qwen',
  hex: '#FB923C',
  released: '2026（权重已开放）',
  headline: '和 K3 共用同一副骨架（23×4），差异全在「线性与全注意力各自怎么实现」',
  params: { total: '2.4T', active: '95B' },
  arch: {
    style: 'macro',
    formula: '23 × (3 Gated DeltaNet + 1 Gated Attention) = 92 层',
    total: 92,
    macro: [
      { kind: 'linear', label: 'Gated DeltaNet', sub: '门控 Delta 网络', count: 3 },
      { kind: 'full', label: 'Gated Attention', sub: '门控注意力', count: 1 },
    ],
    repeat: 23,
  },
  spec: [
    { label: '总参数 / 激活', value: '2.4T / 95B' },
    { label: '层数', value: '92 = 23 × 4' },
    { label: '专家配置', value: '512 选 10 + 1 共享' },
    { label: '隐藏维', value: '8192' },
    { label: 'Gated DeltaNet 头数', value: '128 V / 16 QK（dim 128）' },
    { label: 'Gated Attention 头数', value: '64 Q / 4 KV（RoPE dim 64）' },
    { label: '专家中间维', value: '2048' },
    { label: '上下文', value: '262,144 → 可扩至 1,010,000' },
    { label: '词表', value: '248,320（padded）' },
    { label: '推理', value: '多步 MTP · 思考模式默认开启' },
  ],
  modules: [
    { slug: 'gated-deltanet', name: 'Gated DeltaNet', oneLine: '门控 Delta 网络 —— 线性注意力的另一条实现路线' },
    { slug: 'gated-attention', name: 'Gated Attention', oneLine: '64 Q / 4 KV 的极省全注意力，RoPE 只作用在 64 维' },
    { slug: 'mtp', name: 'MTP', oneLine: '多步多 token 预测，一步出多个位置' },
  ],
}

export const MODELS: Record<ModelId, FocusModel> = { k3: K3, v4: V4, qwen: QWEN }

export const MODEL_LIST: FocusModel[] = [K3, V4, QWEN]

/* ------------------------------------------------------------------ */
/* 横向专题                                                            */
/* ------------------------------------------------------------------ */

export interface Topic {
  slug: string
  title: string
  question: string
  body: string
  entries: { model: ModelId; answer: string }[]
}

export const TOPICS: Topic[] = [
  {
    slug: 'moe-sparsity',
    title: 'MoE 稀疏度三家对比',
    question: '路由专家越开越多、每次只选越少，训练为什么不会崩？',
    body: '稀疏度从 1/16 一路推到 1/64，三家给出了三种稳定手段。并排看才看得出「同样的目标，不同的代价」。',
    entries: [
      { model: 'k3', answer: '896 专家选 16 + 2 共享（1/56）。靠 Stable LatentMoE 把路由放进低维 latent 空间做，稳住负载均衡。' },
      { model: 'qwen', answer: '512 专家选 10 + 1 共享（1/51）。专家中间维压到 2048，用更窄的专家换更多专家数。' },
      { model: 'v4', answer: '384 专家选 6 + 1 共享（1/64）。极端稀疏，靠 Single-Pass mHC 的流形约束残差兜底。' },
    ],
  },
  {
    slug: 'kv-cache',
    title: 'KV Cache 三条路线',
    question: '同一个「长上下文太贵」的问题，三家的解法完全不同',
    body: '一条走向「让 KV 变成常数」，一条走向「把 KV 压到极致」，还有一条两者都做。',
    entries: [
      { model: 'k3', answer: '3:1 的线性/全注意力配比 —— 只有 1/4 的层需要存 KV，KV Cache 最多削减 75%。' },
      { model: 'qwen', answer: '同样的 3:1 配比，但线性层用 Gated DeltaNet 实现，状态大小与头数配置不同（128V/16QK）。' },
      { model: 'v4', answer: 'CSA2 + FP4 主 KV —— 不减少要存的层，而是把每个 token 压到 890 字节，持久 KV 约 1/8。' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/* 关键维度横向对照（首页表格）                                          */
/* ------------------------------------------------------------------ */

export interface CompareRow {
  dim: string
  k3: string
  v4: string
  qwen: string
}

export const COMPARE: CompareRow[] = [
  { dim: '总 / 激活参数', k3: '2.8T / 104B', v4: '552B（8B prefill · 16B decode）', qwen: '2.4T / 95B' },
  { dim: '层数', k3: '93 = 1 + 23×4', v4: '40 = 20 编码 + 20 解码', qwen: '92 = 23×4' },
  { dim: '专家配置', k3: '896 → 16 + 2 共享', v4: '384 → 6 + 1 共享', qwen: '512 → 10 + 1 共享' },
  { dim: '路由稀疏度', k3: '1 / 56', v4: '1 / 64', qwen: '1 / 51' },
  { dim: '线性 : 全注意力', k3: '3 : 1（KDA / Gated MLA）', v4: '不适用 · CSA2 稀疏模式', qwen: '3 : 1（DeltaNet / Gated Attn）' },
  { dim: '上下文', k3: '1M', v4: '1M', qwen: '262,144 → 1,010,000' },
  { dim: 'KV Cache 路线', k3: '减少要存的层（−75%）', v4: 'FP4 压缩（890 B/token）', qwen: '减少要存的层（−75%）' },
  { dim: '低精度', k3: 'MXFP4 / MXFP8', v4: 'FP4 主 KV（E2M1）', qwen: '—' },
  { dim: '许可', k3: 'Kimi K3 License', v4: '开源（HF）', qwen: '开源（ModelScope / HF）' },
  { dim: '发布', k3: '2026-07-16', v4: '2026-09-10', qwen: '2026（权重已开放）' },
]

/* ------------------------------------------------------------------ */
/* 建设路线图（首页进度条）                                             */
/* ------------------------------------------------------------------ */

export type PhaseStatus = 'done' | 'doing' | 'todo'

export interface Phase {
  id: string
  title: string
  detail: string
  status: PhaseStatus
}

export const ROADMAP: Phase[] = [
  {
    id: 'P0',
    title: '骨架 + 图片流水线',
    detail: 'Next.js 14 静态导出 · 部署链路打通 · 101 MB 原图 → 2.5 MB',
    status: 'done',
  },
  {
    id: 'P1',
    title: 'Kimi K3 垂直切片',
    detail: '概览页 + 5 个模块页（KDA / Gated MLA / AttnRes / Stable LatentMoE / SiTU-GLU）',
    status: 'doing',
  },
  {
    id: 'P2',
    title: '算子与策略 20 页',
    detail: 'TorchCode 高频前 20：16 个 🔥 + MoE / GQA / Linear Attention / GPT-2 Block',
    status: 'todo',
  },
  {
    id: 'P3',
    title: 'V4.1 Flash + Qwen3.8',
    detail: '补齐两个焦点模型 · 双模型层墙 · 2 个横向专题（MoE 稀疏度 / KV Cache 三条路线）',
    status: 'todo',
  },
  {
    id: 'P4',
    title: '训练全流程',
    detail: 'MiniMind 8 阶段可视时间线（3090 单卡、约 3 元跑完全流程）',
    status: 'todo',
  },
  {
    id: 'P5',
    title: '收尾',
    detail: '剩余 21 个算子走「待补清单」长期滚动 · 全站三轨交叉链接',
    status: 'todo',
  },
]

/* ------------------------------------------------------------------ */
/* 层墙工具：把 arch 展开成一串可用于渲染的层                           */
/* ------------------------------------------------------------------ */

export interface WallLayer {
  kind: LayerKind
  label: string
  sub: string
  /** 在整面墙中的序号（1-based），用于 tooltip */
  index: number
  repeatGroup?: number
}

/** 展开 macro 模式（K3 / Qwen3.8）。只展开前 `maxLayers` 层，避免 DOM 过大。 */
export function expandMacro(m: FocusModel, maxLayers = 24): WallLayer[] {
  const a = m.arch
  if (a.style !== 'macro' || !a.macro) return []
  const out: WallLayer[] = []
  let i = 1
  for (const p of a.prefix ?? []) {
    for (let k = 0; k < p.count && out.length < maxLayers; k++) {
      out.push({ kind: p.kind, label: p.label, sub: p.sub, index: i++ })
    }
  }
  const cycle = a.macro.flatMap((s) => Array.from({ length: s.count }, () => s))
  const repeat = a.repeat ?? 1
  for (let r = 0; r < repeat && out.length < maxLayers; r++) {
    for (const s of cycle) {
      if (out.length >= maxLayers) break
      out.push({ kind: s.kind, label: s.label, sub: s.sub, index: i++, repeatGroup: r + 1 })
    }
  }
  return out
}
