# 进度快照

> 完整建设方案见 [`seeing-llm-建设方案-v2.1.md`](./seeing-llm-建设方案-v2.1.md)。

**当前阶段：P2 · 算子与策略 20 页（20 个算子页 + 13 个交互可视化）**
**线上地址：https://weiyouzi321.github.io/seeing-llm/**

---

## 里程碑

| 阶段 | 内容 | 状态 |
|---|---|---|
| P0 | 骨架 + 图片流水线 + 部署链路 | ✅ 已上线 |
| R1 | 视觉重构为「未来科幻风」 | ✅ 已上线 |
| R2 | 首页与子页填充真实内容 | ✅ 已上线 |
| P1 | Kimi K3 垂直切片（概览 + 5 个模块页） | ✅ 已上线 |
| P2 | 算子与策略 20 页 + 交互可视化 | ✅ 已上线（commit `abe939c`） |
| P3 | V4.1 Flash + Qwen3.8 + 2 个横向专题 | ⬜ 待开始 |
| P4 | 训练全流程（MiniMind 8 阶段） | ⬜ 待开始 |
| P5 | 收尾 + 待补清单 | ⬜ 待开始 |

## 已上线内容

- **首页**：Hero（闪烁光标）+ 三焦点模型卡 + **双模型层墙交互** + 10 项横向对照表 + 三轨 + 路线图
- **/architecture**：层墙 + 14 个模块清单（每页一句话说明）+ 12 模型全景表预告
- **/architecture/kimi-k3**：K3 概览 —— 层墙 + **3:1 配比探索器** + 完整规格 + 模块入口
- **/architecture/kimi-k3/{kda, gated-mla, attnres, latent-moe, situ-glu}**：5 个模块页，
  统一三段式 **问题 → 设计 → 取舍** + 关键要点；KDA 页带 **AttentionScaling** 交互
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

- **没有 `package-lock.json`** —— 补上后应把 `npm ci` 与 `cache: 'npm'` 切回来。
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

## 下一步（P3）

1. V4.1 Flash + Qwen3.8 模块页（层骨架与 K3 同构 23×4，可复用模板）
2. **双模型层墙**：K3 与 Qwen3.8 逐层对齐
3. 两个横向专题：MoE 稀疏度三条路线 / KV Cache 三条路线
4. P4 训练全流程（MiniMind 8 阶段可视时间线，数据已在 `TRAIN_STAGES`）
