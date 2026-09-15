/**
 * A5 · 架构演进时间轴 —— 数据层
 *
 * 与 panorama.ts 的分工：
 *   panorama.ts = 横向比较「同一时刻不同模型差在哪」（空间维度）
 *   evolution.ts = 纵向比较「同一个想法是怎么长出来的」（时间维度）
 *
 * 选入标准：这条是不是后面某个设计的前身？
 * 所以像「Switch Transformer → MoE」、「Performer → 线性注意力 → KDA」这种
 * 当年没火但埋了线的条目，权重比当年的 SOTA 更高。
 *
 * 分五条线索（lane），页面按线索分道渲染，避免把 24 条压成一根线。
 */

export type Lane = 'attn' | 'moe' | 'ctx' | 'arch' | 'train'

export const LANE_META: Record<Lane, { label: string; hex: string; oneLine: string }> = {
  attn: {
    label: '注意力',
    hex: '#22D3EE',
    oneLine: '从 O(L²) 全连接，到稀疏、到线性，再到按层配比混合',
  },
  moe: {
    label: '稀疏化',
    hex: '#A78BFA',
    oneLine: '总参数与计算量脱钩：路由、负载均衡、极端稀疏下的稳定性',
  },
  ctx: {
    label: '上下文与精度',
    hex: '#FB923C',
    oneLine: '位置编码怎么外推、KV 怎么存得下、精度怎么压',
  },
  arch: {
    label: '骨架',
    hex: '#94A3B8',
    oneLine: '整层怎么排：稠密堆叠、宏循环、纵向切分',
  },
  train: {
    label: '训练与对齐',
    hex: '#F472B6',
    oneLine: '缩放律、对齐阶段、推理期算力',
  },
}

export interface EvoEvent {
  id: string
  date: string
  /** 排序 / 定位用：年 + (月-1)/12 */
  t: number
  title: string
  /** 简短归属（论文 / 模型 / 机构） */
  who: string
  lane: Lane
  /** 为什么重要 —— 全书视角，不写八卦 */
  body: string
  /** 站内对应页面；有则渲染成链接 */
  link?: { href: string; label: string }
  /** 与三个焦点模型直接相关 */
  star?: boolean
}

function t(y: number, m = 6): number {
  return y + (m - 1) / 12
}

