/**
 * Kimi K3 模块文档 —— P1 垂直切片的内容源。
 *
 * 每个模块统一回答三个问题：
 *   1. problem  它要解决的矛盾是什么
 *   2. design   它怎么解决
 *   3. tradeoff 代价是什么（没有免费的午餐）
 */

export interface K3ModuleDoc {
  slug: string
  name: string
  fullName?: string
  oneLine: string
  problem: string
  design: string
  tradeoff: string
  points: { k: string; v: string }[]
  /** 该页要挂载的交互组件 */
  viz?: 'attention-scaling'
  source?: string
}

export const K3_MODULES: K3ModuleDoc[] = [
  {
    slug: 'kda',
    name: 'KDA',
    fullName: 'Kimi Delta Attention',
    oneLine: '用增量规则做线性注意力，把长上下文的代价从平方级压到线性级',
    problem:
      '标准注意力要让每个 query 和全部 L 个 key 算分数，计算量与显存都随 L² 增长。上下文推到 1M 时，这一项会吃掉几乎所有算力 —— 不是"慢一点"，而是根本跑不动。',
    design:
      'KDA 走线性注意力路线：不显式构造 L×L 的注意力矩阵，而是维护一个随 token 递推更新的状态 S。读第 t 个 token 时，用当前 query 去"读"这个状态，再按 Delta 规则把新信息"写"回去。计算量因此从 L²·d 降为 L·d²，且不需要存 KV Cache。',
    tradeoff:
      '线性注意力的表达力弱于全注意力 —— 状态维度有限，远距离的细节会被压缩掉。K3 的应对不是把 KDA 做得更强，而是每 4 层插 1 层全注意力（Gated MLA）来补。',
    points: [
      { k: '复杂度', v: 'O(L·d²)，对序列长度线性' },
      { k: 'KV Cache', v: '不存 —— 这是削减 75% 的直接原因' },
      { k: '配比', v: '每 4 层中占 3 层（3 KDA + 1 Gated MLA）' },
      { k: '隐藏维', v: '7168 · 96 个注意力头' },
      { k: '1M 上下文收益', v: '解码提速最高 6.3×' },
      { k: '论文来源', v: 'arXiv:2510.26692' },
    ],
    viz: 'attention-scaling',
    source: 'arXiv:2510.26692',
  },
  {
    slug: 'gated-mla',
    name: 'Gated MLA',
    fullName: 'Gated Multi-head Latent Attention',
    oneLine: '每 4 层一次的全注意力，负责补回线性层丢掉的表达力',
    problem:
      '线性注意力省下了算力与显存，但压缩状态会损失远距离细节。纯线性堆叠的模型在长文本检索、精确复现这类任务上会明显退化。',
    design:
      '在宏循环里保留 1 层标准全注意力，但用 MLA（多头潜在注意力）：先把 KV 压进低维 latent（K3 为 3584），只在需要时再投影回来。这样既保住了全注意力的表达力，又把要存的 KV 本身也压小了。门控（Gated）则让模型自己决定每个位置要用多少新信息。',
    tradeoff:
      '这一层是唯一需要存 KV Cache 的层，也是长上下文下显存的主要占用者。K3 让它在 93 层里只出现 23 次 —— 约 1/4。',
    points: [
      { k: '出现频率', v: '每 4 层 1 次，共 23 层' },
      { k: 'Latent 维度', v: '3584（隐藏维 7168 的一半）' },
      { k: '作用', v: '补回线性注意力损失的表达力' },
      { k: '代价', v: '全模型 KV Cache 的主要来源' },
      { k: '门控', v: '由模型学习每个位置的更新强度' },
    ],
  },
  {
    slug: 'attnres',
    name: 'AttnRes',
    fullName: 'Attention Residual',
    oneLine: '用不到 2% 的额外算力，换 1.25× 的训练效率',
    problem:
      '深层 Transformer 的残差连接是固定权重相加，信息流路径单一。层数到 93 层这个量级时，梯度传播与特征复用的效率会成为瓶颈。',
    design:
      '把残差求和换成一层极轻量的注意力：让当前层自己去"看"前面若干层的输出，按需要加权融合，而不是一律等权相加。额外参数与算力开销控制在 2% 以内。',
    tradeoff:
      '训练效率确实提升（官方称 1.25×），但推理时这一层要多做一次小规模注意力 —— 在短序列上这点开销未必划算。',
    points: [
      { k: '额外算力', v: '< 2%' },
      { k: '训练效率', v: '提升 1.25×' },
      { k: '替换对象', v: '传统的等权残差相加' },
      { k: '适用', v: '93 层这种深度才明显收益' },
    ],
  },
  {
    slug: 'latent-moe',
    name: 'Stable LatentMoE',
    fullName: 'Stable Latent Mixture-of-Experts',
    oneLine: '896 选 16 的极端稀疏路由，怎么训练才不崩',
    problem:
      '专家数开到 896、每次只激活 16 个，稀疏度 1/56。这种配置下路由极易塌缩 —— 少数专家被反复选中，其余永远得不到训练，负载均衡一崩，整个 MoE 就废了。',
    design:
      '把路由计算放进低维 latent 空间做：先降维再打分选路，既降低路由本身的计算量，也让负载均衡约束更容易稳定。另外保留 2 个共享专家，保证每个 token 都有一条不依赖路由的通路。',
    tradeoff:
      '低维路由压缩了专家选择的信息量，理论上会牺牲一点路由精度；共享专家则固定占用一部分算力，不能靠稀疏度省掉。',
    points: [
      { k: '专家配置', v: '896 路由专家，每次选 16' },
      { k: '共享专家', v: '2 个（不参与路由，必选）' },
      { k: '稀疏度', v: '1 / 56' },
      { k: '专家中间维', v: '3072' },
      { k: '关键手段', v: '低维 latent 空间路由 + 负载均衡约束' },
    ],
  },
  {
    slug: 'situ-glu',
    name: 'SiTU-GLU',
    fullName: 'SiTU-Gated Linear Unit',
    oneLine: '为低精度训练设计的激活函数，兼顾稳定与表达力',
    problem:
      'K3 从 SFT 阶段起就启用 MXFP4 权重 / MXFP8 激活的量化感知训练。常用激活（如 SwiGLU）在低比特下容易出现数值溢出或表达力塌缩 —— 训练到一半 loss 突然发散。',
    design:
      'K3 自研 SiTU-GLU：在 GLU 的门控结构里换用 SiTU 激活，让输出范围更可控、在低比特量化下仍保持梯度稳定，从而支撑从 SFT 就开始的 QAT。',
    tradeoff:
      '自研激活缺少生态验证，需要自己踩完低精度训练里的坑；收益是能吃下 MXFP4/MXFP8 带来的显存与带宽红利。',
    points: [
      { k: '结构', v: 'GLU 门控 + SiTU 激活' },
      { k: '配合量化', v: 'MXFP4 权重 / MXFP8 激活' },
      { k: '启用时机', v: '自 SFT 阶段起做 QAT' },
      { k: '目的', v: '低比特下的数值稳定与表达力' },
    ],
  },
]

export function getK3Module(slug: string): K3ModuleDoc | undefined {
  return K3_MODULES.find((m) => m.slug === slug)
}
