/**
 * 轨道 C · 算子与策略 —— 高频前 20
 *
 * 频率标记 🔥/⭐/💡 取自 TorchCode（github.com/duoan/TorchCode）。
 * 实测分布：🔥 16 个、⭐ 14 个、💡 11 个，合计 41。
 * 「前 20」= 16 个 🔥 + 4 个为三焦点模型补的（MoE / GQA / Linear Attention / GPT-2 Block）。
 * 补这 4 个的目的：把三轨交叉链接里的断链补上。
 */

export type OpGroup = '基础' | '注意力' | '推理策略' | '为模型补'

/** 可视化组件类型 */
export type OpViz =
  | 'curve' // 函数 / 分布曲线
  | 'shape' // 张量形状链路
  | 'mask' // 注意力矩阵 + 掩码
  | 'sample' // 采样截断
  | 'kv' // KV Cache 增量解码
  | 'route' // MoE 路由
  | 'rope' // 旋转位置编码
  | 'loss' // 损失曲线
  | 'none'

export interface IoStep {
  label: string
  shape: string
}

export interface Op {
  slug: string
  name: string
  fn: string
  group: OpGroup
  /** TorchCode 频率标记；★ 表示本站为三模型补充 */
  freq: 'fire' | 'star' | 'bulb' | 'extra'
  oneLine: string
  /** 它在做什么、为什么需要 */
  explain: string
  /** PyTorch 参考实现（教学用精简版） */
  code: string
  /** 张量形状链路；shape 类可视化会用到 */
  io?: IoStep[]
  viz: OpViz
}