export const EVOLUTION: EvoEvent[] = [
  {
    id: 'transformer',
    date: '2017.06',
    t: t(2017, 6),
    title: 'Transformer',
    who: 'Google · Attention Is All You Need',
    lane: 'attn',
    body: '把循环结构整个拿掉：任意两个位置之间一跳可达。代价是注意力变成 O(L²) —— 后面十年所有的「省」，本质上都在还这笔债。',
    link: { href: '/ops/multihead-attention', label: 'Multi-Head Attention →' },
  },
  {
    id: 'pretrain',
    date: '2018',
    t: t(2018),
    title: '预训练范式确立',
    who: 'GPT / BERT',
    lane: 'train',
    body: '「先自监督预训练、再下游微调」成为默认路径。模型第一次从「为某个任务训的一次性产物」变成可复用的资产。',
  },
  {
    id: 'sparse-first',
    date: '2019',
    t: t(2019),
    title: '稀疏注意力第一波',
    who: 'Sparse Transformer / Longformer / Big Bird',
    lane: 'attn',
    body: '证明「不是每对位置都需要直接交互」。但模式固定、工程收益有限，真正的稀疏选择要等到 2025 年才变成可学习的。',
  },
  {
    id: 'linear-first',
    date: '2020',
    t: t(2020),
    title: '线性注意力第一波',
    who: 'Performer / Linformer / Reformer',
    lane: 'attn',
    body: '用核技巧把 softmax 拆开，复杂度从 O(L²) 降到 O(L)。理论漂亮但质量掉点，没上旗舰 —— 不过思路没被抛弃，只是缺一个更好的状态更新规则。',
    link: { href: '/ops/linear-attention', label: '线性注意力算子 →' },
  },
  {
    id: 'switch',
    date: '2021.01',
    t: t(2021, 1),
    title: 'Switch Transformer',
    who: 'Google',
    lane: 'moe',
    body: 'MoE 第一次上到 T 规模，路由到 top-1 专家。「总参数」和「前向计算量」从这一刻起彻底脱钩 —— 后面所有稀疏度纪录都建立在这个脱钩上。',
    link: { href: '/ops/moe-routing', label: 'MoE 路由算子 →' },
  },
  {
    id: 'rope',
    date: '2021',
    t: t(2021, 4),
    title: 'RoPE 旋转位置编码',
    who: 'RoFormer',
    lane: 'ctx',
    body: '把绝对位置变成作用在 QK 上的旋转，相对位置自然出现，还能外推。今天三个焦点模型都还在用它 —— 区别只是作用在哪几个维度上。',
    link: { href: '/ops/rope', label: 'RoPE 算子 →' },
  },
  {
    id: 'flashattn',
    date: '2022',
    t: t(2022, 6),
    title: 'FlashAttention',
    who: 'Stanford · DAO 实验室',
    lane: 'attn',
    body: '不改数学，只改读写顺序：IO 感知的分块让注意力不再被显存带宽卡死。「更长的上下文」第一次在工程上真的可行。',
    link: { href: '/ops/sdpa', label: 'Scaled Dot-Product Attention →' },
  },
  {
    id: 'chinchilla',
    date: '2022.03',
    t: t(2022, 3),
    title: 'Chinchilla 缩放律',
    who: 'DeepMind',
    lane: 'train',
    body: '修正了此前的共识：参数和数据要按比例一起涨。此前大家普遍「参数很大、数据偏少」地训，等于浪费了一半算力预算。',
  },
  {
    id: 'rlhf',
    date: '2022.03',
    t: t(2022, 3),
    title: 'InstructGPT / RLHF',
    who: 'OpenAI',
    lane: 'train',
    body: '对齐从「提示词技巧」变成训练流程里的一个正式阶段。从此训练不再止于 next-token 预测。',
  },
  {
    id: 'llama',
    date: '2023.02',
    t: t(2023, 2),
    title: 'LLaMA 与开源基座生态',
    who: 'Meta',
    lane: 'arch',
    body: '权重可用这件事本身改变了研究方式：整个社区从此可以在真实基座上验证想法，而不是只能读论文里的消融。',
  },
  {
    id: 'gqa',
    date: '2023',
    t: t(2023, 5),
    title: 'GQA / MQA 成为标配',
    who: 'Google · LLaMA 2 起普及',
    lane: 'ctx',
    body: '让多个 query 头共用一份 KV。KV Cache 第一刀砍在「头数」上 —— Qwen3.8 的 16:1 就是这条线的极端推演。',
    link: { href: '/ops/gqa', label: 'GQA 算子 →' },
  },
  {
    id: 'mamba',
    date: '2023.12',
    t: t(2023, 12),
    title: 'Mamba · 选择性状态空间',
    who: 'CMU / Princeton',
    lane: 'attn',
    body: '把 RNN 的选择性门控和并行扫描结合起来，推理时状态是常数大小。它和线性注意力后来合流，长成了今天 Gated DeltaNet 一类的结构。',
    link: { href: '/architecture/qwen3-8/gated-deltanet', label: 'Gated DeltaNet 模块 →' },
    star: true,
  },
  {
    id: 'mla',
    date: '2024.05',
    t: t(2024, 5),
    title: 'MLA · 多头潜在注意力',
    who: 'DeepSeek V2',
    lane: 'attn',
    body: 'KV Cache 第二刀砍在「维度」上：不缓存 K、V 本身，而是缓存一个低维 latent，用的时候再投影回来。今天 K3 的 Gated MLA 是它的直系后代。',
    link: { href: '/architecture/kimi-k3/gated-mla', label: 'Gated MLA 模块 →' },
    star: true,
  },
  {
    id: 'llama405',
    date: '2024.07',
    t: t(2024, 7),
    title: 'Llama 3.1 405B',
    who: 'Meta',
    lane: 'arch',
    body: '稠密路线的顶点，也是后面所有「稀疏化到底省了多少」的对照组：405B 每次前向都要全部参与计算。',
  },
  {
    id: 'testtime',
    date: '2024.09',
    t: t(2024, 9),
    title: '推理期算力成为新维度',
    who: 'o1 类模型',
    lane: 'train',
    body: '把算力从训练搬到推理：让模型在给出答案前先「想」一段。从此「这个模型多强」不再是固定值，而取决于你愿意付多少 token。',
  },
  {
    id: 'dsv3',
    date: '2024.12',
    t: t(2024, 12),
    title: 'DeepSeek V3 · MLA + MoE 全套开源',
    who: 'DeepSeek',
    lane: 'moe',
    body: '671B/37B，无辅助损失的负载均衡。MLA + MoE 这一整套不只是论文里可行，而是真的训出来了并开源 —— 后面两年的开源旗舰基本都在这个坐标系里。',
  },
  {
    id: 'r1',
    date: '2025.01',
    t: t(2025, 1),
    title: 'DeepSeek R1 · 可验证奖励上的 RL',
    who: 'DeepSeek',
    lane: 'train',
    body: '在有明确对错的任务上做大规模 RL，把「推理能力」变成可以被奖励直接塑造的东西。训练流程从「预训练 → SFT」变成「预训练 → SFT → RL」。',
  },
  {
    id: 'minimax',
    date: '2025.06',
    t: t(2025, 6),
    title: 'MiniMax-M1 · 7:1 混合 + 1M',
    who: 'MiniMax',
    lane: 'attn',
    body: '层间配比第一次在旗舰尺寸上工程化：7 层线性注意力配 1 层 softmax。1M 上下文才跑得动 —— 也为后来的 3:1 铺了路。',
  },
  {
    id: 'k2',
    date: '2025.07',
    t: t(2025, 7),
    title: 'Kimi K2 · 1T / 32B',
    who: 'Moonshot AI',
    lane: 'moe',
    body: '稀疏度推到 1/32。它是 K3 的直系前身 —— K3 的 KDA 就是在这副骨架上，把其中 3/4 的全注意力层换成线性层。',
    link: { href: '/topics/moe-sparsity', label: 'MoE 稀疏度专题 →' },
  },
  {
    id: 'fp4',
    date: '2025.08',
    t: t(2025, 8),
    title: '原生低精度（MXFP4）',
    who: 'gpt-oss · OCP 标准',
    lane: 'ctx',
    body: '精度从「部署时量化」前移到「训练时就按 4bit 设计」。KV 每 token 的字节数因此能再砍一个数量级，V4.1 Flash 的 890 字节 / token 就是这条线的终点。',
    link: { href: '/topics/kv-cache', label: 'KV Cache 三条路线 →' },
  },
  {
    id: 'dsa',
    date: '2025.12',
    t: t(2025, 12),
    title: 'DSA · 可学习稀疏注意力',
    who: 'DeepSeek V3.2',
    lane: 'attn',
    body: '从「压缩每个 key 的表示」转向「干脆少看一些 key」，而且稀疏模式是可学习的。它是 V4.1 Flash 的 CSA2 的前身。',
    link: { href: '/architecture/deepseek-v4-flash/csa2', label: 'CSA2 模块 →' },
    star: true,
  },
  {
    id: 'k3',
    date: '2026.07',
    t: t(2026, 7),
    title: 'Kimi K3 · KDA + Gated MLA',
    who: 'Moonshot AI',
    lane: 'attn',
    body: '3:1 配比的教科书级案例：93 层里只有 23 层存 KV，削减 75%。KDA 给线性注意力换上了可学习的 delta 规则 —— 2020 年那波线性注意力缺的东西，终于补上了。',
    link: { href: '/architecture/kimi-k3/kda', label: 'KDA 模块 →' },
    star: true,
  },
  {
    id: 'qwen38',
    date: '2026',
    t: t(2026, 8),
    title: 'Qwen3.8 · Gated DeltaNet + Gated Attention',
    who: '阿里巴巴',
    lane: 'attn',
    body: '和 K3 共用同一副 23 × 4 宏循环，却用完全不同的零件：一个压 KV 的维度（latent），一个压 KV 的头数（16:1 GQA）。这是本站最有对比价值的一组。',
    link: { href: '/architecture/alignment', label: '双模型层墙对齐 ⟷' },
    star: true,
  },
  {
    id: 'v41',
    date: '2026.09',
    t: t(2026, 9),
    title: 'V4.1 Flash · CED 纵向切分',
    who: 'DeepSeek',
    lane: 'arch',
    body: '不在层间配比上做文章，而是把 Encoder 请回来做全局 KV：40 层 = 20 编码 + 20 解码。另一条完全不同的路。',
    link: { href: '/architecture/deepseek-v4-flash', label: 'V4.1 Flash 解剖 →' },
    star: true,
  },
]

/** 页面上按 lane 分组后的顺序 */
export const LANE_ORDER: Lane[] = ['attn', 'moe', 'ctx', 'arch', 'train']

export const EVO_MIN = 2017
export const EVO_MAX = 2027
