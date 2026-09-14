/**
 * 轨道 A · 模块文档 —— 三个焦点模型共 14 个模块，全站唯一数据源。
 *
 * 每个模块统一回答三个问题：
 *   1. problem  它要解决的矛盾是什么
 *   2. design   它怎么解决
 *   3. tradeoff 代价是什么（没有免费的午餐）
 *
 * ⚠️ 规格数据以官方模型卡 / 技术报告为准，核实于 2026-09-14。
 */

import type { ModelId } from './models'

/** 模块页可挂载的交互可视化 */
export type ModuleViz =
  | 'attention-scaling' // 全注意力 vs 线性注意力代价曲线
  | 'moe-routing' // 路由塌缩模拟（复用 Track C 的组件）
  | 'ced-flow' // CED 编码器 → 解码器 KV 投影
  | 'csa-modes' // CSA2 的 Full / Reindex / Reuse 三模式
  | 'delta-rule' // Delta 规则：先减后加的状态更新
  | 'mtp-draft' // 多 token 预测 / 草稿验证

export interface ModuleDoc {
  /** 所属模型 */
  model: ModelId
  slug: string
  name: string
  fullName?: string
  oneLine: string
  problem: string
  design: string
  tradeoff: string
  points: { k: string; v: string }[]
  viz?: ModuleViz
  source?: string
}

