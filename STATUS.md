# 进度快照

> 完整建设方案见 [`seeing-llm-建设方案-v2.1.md`](./seeing-llm-建设方案-v2.1.md)。

**当前阶段：P3 · V4.1 Flash + Qwen3.8 + 2 个横向专题（本地构建通过，等推送上线）**
**线上地址：https://weiyouzi321.github.io/seeing-llm/**
**静态页：49（P2 时 35）**

---

## 里程碑

| 阶段 | 内容 | 状态 |
|---|---|---|
| P0 | 骨架 + 图片流水线 + 部署链路 | ✅ 已上线 |
| R1 | 视觉重构为「未来科幻风」 | ✅ 已上线 |
| R2 | 首页与子页填充真实内容 | ✅ 已上线 |
| P1 | Kimi K3 垂直切片（概览 + 5 个模块页） | ✅ 已上线 |
| P2 | 算子与策略 20 页 + 交互可视化 | ✅ 已上线（commit `abe939c`） |
| P3 | V4.1 Flash + Qwen3.8 + 2 个横向专题 | 🔄 代码完成，本地构建 49 页通过 |
| P4 | 训练全流程（MiniMind 8 阶段） | ⬜ 待开始 |
| P5 | 收尾 + 待补清单 | ⬜ 待开始 |

## 已上线内容

- **首页**：Hero（闪烁光标）+ 三焦点模型卡 + **双模型层墙交互** + 10 项横向对照表 + 三轨 + 路线图
- **/architecture**：层墙 + **14 个模块清单（全部可点）** + 对齐页/专题入口 + 12 模型全景表预告
- **/architecture/{kimi-k3, deepseek-v4-flash, qwen3-8}**：三模型通用概览 ——
  层骨架 + 核心交互（K3/Qwen 走 **3:1 配比探索器**，V4 走 **CED 纵向切分图**）+ 完整规格 + 模块入口
- **/architecture/{kimi-k3, deepseek-v4-flash, qwen3-8}/{slug}**：**14 个模块页**，
  统一三段式 **问题 → 设计 → 取舍** + 交互可视化 + 关键要点 + 「同一件事，别家怎么做」横向链接
- **/architecture/alignment**：双模型层墙对齐（K3 ⟷ Qwen3.8 的 23×4 逐组/逐位对照）
- **/topics/{moe-sparsity, kv-cache}**：2 个横向专题，各带一个可拖组件
- **/training**：MiniMind 规格（64M / 8 层 / 768 / 词表 6400）+ 8 阶段时间线
- **/ops**：高频前 20 算子（16 🔥 + 4 补），按「基础 / 注意力 / 推理策略 / 为模型补」分四组，
  卡片直达详情页，带「可交互」角标
- **/ops/{20 个 slug}**：每个算子一页 —— 它在做什么 / 亲手调一调（交互可视化）/
  张量形状链路 / PyTorch 教学实现 / 它用在哪（三轨交叉链接）/ 上下页导航
- **/about**：定位、数据来源、Kimi K3 License 说明、性能硬约束
- **/plan**：v2.1 决策摘要 + 里程碑 + 明确不做清单

### P2 交互可视化清单（13 个组件，`src/components/opviz/`）

| 组件 | 挂在哪个算子 | 教学点 |
|---|---|---|
| `ActivationCurves` | relu | ReLU/GELU/SiLU/Leaky 四曲线对比，可开关 |
| `SoftmaxTemp` | softmax | 温度 T 如何把分布从贪心推向均匀（熵实时算） |
| `NormDemo` | layer-norm | 原始 / LayerNorm / RMSNorm 三视图 + μ、σ 对比 |
| `DropoutDemo` | dropout | inverted dropout 为什么输出均值不变 |
| `LossDemo` | cross-entropy | −log p 曲线；160K 词表随机猜 = 11.98 |
| `RopeDial` | rope | 旋转后内积只与相对位置有关（「两者 +1」按钮可验证） |
| `CausalMask` | sdpa / causal-attention | L×L 矩阵掩码；被遮的「算完再扔」 |
| `SampleDemo` | top-k-top-p | 核采样规则可视化 + 30 次采样直方图 |
| `KvCacheDemo` | kv-cache | Σt² vs Σt；加速比 = (2L+1)/3 |
| `MoeRouting` | moe-routing | **路由塌缩**模拟 + 负载均衡损失开关 + 基尼系数 |
| `GqaHeads` | multihead-attention / gqa | Q 头与 KV 头分组；缓存比 = G/H |
| `ConvSweep` | conv2d | 3×3 核在 7×7 上滑窗，四种核可切 |
| `ShapeFlow` | linear / embedding / gpt2-block | 张量形状链路通用渲染 |

## 关键数据