export const OPS: Op[] = [
  // ---------------- 🔥 高频 16（TorchCode 标记） ----------------
  {
    slug: 'relu',
    name: 'ReLU',
    fn: 'relu',
    group: '基础',
    freq: 'fire',
    oneLine: '最简单的非线性，却是稀疏激活的起点',
    explain:
      '把负数压成 0、正数原样通过。没有它，无论堆多少层线性变换，整体仍等价于一层线性变换 —— 非线性才是"深"度有意义的前提。它同时让一部分神经元输出恰好为 0，这是 MoE 之外最常见的稀疏性来源。',
    code: 'def relu(x):\n    return torch.maximum(x, torch.zeros_like(x))',
    io: [
      { label: '输入', shape: '[B, L, d]' },
      { label: '输出', shape: '[B, L, d]' },
    ],
    viz: 'curve',
  },
  {
    slug: 'softmax',
    name: 'Softmax',
    fn: 'softmax',
    group: '基础',
    freq: 'fire',
    oneLine: '把 logits 压成概率；数值稳定版要减去 max',
    explain:
      '指数归一化，让一组分数变成和为 1 的概率。工程上有两个必须知道的点：一是要减去 max 再取 exp，否则 exp(1000) 直接溢出成 inf；二是它有个温度参数 T —— T 越小分布越尖锐（越贪心），T 越大越平缓（越随机），这是所有采样策略的旋钮。',
    code: 'def softmax(x, dim=-1, T=1.0):\n    z = x / T\n    z = z - z.max(dim=dim, keepdim=True).values  # 防溢出\n    e = torch.exp(z)\n    return e / e.sum(dim=dim, keepdim=True)',
    io: [
      { label: 'logits', shape: '[B, L, V]' },
      { label: '概率', shape: '[B, L, V]' },
    ],
    viz: 'curve',
  },
  {
    slug: 'linear',
    name: 'Linear',
    fn: 'linear',
    group: '基础',
    freq: 'fire',
    oneLine: '矩阵乘 + 偏置，Transformer 里参数量最大的地方',
    explain:
      'y = xWᵀ + b。在 Transformer 里它出现在四处：QKV 投影、注意力输出投影、FFN 的升维与降维。一个 7168 维的模型，单个 FFN 的升维矩阵就有 7168×3072 量级的参数 —— 模型体积基本由这些矩阵决定。',
    code: 'def linear(x, W, b=None):\n    y = x @ W.T\n    return y if b is None else y + b',
    io: [
      { label: '输入', shape: '[B, L, d_in]' },
      { label: '权重', shape: '[d_out, d_in]' },
      { label: '输出', shape: '[B, L, d_out]' },
    ],
    viz: 'shape',
  },
  {
    slug: 'layer-norm',
    name: 'LayerNorm',
    fn: 'layer_norm',
    group: '基础',
    freq: 'fire',
    oneLine: '沿特征维归一化；RMSNorm 是它的简化变体',
    explain:
      '把每个 token 的特征向量减均值、除标准差，再用可学习的 γ、β 缩放平移，让每层的输入分布稳定下来 —— 这是深层网络能训练的关键。现代 LLM 多用 RMSNorm：去掉减均值、只按均方根缩放，效果接近但更快。',
    code: 'def layer_norm(x, gamma, beta, eps=1e-5):\n    mu = x.mean(-1, keepdim=True)\n    var = x.var(-1, keepdim=True, unbiased=False)\n    xhat = (x - mu) / torch.sqrt(var + eps)\n    return gamma * xhat + beta',
    io: [
      { label: '输入', shape: '[B, L, d]' },
      { label: '输出', shape: '[B, L, d]' },
    ],
    viz: 'curve',
  },
  {
    slug: 'cross-entropy',
    name: 'Cross Entropy',
    fn: 'cross_entropy',
    group: '基础',
    freq: 'fire',
    oneLine: '语言模型的训练目标，从 logits 到 loss',
    explain:
      '对正确 token 的预测概率取负对数。模型越确信答案正确，loss 越接近 0；猜错且很自信时 loss 会非常大。注意 PyTorch 的 cross_entropy 内部已包含 log_softmax，所以传进去的应是未归一化的 logits。',
    code: 'def cross_entropy(logits, target):\n    logp = torch.log_softmax(logits, dim=-1)\n    return -logp.gather(-1, target.unsqueeze(-1)).mean()',
    io: [
      { label: 'logits', shape: '[B, L, V]' },
      { label: 'target', shape: '[B, L]' },
      { label: 'loss', shape: '标量' },
    ],
    viz: 'loss',
  },
  {
    slug: 'dropout',
    name: 'Dropout',
    fn: 'dropout',
    group: '基础',
    freq: 'fire',
    oneLine: '训练期随机置零；反向传播要按 1/(1-p) 缩放',
    explain:
      '训练时以概率 p 随机把元素置 0，迫使网络不依赖任何单个神经元。关键细节：留下的元素要除以 (1-p) 放大，否则训练和推理时的期望值对不上 —— 这叫 inverted dropout。推理时整个模块直通。',
    code: 'def dropout(x, p=0.1, training=True):\n    if not training or p == 0:\n        return x\n    mask = (torch.rand_like(x) > p).float()\n    return x * mask / (1 - p)',
    io: [
      { label: '输入', shape: '[B, L, d]' },
      { label: '输出', shape: '[B, L, d]' },
    ],
    viz: 'curve',
  },
  {
    slug: 'embedding',
    name: 'Embedding',
    fn: 'embedding',
    group: '基础',
    freq: 'fire',
    oneLine: '查表取词向量；160K 词表下这层参数不容小觑',
    explain:
      '本质是一张 [词表大小, 隐藏维] 的表格，按 token id 取行。Kimi K3 词表 160K、隐藏维 7168，仅这一层就有约 11 亿参数。很多模型还会让输入 embedding 与输出 softmax 权重共享（tied embedding）来省参数。',
    code: 'def embedding(ids, W):\n    # W: [V, d]，按 id 取行\n    return W[ids]',
    io: [
      { label: 'token id', shape: '[B, L]' },
      { label: '权重表', shape: '[V, d]' },
      { label: '输出', shape: '[B, L, d]' },
    ],
    viz: 'shape',
  },
  {
    slug: 'conv2d',
    name: 'Conv2d',
    fn: 'conv2d',
    group: '基础',
    freq: 'fire',
    oneLine: '视觉塔（MoonViT / DeepSeek-ViT）的地基',
    explain:
      '用一个小卷积核在图像上滑动，每停一次做一次局部加权求和。之所以用卷积而不是全连接：局部性（相邻像素相关）和权值共享（同一特征在图像任意位置都该被识别）。在多模态模型里，它负责把图片切成 patch 再送进 Transformer。',
    code: '# 教学版：单通道、无 padding 的二维卷积\ndef conv2d(x, k):\n    H, W = x.shape; kh, kw = k.shape\n    out = torch.zeros(H - kh + 1, W - kw + 1)\n    for i in range(out.shape[0]):\n        for j in range(out.shape[1]):\n            out[i, j] = (x[i:i+kh, j:j+kw] * k).sum()\n    return out',
    io: [
      { label: '输入', shape: '[B, C, H, W]' },
      { label: '卷积核', shape: '[C_out, C, kh, kw]' },
      { label: '输出', shape: '[B, C_out, H\', W\']' },
    ],
    viz: 'shape',
  },
  {
    slug: 'linear-regression',
    name: 'Linear Regression',
    fn: 'linear_regression',
    group: '基础',
    freq: 'fire',
    oneLine: '最小二乘闭式解，理解 autograd 的最小例子',
    explain:
      'y ≈ Xw，最小化平方误差。它有闭式解 w = (XᵀX)⁻¹Xᵀy，不需要迭代 —— 正因为有解析答案，它常被用来验证自己手写的反向传播是否正确：梯度下降收敛到的 w 应当逼近这个闭式解。',
    code: '# 闭式解（正规方程）\ndef linear_regression(X, y):\n    return torch.linalg.solve(X.T @ X, X.T @ y)',
    io: [
      { label: 'X', shape: '[N, d]' },
      { label: 'y', shape: '[N]' },
      { label: 'w', shape: '[d]' },
    ],
    viz: 'none',
  },
  {
    slug: 'sdpa',
    name: 'SDPA',
    fn: 'scaled_dot_product_attention',
    group: '注意力',
    freq: 'fire',
    oneLine: '缩放点积注意力，一切注意力的公共内核',
    explain:
      'softmax(QKᵀ/√d)·V。除以 √d 是必须的：不缩放的话，点积的方差会随维度 d 线性增长，softmax 会被推进梯度极小的饱和区，训练直接停滞。GQA、MLA、线性注意力都是在改这个式子的某一部分，而不是推翻它。',
    code: 'def sdpa(Q, K, V, mask=None):\n    d = Q.size(-1)\n    scores = Q @ K.transpose(-2, -1) / (d ** 0.5)\n    if mask is not None:\n        scores = scores.masked_fill(mask == 0, float("-inf"))\n    return torch.softmax(scores, -1) @ V',
    io: [
      { label: 'Q', shape: '[B, H, L, d_h]' },
      { label: 'K', shape: '[B, H, L, d_h]' },
      { label: 'V', shape: '[B, H, L, d_h]' },
      { label: '输出', shape: '[B, H, L, d_h]' },
    ],
    viz: 'mask',
  },
  {
    slug: 'multihead-attention',
    name: 'Multi-Head Attn',
    fn: 'multihead_attention',
    group: '注意力',
    freq: 'fire',
    oneLine: '多头拼接 + 输出投影；GQA / MLA 都是在砍它的 KV',
    explain:
      '把 d 维切成 H 个头，每个头独立做一次 SDPA，再拼回来投影。多头的意义是让不同头关注不同类型的关系（句法、指代、位置……）。注意：多头不会增加计算量（每头维度变 d/H），但会显著增加 KV Cache —— 这正是 GQA/MLA 要优化的地方。',
    code: 'def mha(x, Wq, Wk, Wv, Wo, H):\n    B, L, d = x.shape; dh = d // H\n    q = (x @ Wq.T).view(B, L, H, dh).transpose(1, 2)\n    k = (x @ Wk.T).view(B, L, H, dh).transpose(1, 2)\n    v = (x @ Wv.T).view(B, L, H, dh).transpose(1, 2)\n    o = sdpa(q, k, v)                       # [B, H, L, dh]\n    return o.transpose(1, 2).reshape(B, L, d) @ Wo.T',
    io: [
      { label: '输入', shape: '[B, L, d]' },
      { label: '分头', shape: '[B, H, L, d/H]' },
      { label: '拼接输出', shape: '[B, L, d]' },
    ],
    viz: 'shape',
  },
  {
    slug: 'causal-attention',
    name: 'Causal Attention',
    fn: 'causal_attention',
    group: '注意力',
    freq: 'fire',
    oneLine: '加下三角掩码，保证只看得见过去',
    explain:
      '在 scores 上加一个下三角掩码，把"未来"位置填成 -inf，softmax 后自然变成 0。没有它，训练时模型会偷看答案，推理时却看不到 —— 训练/推理不一致，生成质量崩掉。注意是"因果掩码"而非"padding 掩码"，两者用途不同。',
    code: 'def causal_mask(L):\n    return torch.tril(torch.ones(L, L)).bool()\n\ndef causal_attention(Q, K, V):\n    return sdpa(Q, K, V, mask=causal_mask(Q.size(-2)))',
    io: [
      { label: 'scores', shape: '[L, L]' },
      { label: '加掩码后', shape: '[L, L]（上三角为 -inf）' },
    ],
    viz: 'mask',
  },
  {
    slug: 'kv-cache',
    name: 'KV Cache',
    fn: 'kv_cache',
    group: '推理策略',
    freq: 'fire',
    oneLine: '把已算过的 K/V 存起来，避免重复计算',
    explain:
      '自回归生成时，第 t 步需要前 t-1 个 token 的 K/V —— 这些在之前的步骤里已经算过。缓存下来后，每步只需算新 token 的 Q/K/V，把单步复杂度从 O(t²) 降到 O(t)。代价是显存随序列线性增长，这也是 K3 削减 75% KV、V4.1 Flash 把每 token 压到 890 字节的动机。',
    code: '# 增量解码：只算新 token，其余直接复用\ndef step(q_new, k_new, v_new, k_cache, v_cache):\n    K = torch.cat([k_cache, k_new], dim=-2)\n    V = torch.cat([v_cache, v_new], dim=-2)\n    out = sdpa(q_new, K, V)\n    return out, K, V          # 新缓存回传给下一步',
    io: [
      { label: '缓存 K/V', shape: '[B, H, t-1, d_h]' },
      { label: '新 token', shape: '[B, H, 1, d_h]' },
      { label: '拼接后', shape: '[B, H, t, d_h]' },
    ],
    viz: 'kv',
  },
  {
    slug: 'rope',
    name: 'RoPE',
    fn: 'rotary_embedding',
    group: '注意力',
    freq: 'fire',
    oneLine: '旋转位置编码；Qwen3.8 只把它作用在 64 维',
    explain:
      '不加位置向量，而是把 Q/K 的每两个维度看成平面上的一个点，按位置旋转一个角度。妙处在于：两个向量各自旋转后做内积，结果只与它们的相对位置有关 —— 相对位置编码天然成立。Qwen3.8 的 Gated Attention 里，RoPE 只作用在 64 维（而非全部 256 维），是刻意的取舍。',
    code: 'def rope(x, pos, theta=1e6):\n    # x: [..., d]，相邻两维一组做旋转\n    d = x.shape[-1]\n    freqs = 1.0 / (theta ** (torch.arange(0, d, 2).float() / d))\n    ang = torch.outer(pos, freqs)                  # [L, d/2]\n    cos, sin = torch.cos(ang), torch.sin(ang)\n    x1, x2 = x[..., 0::2], x[..., 1::2]\n    o1 = x1 * cos - x2 * sin\n    o2 = x1 * sin + x2 * cos\n    return torch.stack([o1, o2], -1).flatten(-2)',
    io: [
      { label: 'Q/K', shape: '[B, H, L, d_h]' },
      { label: '旋转后', shape: '[B, H, L, d_h]' },
    ],
    viz: 'rope',
  },
  {
    slug: 'top-k-top-p',
    name: 'Top-k / Top-p',
    fn: 'top_k_top_p',
    group: '推理策略',
    freq: 'fire',
    oneLine: '截断采样，控制生成多样性与可靠性的旋钮',
    explain:
      'Top-k 只保留概率最高的 k 个 token；Top-p（核采样）按概率从高到低累加，一旦超过 p 就截断 —— 后者会随分布形状自适应调整候选集大小。两者常一起用。调它们就是在"敢不敢冒险"之间选位置：k=1 即贪心解码。',
    code: 'def top_k_top_p(logits, k=0, p=1.0):\n    if k > 0:\n        idx = logits.topk(k, -1).values[..., -1:] \n        logits = logits.masked_fill(logits < idx, float("-inf"))\n    if p < 1.0:\n        s, i = torch.sort(logits, descending=True)\n        cum = torch.cumsum(torch.softmax(s, -1), -1)\n        drop = cum - torch.softmax(s, -1) > p\n        logits = logits.masked_fill(i * 0 + drop, float("-inf"))\n    return logits',
    io: [
      { label: 'logits', shape: '[V]' },
      { label: '截断后', shape: '[V]（部分为 -inf）' },
    ],
    viz: 'sample',
  },
  {
    slug: 'beam-search',
    name: 'Beam Search',
    fn: 'beam_search',
    group: '推理策略',
    freq: 'fire',
    oneLine: '保留 k 条候选路径；与采样的取舍',
    explain:
      '每步保留得分最高的 k 条序列，而不是只留一条。它比贪心更鲁棒（不会因为一步选错而全盘皆输），但有个著名问题：倾向于输出平淡、重复的安全句子。所以创意写作常用采样，翻译/摘要这类要求准确的任务才用 beam search。',
    code: 'def beam_search(step_fn, BOS, k=4, T=32):\n    beams = [([BOS], 0.0)]\n    for _ in range(T):\n        cand = []\n        for seq, score in beams:\n            for tok, lp in step_fn(seq).topk(k):\n                cand.append((seq + [tok], score + lp))\n        beams = sorted(cand, key=lambda x: -x[1])[:k]\n    return beams[0][0]',
    io: [
      { label: '候选序列', shape: '[k, t]' },
      { label: '扩展后', shape: '[k × V, t+1]' },
      { label: '保留', shape: '[k, t+1]' },
    ],
    viz: 'none',
  },

  // ---------------- 为三焦点模型补充 4 个 ----------------
  {
    slug: 'moe-routing',
    name: 'MoE Routing',
    fn: 'moe_routing',
    group: '为模型补',
    freq: 'extra',
    oneLine: '896→16 / 512→10 / 384→6：稀疏路由怎么选、怎么稳',
    explain:
      '每个 token 过一个小网络打分，选出 top-k 个专家，只把 token 送给这几位。稀疏度 = 选中数/专家总数：Kimi K3 是 16/896 ≈ 1/56，V4.1 Flash 是 6/384 = 1/64。真正的难点不是"选"，而是"别让所有 token 都挤向同几位专家" —— 路由塌缩会让大部分专家永远训不到。',
    code: 'def moe_routing(x, gate, experts, k=2):\n    scores = torch.softmax(x @ gate.T, -1)   # [L, E]\n    topv, topi = scores.topk(k, -1)          # 选 k 个专家\n    out = torch.zeros_like(x)\n    for e in range(len(experts)):\n        mask = (topi == e).any(-1)\n        if mask.any():\n            out[mask] += experts[e](x[mask]) * topv[mask].sum(-1, True)\n    return out',
    io: [
      { label: 'token', shape: '[L, d]' },
      { label: '路由分数', shape: '[L, E]（E = 专家数）' },
      { label: '选中', shape: '[L, k]' },
    ],
    viz: 'route',
  },
  {
    slug: 'gqa',
    name: 'GQA',
    fn: 'grouped_query_attention',
    group: '为模型补',
    freq: 'extra',
    oneLine: '分组查询注意力，Qwen3.8 用 64 Q / 4 KV 的极端配比',
    explain:
      '多个 Q 头共享同一组 K/V 头。MHA 是 1:1、MQA 是全部共享（N:1），GQA 取中间：把 Q 头分组，每组配一对 K/V。收益几乎全在 KV Cache —— Qwen3.8 的 64 Q / 4 KV 意味着缓存量直接降到 1/16，而质量损失很小。',
    code: 'def gqa(q, k, v, n_groups):\n    # q: [B, H, L, dh]；k/v: [B, G, L, dh]，G = H // n_groups\n    B, H, L, dh = q.shape\n    q = q.view(B, H // n_groups, n_groups, L, dh)\n    k = k.unsqueeze(2).expand(-1, -1, n_groups, -1, -1)\n    v = v.unsqueeze(2).expand(-1, -1, n_groups, -1, -1)\n    o = sdpa(q, k, v)\n    return o.reshape(B, H, L, dh)',
    io: [
      { label: 'Q', shape: '[B, 64, L, dh]' },
      { label: 'K/V', shape: '[B, 4, L, dh]' },
      { label: '输出', shape: '[B, 64, L, dh]' },
    ],
    viz: 'shape',
  },
  {
    slug: 'linear-attention',
    name: 'Linear Attention',
    fn: 'linear_attention',
    group: '为模型补',
    freq: 'extra',
    oneLine: 'K3 的 KDA 与 Qwen3.8 的 Gated DeltaNet 的共同底色',
    explain:
      '把 softmax(QKᵀ)V 换成 Q(KᵀV)：先算 KᵀV（一个 d×d 的矩阵，与 L 无关），再让 Q 去乘它。复杂度从 O(L²d) 降到 O(Ld²)，且可以写成递推形式 —— 每读一个 token 更新一次状态，KV Cache 彻底不需要了。代价是丢掉了 softmax 的锐利聚焦能力，所以要靠稀疏/门控等机制补强。',
    code: 'def linear_attention(Q, K, V):\n    # 不构造 L×L 矩阵，先聚合 KᵀV\n    KV = K.transpose(-2, -1) @ V      # [B, H, dh, dh]\n    return Q @ KV                     # [B, H, L, dh]\n\n# 递推形式：状态随 token 累积，显存与 L 无关\ndef recurrent_step(q_t, k_t, v_t, S):\n    S = S + torch.einsum("hd,he->de", k_t, v_t)\n    return torch.einsum("hd,de->he", q_t, S), S',
    io: [
      { label: '状态 S', shape: '[B, H, d_h, d_h]' },
      { label: 'KᵀV', shape: '[B, H, d_h, d_h]' },
      { label: '输出', shape: '[B, H, L, d_h]' },
    ],
    viz: 'shape',
  },
  {
    slug: 'gpt2-block',
    name: 'GPT-2 Block',
    fn: 'gpt2_block',
    group: '为模型补',
    freq: 'extra',
    oneLine: '一个完整的 Decoder block，把前面所有算子串起来',
    explain:
      'Pre-LN 结构：先 LayerNorm 再进注意力，残差相加；再 LayerNorm 进 FFN，残差相加。现代 LLM 的每一层基本都是这个形状 —— K3 的 KDA 层 / Gated MLA 层、Qwen3.8 的 Gated DeltaNet 层，差别只在把"注意力"那块换成什么。看懂这一块，就看懂了 Transformer 的一大半。',
    code: 'def gpt2_block(x, attn, ffn, ln1, ln2):\n    x = x + attn(ln1(x))      # 残差 1\n    x = x + ffn(ln2(x))       # 残差 2\n    return x\n\n# Pre-LN（现代）vs Post-LN（原始 Transformer）：\n#   Pre-LN 训练更稳，几乎不需要 warmup，已成为事实标准',
    io: [
      { label: '输入', shape: '[B, L, d]' },
      { label: 'LN → Attn → 残差', shape: '[B, L, d]' },
      { label: 'LN → FFN → 残差', shape: '[B, L, d]' },
    ],
    viz: 'shape',
  },
]

