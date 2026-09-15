/**
 * A1 · 开源模型全景对照表 —— 数据层
 *
 * 与 models.ts 的分工：
 *   models.ts  = 三个焦点模型的「逐层解剖」数据源（深，3 个）
 *   panorama.ts = 12 个代表性开源模型的「横向对照」数据源（宽，看趋势）
 *
 * 选入标准不是「谁最强」，而是「它在哪条杠杆上推了一步」：
 *   稀疏化（MoE）/ 注意力算法 / 长上下文 / 稠密基线 / 多模态编码
 *
 * ⚠️ 部分模型的层数与隐藏维未在官方口径中给出，这里留空渲染成「—」，
 *    宁可少写一个数字，也不写看起来像事实的猜测。
 *    三个焦点模型的数字与 models.ts 一致，核实于 2026-09-14。
 */

import type { ModelId } from './models'

/** 这模型主要推的是哪条杠杆 */
export type Lever = 'moe' | 'attn' | 'ctx' | 'dense' | 'multi'

/** 注意力形态 */
export type AttnKind = 'full' | 'sparse' | 'hybrid' | 'linear'

export interface PanoramaModel {
  id: string
  name: string
  org: string
  /** 发布时间，用于排序与散点横轴 */
  released: { y: number; m?: number }
  /** 展示用 */
  releasedLabel: string
  /** 排序用数值：年 + (月-1)/12 */
  t: number
  /** 总参数 / 激活参数（B）。稠密模型两者相同 */
  total: number
  active: number
  /** 层数；未公开则留空 */
  layers?: number
  hidden?: number
  attn: string
  attnKind: AttnKind
  /** MoE 配置；稠密模型留空 */
  experts?: string
  ctx: number
  ctxLabel: string
  license: string
  /** open = 宽松/近似宽松；restricted = 有使用限制或自定义许可 */
  licenseTone: 'open' | 'restricted'
  lever: Lever
  /** 一句话：它推进了什么 */
  why: string
  /** 焦点模型才有，用于跳到解剖页 */
  focus?: ModelId
}

export const LEVER_META: Record<Lever, { label: string; hex: string; desc: string }> = {
  moe: {
    label: '稀疏化',
    hex: '#A78BFA',
    desc: '把总参数堆上去，每次只激活一小部分 —— 用显存换容量',
  },
  attn: {
    label: '注意力',
    hex: '#22D3EE',
    desc: '改注意力算法本身：线性化、稀疏化、混合配比',
  },
  ctx: {
    label: '长上下文',
    hex: '#FB923C',
    desc: '让 KV Cache 存得下 —— 压维度、压精度、减层数',
  },
  dense: {
    label: '稠密基线',
    hex: '#94A3B8',
    desc: '不稀疏，全参数参与每次计算 —— 对照组的意义大于性能',
  },
  multi: {
    label: '多模态',
    hex: '#F472B6',
    desc: '图像/视频怎么进 Transformer：编码策略与位置编码',
  },
}

export const ATTN_KIND_LABEL: Record<AttnKind, string> = {
  full: '全注意力',
  sparse: '稀疏注意力',
  hybrid: '线性 + 全注意力混合',
  linear: '线性注意力',
}

/* ------------------------------------------------------------------ */
/* 12 个模型                                                            */
/* ------------------------------------------------------------------ */

function t(y: number, m = 6): number {
  return y + (m - 1) / 12
}