| 项 | 值 |
|---|---|
| 站点地址 | https://weiyouzi321.github.io/seeing-llm/ |
| 首页 HTML 体积 | 77.6 KB（重构前 34.7 KB） |
| 子页面 | architecture 47.5 KB · ops 47.8 KB · 单个算子页 25–40 KB · training 27.5 KB · plan 23.6 KB · about 21.9 KB |
| 静态页面总数 | 35（原 15）→ 首页 + 5 静态页 + 6 个 K3 页 + 21 个算子页 + 404 |
| 唯一数据源 | `src/lib/models.ts`（三模型规格）· `src/lib/ops.ts`（算子 + 训练阶段） |
| 站点 basePath | `/seeing-llm` |
| 图片流水线压缩比 | 20.85 MB → 0.95 MB（4.6%） |

## 设计系统（未来科幻风）

```
底色   #05070D (void)      面板   #0A101E (panel)
抬升   #101828 (raised)    描边   #1B2740 (line)
文字   #E6EDF7 / #8A9BB8 / #5A6B85
K3 紫  #A78BFA   V4.1 青 #22D3EE   Qwen3.8 橙 #FB923C
```

- 44px 工业网格 `bg-grid` + 顶部极光 `bg-aurora` + 霓虹发光
- `.cursor-blink` 终端闪烁光标（呼应参考站 `MS&E 435_` 的下划线）
- 组件类：`.panel` `.card-interactive` `.eyebrow` `.stat-value` `.rule` `.btn-primary` `.btn-ghost`
- 尊重 `prefers-reduced-motion`

## 踩过的坑（已全部修复）

### 1. `npm ci` 需要 lockfile → 改用 `npm install`

沙箱无法本地生成 `package-lock.json`（npm 触发 wsl 黑名单，bun 卡在依赖解析）。
→ 改 `npm install --no-audit --no-fund`；待能装依赖后补 lockfile 并切回 `npm ci`。

### 2. `actions/setup-node` 的 `cache: 'npm'` 也需要 lockfile

→ 先移除 cache；有 lockfile 后可恢复。

### 3. `Cannot find name 'DiagramCard'`

`page.tsx` 漏 import（被后续编辑覆盖）→ 补 import。
**教训**：改组件后 grep 全仓 import，不要只信 Edit 的返回值。

### 4. ⭐ 原生 `<img src>` 不会自动加 basePath

`<img src="/images/...">` 在子路径部署下 → 404，必须拼成 `/seeing-llm/images/...`。
→ 在 `lib/diagrams.ts` 的 `getDiagramPath()` 里显式拼 `NEXT_PUBLIC_BASE_PATH`。
**next/link 会自己加前缀，但 `<img>`、fetch()、next/script 都不会。**

### 5. GitHub Pages 需要单独启用

`peaceiris/actions-gh-pages` 只推分支，不自动开 Pages。
→ `POST /repos/{owner}/{repo}/pages` body `{"source":{"branch":"gh-pages","path":"/"}}`。

### 6. 沙箱读取 Actions 日志的正确姿势

```bash
TOK=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill | grep '^password=' | cut -d= -f2)
curl --ssl-no-revoke -sL -H "Authorization: Bearer $TOK" \
  "https://api.github.com/repos/<owner>/<repo>/actions/runs/<run_id>/logs" -o logs.zip
```

- `curl` 默认因 `CRYPT_E_REVOCATION_OFFLINE` 失败 → 加 `--ssl-no-revoke`
- Python 走 `ssl._create_unverified_context()` + `check_hostname=False`

### 7. ⭐ `text-${accent}` 动态类名 Tailwind JIT 扫不到

模型配色此前**一直没渲染出来**（不报错，静默失效）。
→ 在 `models.ts` 里显式写死 `textClass` / `borderClass` / `hex` 三个字段。
**教训**：Tailwind 静态扫描源文件，模板字符串拼的类名不会被生成。

### 8. ⭐ 自定义色名 `base` 撞默认字号类 `text-base`

把颜色定义成 `base` 后，`@apply ... text-base`（本意字号 1rem）被编译成 `color: #05070D` ——
**按钮文字直接隐形**。Tailwind 的 textColor 插件排在 fontSize 之后，颜色胜出。
→ 颜色改名为 `void`（`bg-void`）。
**教训**：自定义色名要避开 base / sm / lg / xl / 2xl 等所有默认字号名。

### 9. ⭐⭐ `next/link` 会自动加 basePath —— 手动拼会叠加成双重前缀

配了 `basePath: '/seeing-llm'` 后：