/** 分组配色 —— 写死在这里，避免 Tailwind 扫不到动态类名 */
export const GROUP_COLOR: Record<OpGroup, string> = {
  基础: '#94A3B8',
  注意力: '#22D3EE',
  推理策略: '#FB923C',
  为模型补: '#A78BFA',
}

export const FREQ_MARK: Record<Op['freq'], string> = {
  fire: '🔥',
  star: '⭐',
  bulb: '💡',
  extra: '★',
}

export const FREQ_LABEL: Record<Op['freq'], string> = {
  fire: 'TorchCode 高频',
  star: 'TorchCode 中频',
  bulb: 'TorchCode 低频',
  extra: '本站为三焦点模型补充',
}

/**
 * 三轨交叉链接：算子 → 轨道 A 的模块页 / 轨道 B 的训练页。
 * 这是本站与 TorchCode 的分工：TorchCode 是练习场（把算子写出来），
 * 这里是理解场（知道这个算子在哪个模型里、为什么非它不可）。
 */
export interface CrossLink {
  href: string
  label: string
}

export const OP_LINKS: Record<string, CrossLink[]> = {
  relu: [{ href: '/architecture/kimi-k3/situ-glu', label: 'K3 用 SiTU-GLU 取代朴素 ReLU' }],
  conv2d: [{ href: '/architecture/kimi-k3', label: 'K3 的 MoonViT-V2 视觉塔（401M）' }],
  'cross-entropy': [{ href: '/training', label: '轨道 B · 预训练的损失函数' }],
  'linear-regression': [{ href: '/training', label: '轨道 B · 从最小二乘到反向传播' }],
  sdpa: [{ href: '/architecture/kimi-k3/gated-mla', label: 'Gated MLA 改的就是这个式子' }],
  'multihead-attention': [{ href: '/architecture/kimi-k3/gated-mla', label: 'K3 如何砍掉多头的 KV' }],
  gqa: [
    { href: '/architecture/kimi-k3/gated-mla', label: 'MLA：GQA 之外的另一条路' },
    { href: '/architecture/qwen3-8/gated-attention', label: 'Qwen3.8 把 GQA 推到 16:1' },
  ],
  'causal-attention': [{ href: '/architecture/kimi-k3/kda', label: 'KDA 把因果性写进递推状态' }],
  rope: [
    { href: '/architecture/kimi-k3/gated-mla', label: 'RoPE 在 MLA 里怎么处理' },
    { href: '/architecture/qwen3-8/gated-attention', label: 'Qwen3.8 只给 64 维上 RoPE' },
  ],
  'kv-cache': [
    { href: '/architecture/kimi-k3/gated-mla', label: '为什么 K3 要削减 75% KV' },
    { href: '/architecture/deepseek-v4-flash/kv-compression', label: 'V4.1 Flash：FP4 主 KV 890 B/token' },
    { href: '/topics/kv-cache', label: '横向专题 · KV Cache 三条路线' },
  ],
  'linear-attention': [
    { href: '/architecture/kimi-k3/kda', label: 'KDA = 线性注意力 + 门控' },
    { href: '/architecture/qwen3-8/gated-deltanet', label: '另一条实现：Gated DeltaNet' },
  ],
  'moe-routing': [
    { href: '/architecture/kimi-k3/latent-moe', label: '896 选 16 的 Latent MoE' },
    { href: '/topics/moe-sparsity', label: '横向专题 · MoE 稀疏度三家对比' },
  ],
  'beam-search': [
    { href: '/architecture/qwen3-8/mtp', label: '多步预测也能当草稿器' },
    { href: '/architecture/deepseek-v4-flash/dspark', label: 'DSpark 半自回归草稿' },
  ],
  linear: [
    { href: '/architecture/kimi-k3/latent-moe', label: '专家里的矩阵都在哪' },
    { href: '/architecture/deepseek-v4-flash/engram', label: 'Engram 用查表替代矩阵乘' },
  ],
  'gpt2-block': [{ href: '/architecture/kimi-k3', label: '93 层就是 93 个这样的块' }],
}

export function getOpLinks(slug: string): CrossLink[] {
  return OP_LINKS[slug] ?? []
}

/** 剩余 21 个（⭐ 10 + 💡 11）—— 走待补清单 */
export const OPS_BACKLOG = { star: 10, bulb: 11 }

export function getOp(slug: string): Op | undefined {
  return OPS.find((o) => o.slug === slug)
}

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