export const MODULES: ModuleDoc[] = [
  /* ================================================================
     Kimi K3 · 5 个
     ================================================================ */
  {
    model: 'k3',
    slug: 'kda',
    name: 'KDA',
    fullName: 'Kimi Delta Attention',
    oneLine: '用增量规则做线性注意力，把长上下文的代价从平方级压到线性级',
    problem:
      '标准注意力要让每个 query 和全部 L 个 key 算分数，计算量与显存都随 L² 增长。上下文推到 1M 时，这一项会吃掉几乎所有算力 —— 不是「慢一点」，而是根本跑不动。',
    design:
      'KDA 走线性注意力路线：不显式构造 L×L 的注意力矩阵，而是维护一个随 token 递推更新的状态 S。读第 t 个 token 时，用当前 query 去「读」这个状态，再按 Delta 规则把新信息「写」回去。计算量因此从 L²·d 降为 L·d²，且不需要存 KV Cache。',
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
    model: 'k3',
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
    model: 'k3',
    slug: 'attnres',
    name: 'AttnRes',
    fullName: 'Attention Residual',
    oneLine: '用不到 2% 的额外算力，换 1.25× 的训练效率',
    problem:
      '深层 Transformer 的残差连接是固定权重相加，信息流路径单一。层数到 93 层这个量级时，梯度传播与特征复用的效率会成为瓶颈。',
    design:
      '把残差求和换成一层极轻量的注意力：让当前层自己去「看」前面若干层的输出，按需要加权融合，而不是一律等权相加。额外参数与算力开销控制在 2% 以内。',
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
    model: 'k3',
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
    viz: 'moe-routing',
  },
  {
    model: 'k3',
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

  /* ================================================================
     DeepSeek V4.1 Flash · 6 个
     ================================================================ */
  {
    model: 'v4',
    slug: 'ced',
    name: 'CED',
    fullName: 'Causal Encoder-Decoder',
    oneLine: '解码器的全局 KV 由编码器末层投影而来 —— 把 Encoder 请回 LLM 的正当理由',
    problem:
      'decoder-only 架构里，每生成一个 token 都要对整段 prompt 重做一次全注意力。prompt 越长，这份成本重复得越多次 —— 而且付费方式是「每个 token 各付一遍」。',
    design:
      '把模型纵向切成两段：前 20 层是 causal encoder，一次性把整段 prompt 压成一份全局 KV；后 20 层是 decoder，不再重算 prompt 的 KV，直接取用编码器末层的投影。于是 prompt 侧的重活只做一次。',
    tradeoff:
      '编码器必须先看完整段 prompt，天生不适合增量追加；prompt 一变就得重算编码器。换来的是 prefill 与 decode 可以用不同的激活预算分别对待 —— 官方给出的 8B / 16B 非对称激活正是从这里来的。',
    points: [
      { k: '结构', v: '40 层 = 20 编码 + 20 解码' },
      { k: '全局 KV 来源', v: '编码器末层投影' },
      { k: '激活参数', v: 'prefill 8B / decode 16B（非对称）' },
      { k: '核心收益', v: 'prompt 侧的重活只做一次' },
      { k: '主要限制', v: '不适合流式追加，prompt 变更需重算' },
    ],
    viz: 'ced-flow',
  },
  {
    model: 'v4',
    slug: 'csa2',
    name: 'CSA2',
    fullName: 'Contextual Sparse Attention v2',
    oneLine: '每层三选一：Full / Reindex / Reuse，跨层共用同一份主 KV',
    problem:
      '全注意力是 O(L²)，但真正重要的 key 往往只占少数。大部分算力花在了必然被 softmax 压成接近 0 的位置上 —— 这是一笔可以省掉的账。',
    design:
      '每层从三种模式里选一种执行：Full 全量看（少数锚点层负责保底）；Reindex 用 Hierarchical Sparse Indexer 重新挑选重要的 key 子集；Reuse 连挑选都跳过，直接沿用上一层选好的子集。被选中的 key 组成一份「主 KV」，在所有层之间共享、不重复存储。',
    tradeoff:
      '稀疏必然丢信息，靠少量 Full 层兜底；一旦某个 key 在 Reindex 那一步没被选中，后续 Reuse 的层就再也看不到它了。Reindex 的间隔因此是个需要反复调的旋钮。',
    points: [
      { k: '三种模式', v: 'Full / Reindex / Reuse' },
      { k: '挑选依据', v: 'Hierarchical Sparse Indexer' },
      { k: '主 KV', v: '跨层共享，不逐层重复存储' },
      { k: '配套压缩', v: 'FP4 主 KV → 890 字节 / token' },
      { k: '风险点', v: 'Reindex 漏选的 key 无法被 Reuse 层找回' },
    ],
    viz: 'csa-modes',
  },
  {
    model: 'v4',
    slug: 'kv-compression',
    name: 'KV 压缩',
    fullName: 'FP4 Main KV + SWA Bounded Replay',
    oneLine: '把每 token 的 KV 压到 890 字节 —— 长上下文能不能落地的生死线',
    problem:
      '1M 上下文下，KV Cache 本身比模型权重还占地方。按常规做法逐层、逐头存 K 和 V 两份，40 层规模算下来是 GB 级 —— 显存先于算力先被打满。',
    design:
      '主 KV 用 FP4（E2M1）存储，把每个元素从 16 bit 压到 4 bit；同时保留一段滑动窗口（SWA）以更高精度回放最近的 token（Bounded Replay），保证局部精度不塌。两条手段叠加后官方口径为 890 字节 / token。',
    tradeoff:
      'FP4 只剩 4 bit，量化误差无法消除。窗口外的远距离信息是有损的 —— 这部分损失由 CSA2 的稀疏挑选来补偿：既然只存/只读少数关键 key，压缩带宽好钢用在刀刃上。',
    points: [
      { k: '主 KV 精度', v: 'FP4 · E2M1' },
      { k: '近距兜底', v: 'SWA Bounded Replay' },
      { k: '官方口径', v: '890 字节 / token' },
      { k: '1M 上下文', v: '约 890 MB / 序列（未计 batch）' },
      { k: '协同机制', v: '与 CSA2 的主 KV 共享配合' },
    ],
  },
  {
    model: 'v4',
    slug: 'engram',
    name: 'Engram',
    fullName: 'Conditional Memory',
    oneLine: '196B 条件记忆 —— 把静态知识从「算出来」变成「查出来」',
    problem:
      '知识类参数（「某某是哪年提出 X 的」）和推理/组合类能力混在同一个 FFN 里。查一条事实却要跑一遍完整的大矩阵乘，算力白花；而想装更多知识，参数量就得跟着线性膨胀。',
    design:
      '外挂一张可按 token 稀疏查表的条件记忆（196B）。查表是一次 O(1) 的取行操作，不参与矩阵乘 —— 于是知识容量与计算 depth 解耦：想多装知识就加表，不必加深主干。',
    tradeoff:
      '196B 参数是实打实要加载的显存，只是它可以 offload 或分层放置。更要紧的是：查出来的内容是静态的，不会随上下文做推理式变换 —— 遇到需要现场组合的事实，仍然只能靠主干硬算。',
    points: [
      { k: '规模', v: '196B 条件记忆' },
      { k: '访问方式', v: '按 token 稀疏查表' },
      { k: '核心收益', v: '知识容量与计算量解耦' },
      { k: '主要限制', v: '静态内容，无法做现场推理组合' },
      { k: '部署考量', v: '可 offload / 分层放置' },
    ],
  },
  {
    model: 'v4',
    slug: 'mhc',
    name: 'Single-Pass mHC',
    fullName: 'Single-Pass Manifold-Constrained Hyper-Connections',
    oneLine: '把多次遍历合并成一次扫描 —— 省的是 IO，不是算力',
    problem:
      '流形约束残差能显著稳住深层训练，但朴素实现需要对 hidden states 反复扫描读写。层数一多，IO 开销把好不容易换来的收益又吃回去了。',
    design:
      'Mega-mHC kernel：把原本多趟读写才能完成的流形约束计算，融合成一次 Single-Pass。数据从显存里过一遍就得到结果。',
    tradeoff:
      '融合 kernel 的收益高度依赖硬件与张量形状，长序列、大 batch 才明显；短序列上调度开销可能让它还不如朴素写法。这也是为什么它和 1/64 这种激进稀疏度配套出现 —— 深而稀疏的模型才吃得到红利。',
    points: [
      { k: '约束对象', v: 'Hyper-Connections（流形约束残差）' },
      { k: '优化手段', v: 'Single-Pass 融合 kernel' },
      { k: '省的是', v: '显存 IO 而非浮点算力' },
      { k: '适用条件', v: '深网络 + 长序列 + 大 batch' },
    ],
  },
  {
    model: 'v4',
    slug: 'dspark',
    name: 'DSpark',
    fullName: 'Semi-Autoregressive Drafting',
    oneLine: '半自回归草稿 + 置信度调度验证 —— 针对访存瓶颈而非算力瓶颈',
    problem:
      '自回归一次只吐一个 token，而解码速度的瓶颈通常是访存带宽（等权重加载）而不是浮点算力。GPU 大量时间在空转等待。',
    design:
      '一次先草拟一小段候选 token，再用置信度调度决定验证多少。被接受的部分由主模型一次并行前向确认，而不是逐 token 走一遍。把「多趟等权重」压缩成「一趟多位置」。',
    tradeoff:
      '草稿命中率低时会比不用更慢 —— 白算了草稿还要回退。收益完全取决于草稿质量，任务越难、越需要现场推理，越难赚回来。',
    points: [
      { k: '机制', v: '半自回归草稿 + 置信度调度验证' },
      { k: '针对瓶颈', v: '访存带宽，而非浮点算力' },
      { k: '互补手段', v: '890 字节 / token 的小 KV 进一步减压' },
      { k: '失效场景', v: '草稿命中率低时反而更慢' },
    ],
  },

  /* ================================================================
     Qwen3.8-2.4T-A95B · 3 个
     ================================================================ */
  {
    model: 'qwen',
    slug: 'gated-deltanet',
    name: 'Gated DeltaNet',
    fullName: 'Gated Delta Network',
    oneLine: '线性注意力的另一条实现路线：状态能被覆写，而不是只加不减',
    problem:
      '朴素线性注意力把每个 token 的 (k, v) 外积往状态里累加。问题是状态永远只增不减：旧信息不会被覆盖，时间一长状态就被无关历史污染，retrieval 类任务掉得很明显。',
    design:
      'Delta 规则给状态加上「写入前先擦除」：更新时先算当前 key 在旧状态里读出了什么，把这部分从状态里减掉，再写入新的外积。于是状态是可以被覆写的关联记忆。128 个 V 头 / 16 个 QK 头（dim 128），门控控制每一步的更新强度。',
    tradeoff:
      '「先减后加」在数值上比纯累加敏感得多，低精度下尤其需要小心缩放。而且状态维度终究有限 —— 所以 Qwen3.8 与 K3 一样保留 1/4 的全注意力层兜底。',
    points: [
      { k: '核心规则', v: 'Delta 规则：先减后加，状态可覆写' },
      { k: '头数配置', v: '128 V / 16 QK（dim 128）' },
      { k: '门控', v: '控制每步更新与输出的强度' },
      { k: '层数占比', v: '92 层中占 69 层（3/4）' },
      { k: '对比 KDA', v: '同为线性路线，各自 Named 了一套工程实现' },
    ],
    viz: 'delta-rule',
  },
  {
    model: 'qwen',
    slug: 'gated-attention',
    name: 'Gated Attention',
    fullName: 'Gated Attention with Extreme GQA',
    oneLine: '64 Q / 4 KV 的极端共享，把唯一要存 KV 的那 1/4 层压到极限',
    problem:
      '即使只有 1/4 的层是全注意力，在 26 万上下文下它仍是显存大头。每个 Q 头各配一份 K/V 的开销必须砍掉。',
    design:
      '极端 GQA 配比：64 个 Q 头只配 4 个 KV 头，16:1 —— KV Cache 相对 MHA 直接降到约 1/16。同时 RoPE 只作用在 64 维而非全部 256 维，把有限的位置编码预算压在最关键的那部分维度上。',
    tradeoff:
      '16:1 意味着同一组的 16 个 Q 头拿到的 K/V 完全相同，头的多样性受限；而 RoPE 只覆盖部分维度，其余维度则完全没有显式的相对位置信息。理论上这是明显的取巧，实际效果靠实验兜住。',
    points: [
      { k: '头数配比', v: '64 Q / 4 KV（16:1）' },
      { k: 'RoPE', v: '仅作用在 64 维' },
      { k: '层数占比', v: '92 层中占 23 层（1/4）' },
      { k: 'KV Cache', v: '相对 MHA 约 1/16' },
      { k: '上下文', v: '262,144 → 可扩至 1,010,000' },
    ],
  },
  {
    model: 'qwen',
    slug: 'mtp',
    name: 'MTP',
    fullName: 'Multi-Token Prediction',
    oneLine: '一次前向预测后 n 个位置：训练端加监督，推理端当草稿',
    problem:
      '训练时每个位置只监督「下一个 token」，信号稀疏、样本效率低；推理时一次只出一个 token，解码又慢。两个问题其实指向同一个结构性浪费。',
    design:
      '主干之外挂若干轻量 MTP head，一次前向同时预测后面 n 个位置。训练时它们提供额外的监督信号，让表征学得更扎实；推理时这批预测可以直接当作草稿去做 speculative decoding，把多步确认压缩成一次验证。',
    tradeoff:
      '额外的 head 要占参数与算力；更重要的是训练目标偏离了纯粹的「预测下一个 token」，分布会略有失真 —— 常见做法是在最终推理时丢掉 MTP head，只把它当草稿器用。n 越大收益递减。',
    points: [
      { k: '机制', v: '多步预测，一次前向出 n 个位置' },
      { k: '训练端收益', v: '额外监督信号，提升样本效率' },
      { k: '推理端收益', v: '预测结果可作草稿做投机解码' },
      { k: '常见取舍', v: '推理时丢弃 MTP head，避免分布失真' },
      { k: 'Qwen3.8', v: '多步 MTP · 思考模式默认开启' },
    ],
    viz: 'mtp-draft',
  },
]

/** 取某个模型的全部模块（保持声明顺序） */
export function getModules(id: ModelId): ModuleDoc[] {
  return MODULES.filter((m) => m.model === id)
}

export function getModule(id: ModelId, slug: string): ModuleDoc | undefined {
  return MODULES.find((m) => m.model === id && m.slug === slug)
}

export const MODULE_COUNT = MODULES.length