| 写法 | 结果 |
|---|---|
| `<Link href="/architecture">` | `/seeing-llm/architecture/` ✅ Next.js 自动补 |
| `<Link href={`${base}/architecture`}>` | `/seeing-llm/seeing-llm/architecture/` ❌ **叠加** |
| `<a href={`${base}/architecture`}>` | `/seeing-llm/architecture` ✅ 原生 a 不自动补，必须手写 |

症状很隐蔽：首页卡片点进去 404，页脚同样的链接却能打开 —— 因为一用 `next/link`、一用原生 `<a>`。
→ 规则：**`next/link` 一律写根路径，原生 `<a>` / `<img>` / `fetch` / `next/script` 一律手写完整前缀。**

顺带移除 `layout.tsx` 里的 `<base href={basePath}>`：basePath 已让所有资源输出绝对路径，
`<base>` 只会让相对路径与 `#锚点` 被错误解析到 `/seeing-llm#xxx`。

排查脚本：`scripts/fix_basepath.py`（批量去掉 next/link 的手动前缀）。

## 技术债

- ~~**没有 `package-lock.json`**~~ —— P2 已补（lockfileVersion 3），CI 切回 `npm ci` + `cache: 'npm'`，
  构建耗时 110s → 48s。
- **架构图仍是合成占位图** —— HF 在沙箱返回 502，真实原图未拉下来。
  文件名与压缩档位已固定，替换 `raw/` 后重跑 `compress.py` 即可，无需改前端。
- **`node_modules` 未纳入版本控制** —— 沙箱本地安装用，记得确认 `.gitignore` 已忽略。

### 10. ⭐ 静态导出下客户端组件也会预渲染 → 首屏严禁 `Math.random()`

`output: 'export'` 时 `'use client'` 组件同样会在构建期跑一次生成 HTML。
若初始 state 用 `Math.random()`，服务端 HTML 与客户端首次渲染不一致 → hydration 报错。
→ 口诀：**首屏用种子（`mulberry32`），交互才用真随机**（见 `opviz/ui.tsx`）。

### 11. ⭐ 组件返回类型写 `ReactNode` 会导致「不能用作 JSX 组件」

`@types/react` 18 要求函数组件返回 `ReactElement | null`。
派发组件 `OpViz` 若声明成 `ReactNode`，调用处 `<OpViz />` 直接报
*"its return type 'ReactNode' is not a valid JSX element"*。
→ 派发函数统一写 `JSX.Element | null`。

### 12. `setState` 连续调用会读到同一个闭包快照

「连续 10 批」按钮里循环 10 次 `send()`，每次都基于**同一个**旧 state 计算，
结果只生效最后一批。
→ 改为内部循环累积（`let cur = prev; for (...) cur = step(cur)`），
并把 `Math.random()` 预生成在 `setState` **外面**，保证 updater 是纯函数（StrictMode 会双调用）。

### 13. Tailwind `@layer components` 里的自定义类会被 purge

`.rng::-webkit-slider-thumb` 这类纯伪元素样式放在 `@layer` 内风险高。
→ 滑块样式移到 `@layer` 之外的普通 CSS 区（globals.css 底部）。

## P3 · V4.1 Flash + Qwen3.8 + 横向专题（2026-09-14 完成，待上线）

**12 个新页面**：静态页 35 → 49

| 路由 | 内容 |
|---|---|
| `/architecture/[model]` | 三模型通用概览页（替换只服务 K3 的旧 `kimi-k3/page.tsx`） |
| `/architecture/[model]/[slug]` | 通用模块页，**14 个模块全部上线** |
| `/architecture/alignment` | 双模型层墙对齐（K3 ⟷ Qwen3.8） |
| `/topics`、`/topics/[slug]` | 2 个横向专题 + 各自的可拖组件 |

**6 个新交互组件**

| 组件 | 位置 | 演示的性质 |
|---|---|---|
| `CedFlow` | V4 · ced | prompt 侧 KV 从 n 份压成 1 份的收益（含 8B/16B 非对称激活） |
| `CsaModes` | V4 · csa2 | 「Reindex 漏选 → 后续 Reuse 全都看不见」 |
| `DeltaRule` | Qwen3.8 · gated-deltanet | 写前先擦除 → 状态可覆写；纯累加只能稀释 |
| `MtpDraft` | Qwen3.8 · mtp | γ 存在内部最优；α 低时直接跌破 1.0 |
| `SparsityCompare` | topics · moe-sparsity | 冷启动上界 (1−k/E)^T 的三家对比 |
| `KvRoutes` | topics · kv-cache | 每 token 字节 → 整段上下文占用，量级差上百倍 |

**数据源重构**：`src/lib/modules.ts` 取代 `src/lib/k3.ts`，统一承载 14 个模块文档；
新增 `src/lib/routes.ts` 管理 `ModelId ↔ URL 段落` 映射（改 URL 不必动数据）。
OP_LINKS 扩充到 20 条，算子页现在能指向 V4/Qwen 模块与横向专题。