export const PANORAMA: PanoramaModel[] = [
  {
    id: 'llama31-405b',
    name: 'Llama 3.1 405B',
    org: 'Meta',
    released: { y: 2024, m: 7 },
    releasedLabel: '2024.07',
    t: t(2024, 7),
    total: 405,
    active: 405,
    layers: 126,
    hidden: 16384,
    attn: 'GQA · 8 KV 头',
    attnKind: 'full',
    ctx: 131072,
    ctxLabel: '128K',
    license: 'Llama 3.1 Community',
    licenseTone: 'restricted',
    lever: 'dense',
    why: '稠密路线的顶点，也是后面所有「稀疏化省了多少」的对照组：405B 每次前向都要全部参与计算。',
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek V3',
    org: 'DeepSeek',
    released: { y: 2024, m: 12 },
    releasedLabel: '2024.12',
    t: t(2024, 12),
    total: 671,
    active: 37,
    layers: 61,
    hidden: 7168,
    attn: 'MLA · latent 512',
    attnKind: 'full',
    experts: '256 选 8 + 1 共享',
    ctx: 131072,
    ctxLabel: '128K',
    license: 'MIT',
    licenseTone: 'open',
    lever: 'moe',
    why: '把「MLA + MoE」这一整套跑通并开源：KV 压成 latent 不只是论文里的想法，是可以训出来的。',
  },
  {
    id: 'qwen3-235b',
    name: 'Qwen3-235B-A22B',
    org: '阿里巴巴',
    released: { y: 2025, m: 4 },
    releasedLabel: '2025.04',
    t: t(2025, 4),
    total: 235,
    active: 22,
    layers: 94,
    hidden: 4096,
    attn: 'GQA',
    attnKind: 'full',
    experts: '128 选 8',
    ctx: 32768,
    ctxLabel: '32K（可扩 131K）',
    license: 'Apache 2.0',
    licenseTone: 'open',
    lever: 'moe',
    why: '把「思考 / 非思考」做成同一个模型的两种模式 —— 推理预算变成了一个可调旋钮。',
  },
  {
    id: 'minimax-m1',
    name: 'MiniMax-M1',
    org: 'MiniMax',
    released: { y: 2025, m: 6 },
    releasedLabel: '2025.06',
    t: t(2025, 6),
    total: 456,
    active: 45.9,
    layers: 92,
    hidden: 6144,
    attn: 'Lightning Attention · 7:1 混合',
    attnKind: 'hybrid',
    experts: '32 选 2',
    ctx: 1000000,
    ctxLabel: '1M',
    license: 'Apache 2.0',
    licenseTone: 'open',
    lever: 'attn',
    why: '线性注意力第一次在旗舰尺寸上工程化落地：7 层线性配 1 层 softmax，1M 上下文才跑得动。',
  },
  {
    id: 'kimi-k2',
    name: 'Kimi K2',
    org: 'Moonshot AI',
    released: { y: 2025, m: 7 },
    releasedLabel: '2025.07',
    t: t(2025, 7),
    total: 1000,
    active: 32,
    layers: 61,
    hidden: 7168,
    attn: 'MLA · 64 头',
    attnKind: 'full',
    experts: '384 选 8 + 1 共享',
    ctx: 131072,
    ctxLabel: '128K',
    license: 'Modified MIT',
    licenseTone: 'open',
    lever: 'moe',
    why: '把稀疏度推到 1/32：1T 总参数只激活 32B。K3 是它的直系后代 —— KDA 就是在这套骨架上加的。',
  },
  {
    id: 'glm-45',
    name: 'GLM-4.5',
    org: '智谱',
    released: { y: 2025, m: 7 },
    releasedLabel: '2025.07',
    t: t(2025, 7),
    total: 355,
    active: 32,
    attn: 'GQA',
    attnKind: 'full',
    ctx: 131072,
    ctxLabel: '128K',
    license: 'MIT',
    licenseTone: 'open',
    lever: 'moe',
    why: '中量级 MoE 的代表：不追参数纪录，把 355B/32B 卡在单节点能部署的区间里。',
  },
  {
    id: 'gpt-oss-120b',
    name: 'gpt-oss-120b',
    org: 'OpenAI',
    released: { y: 2025, m: 8 },
    releasedLabel: '2025.08',
    t: t(2025, 8),
    total: 117,
    active: 5.1,
    layers: 36,
    hidden: 2880,
    attn: 'GQA · 带 sink 与可学习偏置',
    attnKind: 'full',
    experts: '128 选 4',
    ctx: 131072,
    ctxLabel: '128K',
    license: 'Apache 2.0',
    licenseTone: 'open',
    lever: 'ctx',
    why: '原生 MXFP4 量化到骨子里：117B 的模型单卡 80GB 能跑，精度不再只是部署阶段的事。',
  },
  {
    id: 'qwen3-vl',
    name: 'Qwen3-VL-235B',
    org: '阿里巴巴',
    released: { y: 2025, m: 10 },
    releasedLabel: '2025.10',
    t: t(2025, 10),
    total: 235,
    active: 22,
    attn: 'DeepStack + Interleaved-MRoPE',
    attnKind: 'full',
    ctx: 262144,
    ctxLabel: '256K（可扩 1M）',
    license: 'Apache 2.0',
    licenseTone: 'open',
    lever: 'multi',
    why: '图像 token 怎么和文字混在一起：DeepStack 把视觉特征注入多层，位置编码要同时管时间和空间。',
  },
  {
    id: 'deepseek-v32',
    name: 'DeepSeek V3.2',
    org: 'DeepSeek',
    released: { y: 2025, m: 12 },
    releasedLabel: '2025.12',
    t: t(2025, 12),
    total: 685,
    active: 37,
    layers: 61,
    hidden: 7168,
    attn: 'MLA + DSA 稀疏注意力',
    attnKind: 'sparse',
    experts: '256 选 8 + 1 共享',
    ctx: 131072,
    ctxLabel: '128K',
    license: 'MIT',
    licenseTone: 'open',
    lever: 'attn',
    why: '从「压 KV 的维度」转向「少看一些 key」：DSA 是 V4.1 Flash 的 CSA2 的前身。',
  },
  {
    id: 'kimi-k3',
    name: 'Kimi K3',
    org: 'Moonshot AI',
    released: { y: 2026, m: 7 },
    releasedLabel: '2026.07',
    t: t(2026, 7),
    total: 2800,
    active: 104,
    layers: 93,
    hidden: 7168,
    attn: 'KDA 线性 + Gated MLA · 3:1',
    attnKind: 'hybrid',
    experts: '896 选 16 + 2 共享',
    ctx: 1048576,
    ctxLabel: '1M',
    license: 'Kimi K3 License',
    licenseTone: 'restricted',
    lever: 'attn',
    why: '3:1 配比的教科书级案例：93 层里只有 23 层存 KV，削减 75% —— 本站反复出现的那条杠杆。',
    focus: 'k3',
  },
  {
    id: 'qwen3-8',
    name: 'Qwen3.8-2.4T-A95B',
    org: '阿里巴巴',
    released: { y: 2026 },
    releasedLabel: '2026',
    t: t(2026, 8),
    total: 2400,
    active: 95,
    layers: 92,
    hidden: 8192,
    attn: 'Gated DeltaNet + Gated Attention · 3:1',
    attnKind: 'hybrid',
    experts: '512 选 10 + 1 共享',
    ctx: 262144,
    ctxLabel: '262K（可扩 1M）',
    license: 'Apache 2.0',
    licenseTone: 'open',
    lever: 'attn',
    why: '和 K3 共用 23 × 4 的宏循环，却用完全不同的零件 —— 一个压 KV 维度，一个压 KV 头数（16:1 GQA）。',
    focus: 'qwen',
  },
  {
    id: 'deepseek-v41-flash',
    name: 'DeepSeek V4.1 Flash',
    org: 'DeepSeek',
    released: { y: 2026, m: 9 },
    releasedLabel: '2026.09',
    t: t(2026, 9),
    total: 552,
    active: 16,
    layers: 40,
    hidden: 7168,
    attn: 'CSA2 · Full / Reindex / Reuse 三模式',
    attnKind: 'sparse',
    experts: '384 选 6 + 1 共享',
    ctx: 1048576,
    ctxLabel: '1M',
    license: 'MIT',
    licenseTone: 'open',
    lever: 'ctx',
    why: '不在层间配比上做文章，而是纵向切分（20 编码 + 20 解码）+ FP4 主 KV，直接做到 890 字节 / token。',
    focus: 'v4',
  },
]

