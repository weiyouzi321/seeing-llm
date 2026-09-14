/**
 * 轨道 C · 算子与策略 —— 高频前 20
 *
 * 频率标记 🔥/⭐/💡 取自 TorchCode（github.com/duoan/TorchCode）。
 * 实测分布：🔥 16 个、⭐ 14 个、💡 11 个，合计 41。
 * 「前 20」= 16 个 🔥 + 4 个为三焦点模型补的（MoE / GQA / Linear Attention / GPT-2 Block）。
 * 补这 4 个的目的：把三轨交叉链接里的断链补上。
 */

export type OpGroup = '基础' | '注意力' | '推理策略' | '为模型补'

export interface Op {
  name: string
  fn: string
  group: OpGroup
  /** TorchCode 频率标记；★ 表示本站为三模型补充 */
  freq: 'fire' | 'star' | 'bulb' | 'extra'
  oneLine: string
}

export const OPS: Op[] = [
  // ---- 🔥 高频 16（TorchCode 标记） ----
  { name: 'ReLU',              fn: 'relu',              group: '基础',     freq: 'fire',  oneLine: '最简单的非线性，却是稀疏激活的起点' },
  { name: 'Softmax',           fn: 'softmax',           group: '基础',     freq: 'fire',  oneLine: '把 logits 压成概率；数值稳定版要减去 max' },
  { name: 'Linear',            fn: 'linear',            group: '基础',     freq: 'fire',  oneLine: '矩阵乘 + 偏置，Transformer 里参数量最大的地方' },
  { name: 'LayerNorm',         fn: 'layer_norm',        group: '基础',     freq: 'fire',  oneLine: '沿特征维归一化；RMSNorm 是它的简化变体' },
  { name: 'Cross Entropy',     fn: 'cross_entropy',     group: '基础',     freq: 'fire',  oneLine: '语言模型的训练目标，从 logits 到 loss' },
  { name: 'Dropout',           fn: 'dropout',           group: '基础',     freq: 'fire',  oneLine: '训练期随机置零；反向传播要按 1/(1-p) 缩放' },
  { name: 'Embedding',         fn: 'embedding',         group: '基础',     freq: 'fire',  oneLine: '查表取词向量；160K 词表下这层参数不容小觑' },
  { name: 'Conv2d',            fn: 'conv2d',            group: '基础',     freq: 'fire',  oneLine: '视觉塔（MoonViT / DeepSeek-ViT）的地基' },
  { name: 'Linear Regression', fn: 'linear_regression', group: '基础',     freq: 'fire',  oneLine: '最小二乘闭式解，理解 autograd 的最小例子' },
  { name: 'SDPA',              fn: 'scaled_dot_product_attention', group: '注意力', freq: 'fire', oneLine: '缩放点积注意力，一切注意力的公共内核' },
  { name: 'Multi-Head Attn',   fn: 'multihead_attention', group: '注意力', freq: 'fire',  oneLine: '多头拼接 + 输出投影；GQA / MLA 都是在砍它的 KV' },
  { name: 'Causal Attention',  fn: 'causal_attention',  group: '注意力',   freq: 'fire',  oneLine: '加下三角掩码，保证只看得见过去' },
  { name: 'KV Cache',          fn: 'kv_cache',          group: '推理策略', freq: 'fire',  oneLine: '把已算过的 K/V 存起来，避免重复计算' },
  { name: 'RoPE',              fn: 'rotary_embedding',  group: '注意力',   freq: 'fire',  oneLine: '旋转位置编码；Qwen3.8 只把它作用在 64 维' },
  { name: 'Top-k / Top-p',     fn: 'top_k_top_p',       group: '推理策略', freq: 'fire',  oneLine: '截断采样，控制生成多样性与可靠性的旋钮' },
  { name: 'Beam Search',       fn: 'beam_search',       group: '推理策略', freq: 'fire',  oneLine: '保留 k 条候选路径；与采样的取舍' },

  // ---- 为三焦点模型补充 4 个 ----
  { name: 'MoE Routing',       fn: 'moe_routing',       group: '为模型补', freq: 'extra', oneLine: '896→16 / 512→10 / 384→6：稀疏路由怎么选、怎么稳' },
  { name: 'GQA',               fn: 'grouped_query_attention', group: '为模型补', freq: 'extra', oneLine: '分组查询注意力，Qwen3.8 用 64 Q / 4 KV 的极端配比' },
  { name: 'Linear Attention',  fn: 'linear_attention',  group: '为模型补', freq: 'extra', oneLine: 'K3 的 KDA 与 Qwen3.8 的 Gated DeltaNet 的共同底色' },
  { name: 'GPT-2 Block',       fn: 'gpt2_block',        group: '为模型补', freq: 'extra', oneLine: '一个完整的 Decoder block，把前面所有算子串起来' },
]

/** 剩余 21 个（⭐ 10 + 💡 11）—— 走待补清单 */
export const OPS_BACKLOG = { star: 10, bulb: 11 }

/* ------------------------------------------------------------------ */
/* 轨道 B · 训练全流程（MiniMind）                                       */
/* ------------------------------------------------------------------ */

export interface TrainStage {
  id: string
  name: string
  goal: string
  note: string
}

/**
 * MiniMind（github.com/jingyaogong/minimind）
 * minimind-3 规格：64M 参数 · 8 层 · d_model 768 · 词表 6400 · max_pos 32768
 *                  rope_theta 1e6 · q_heads 8 · kv_heads 4
 * 3090 单卡各阶段 1.1–1.21h，全流程约 3 元。
 */
export const TRAIN_STAGES: TrainStage[] = [
  { id: '1', name: 'Tokenizer',   goal: '把文本切成模型看得懂的 token',  note: '词表 6400，自训 BPE' },
  { id: '2', name: 'Pretrain',    goal: '在大规模语料上做下一个 token 预测', note: '参数量最大、耗时最长的一步' },
  { id: '3', name: 'SFT',         goal: '用指令数据教会模型「按人话回答」', note: '从续写转为对话' },
  { id: '4', name: 'LoRA',        goal: '只训低秩增量，验证低成本微调',   note: '冻结主干，只更新 A/B 矩阵' },
  { id: '5', name: 'DPO',         goal: '用偏好对直接优化，不需要奖励模型', note: '比 RLHF 更轻' },
  { id: '6', name: 'RLHF / GRPO', goal: '用奖励信号做策略优化',          note: 'GRPO 去掉 critic，显存更省' },
  { id: '7', name: 'Reasoning',   goal: '让模型学会「先想再答」',        note: '长思维链数据 + 蒸馏' },
  { id: '8', name: '评测与蒸馏',   goal: '量化学到的能力，压成小模型',     note: '闭环回到第 3 步' },
]

export const TRAIN_FACTS = [
  { k: '模型', v: 'minimind-3' },
  { k: '参数量', v: '64M' },
  { k: '层数 / 隐藏维', v: '8 层 / 768' },
  { k: '词表', v: '6400' },
  { k: '最大位置', v: '32,768' },
  { k: '注意力头', v: '8 Q / 4 KV' },
  { k: '单卡耗时', v: '3090 · 各阶段 1.1–1.21h' },
  { k: '全流程成本', v: '约 3 元' },
]