### 踩坑记录（P3 新增）

### 14. ⭐ 旧静态路由与新动态路由同名会让两个 `[model]` 段打架

`/architecture/kimi-k3/page.tsx`（静态）与 `/architecture/[model]/page.tsx`（动态）并存时，
虽然 Next 会让静态优先，但两个文件的 imports / 文案各写一套，改一处漏一处。
→ 直接删掉静态那条，统一走动态段；用 `MODEL_ROUTE` 保证 `kimi-k3` 这个 URL **不变**（外部链接不失效）。

### 15. 数据在 `models.ts`、链接在 `routes.ts`、文档在 `modules.ts`

一开始把 URL 硬编码在 4 个页面里，改一次路由要改 4 处，还容易漏掉 `ops.ts` 的交叉链接。
→ 三件事分开：规格事实 / URL 命名 / 模块文档各一个文件，页面只调用 `modelPath()` / `modulePath()`。

### 16. 前端数值估算必须把口径写在页面上

`KvRoutes` 里的「161 KB/token」依赖一串假设（head_dim、精度、忽略的部分）。
→ 每个简化模型都配一条 `Note` 写明三条假设，并强调「看量级和趋势，不要直接套绝对值」。

## P3b · 轨道 A 收口（A1 全景表 + A5 演进时间轴）

补齐方案 v2.1 §三 里轨道 A 最后两块，至此 **轨道 A 五块交付齐了**：
A1 全景对比 ×1 / A2 解剖页 ×3 / A3 模块页 ×14 / A4 横向专题 ×2 / A5 演进时间轴 ×1。

| 新增 | 内容 |
|---|---|
| `src/lib/panorama.ts` | 12 个代表性开源模型规格 + 7 种筛选 / 7 种排序 / 稀疏度计算 |
| `src/components/PanoramaTable.tsx` | 三轴可切换散点图（稀疏度 / 上下文 / 规模）+ 10 列对照表 + 点选详情卡 |
| `/architecture/panorama` | A1 页面：三个趋势 + 主交互 + 口径说明 |
| `src/lib/evolution.ts` | 24 个节点、五条线索（注意力 / 稀疏化 / 上下文与精度 / 骨架 / 训练与对齐） |
| `src/components/EvolutionTimeline.tsx` | 泳道缩略图（含自动避让）+ 纵向详细时间轴 + 线索筛选 |
| `/architecture/evolution` | A5 页面：五条线索说明 + 时间轴 + 三种读法 + 口径说明 |

**A1 的三个结论**（写在页面上）：
总参数 405B → 2.8T（约 7 倍）而激活参数始终在 5B–104B；
注意力从「全注意力 + 省 KV」走向 3:1 层间配比混合；1M 上下文从噱头变门槛但三条实现路径完全不同。

**A5 的选入标准**：这条是不是后面某个设计的前身？
所以 2020 年没火起来的线性注意力第一波权重高于当年的 SOTA —— 它是 KDA 的前身。

### 踩坑记录（P3b 新增）

### 17. 全景表的数字宁可留空也不要猜

GLM-4.5 的层数、Qwen3-VL 的隐藏维在官方口径里没找到。
→ 把 `layers` / `hidden` 设成可选，渲染成「—」，并在「口径说明」里明说哪些是空的。
编一个看起来像事实的数字，比缺一个数字的伤害大得多。

### 18. 泳道图必须做碰撞避让

2022 年训练侧挤了三条、2026 年注意力侧 K3 与 Qwen3.8 只差一个月，
直接按时间算 x 会让圆点完全重叠。
→ `buildDots()` 里做最简单的避让：与前一个点距离 < 11px 就上下错开 6px（按序号奇偶交替）。
不需要通用力导向布局，这个规模下够用且确定性好。

### 19. 许可一栏要区分「宽松」与「有附加条件」

Llama 3.1 Community（月活上限 + 品牌限制）和 Kimi K3 自定义许可都不是 MIT/Apache。
→ 加 `licenseTone` 字段，非宽松的标 ⚠ 并给 title 提示「商用前请读原文 —— 本栏不构成法律建议」。

## 下一步（P4）

1. **训练全流程**（MiniMind 8 阶段可视时间线，数据已在 `TRAIN_STAGES` / `TRAIN_FACTS`）
2. `/training` 目前还是占位页 —— P4 的落点是把它做成可拖的时间线 + 每阶段一段代码
3. P5 收尾：剩余 21 个算子走待补清单；全站三轨交叉链接补到算子 ⇄ 模块 ⇄ 阶段三向互通
4. 轨道 A 剩余缺口：14 个模块里 8 个还没有专属交互；架构图仍是合成占位图（HF 在沙箱 502）