/* ------------------------------------------------------------------ */
/* 筛选与排序                                                           */
/* ------------------------------------------------------------------ */

export type FilterId = 'all' | 'moe' | 'hybrid' | 'sparse' | 'long' | 'open' | 'focus'

export const FILTERS: { id: FilterId; label: string; hint: string }[] = [
  { id: 'all', label: '全部', hint: '12 个模型全铺开' },
  { id: 'focus', label: '三个焦点模型', hint: '本站逐层解剖的那三个' },
  { id: 'moe', label: '只看 MoE', hint: '总参数 ≠ 激活参数' },
  { id: 'hybrid', label: '线性 + 全注意力混合', hint: '层间配比这条路' },
  { id: 'sparse', label: '稀疏注意力', hint: '少看一些 key' },
  { id: 'long', label: '上下文 ≥ 1M', hint: '长上下文俱乐部' },
  { id: 'open', label: '宽松许可', hint: 'MIT / Apache 2.0 / Modified MIT' },
]

export function applyFilter(id: FilterId, list: PanoramaModel[]): PanoramaModel[] {
  switch (id) {
    case 'focus':
      return list.filter((m) => !!m.focus)
    case 'moe':
      return list.filter((m) => !!m.experts)
    case 'hybrid':
      return list.filter((m) => m.attnKind === 'hybrid')
    case 'sparse':
      return list.filter((m) => m.attnKind === 'sparse')
    case 'long':
      return list.filter((m) => m.ctx >= 1_000_000)
    case 'open':
      return list.filter((m) => m.licenseTone === 'open')
    default:
      return list
  }
}

export type SortId = 'time' | 'timeDesc' | 'total' | 'active' | 'sparsity' | 'ctx' | 'layers'

export const SORTS: { id: SortId; label: string }[] = [
  { id: 'time', label: '发布时间 ↑' },
  { id: 'timeDesc', label: '发布时间 ↓' },
  { id: 'total', label: '总参数' },
  { id: 'active', label: '激活参数' },
  { id: 'sparsity', label: '稀疏度' },
  { id: 'ctx', label: '上下文' },
  { id: 'layers', label: '层数' },
]

export function applySort(id: SortId, list: PanoramaModel[]): PanoramaModel[] {
  const out = [...list]
  const num = (v: number | undefined) => (v == null ? -1 : v)
  switch (id) {
    case 'time':
      return out.sort((a, b) => a.t - b.t)
    case 'timeDesc':
      return out.sort((a, b) => b.t - a.t)
    case 'total':
      return out.sort((a, b) => b.total - a.total)
    case 'active':
      return out.sort((a, b) => b.active - a.active)
    case 'sparsity':
      // 稀疏度 = 激活 / 总参，越小越稀疏
      return out.sort((a, b) => a.active / a.total - b.active / b.total)
    case 'ctx':
      return out.sort((a, b) => b.ctx - a.ctx)
    case 'layers':
      return out.sort((a, b) => num(b.layers) - num(a.layers))
    default:
      return out
  }
}

/** 稀疏度：每 100 个参数里激活几个 */
export function sparsityOf(m: PanoramaModel): number {
  return (m.active / m.total) * 100
}

export const FOCUS_IDS = new Set(PANORAMA.filter((m) => m.focus).map((m) => m.id))
