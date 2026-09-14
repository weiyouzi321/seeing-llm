# 进度快照

> 完整建设方案见 [`seeing-llm-建设方案-v2.1.md`](./seeing-llm-建设方案-v2.1.md)。

**当前阶段：P1 · 视觉重构已完成 + 内容地基已铺，K3 模块页开发中**
**线上地址：https://weiyouzi321.github.io/seeing-llm/**

---

## 里程碑

| 阶段 | 内容 | 状态 |
|---|---|---|
| P0 | 骨架 + 图片流水线 + 部署链路 | ✅ 已上线 |
| R1 | 视觉重构为「未来科幻风」 | ✅ 已上线 |
| R2 | 首页与子页填充真实内容 | ✅ 已上线 |
| P1 | Kimi K3 垂直切片（5 个模块页） | 🚧 进行中 |
| P2 | 算子与策略 20 页 | ⬜ 待开始 |
| P3 | V4.1 Flash + Qwen3.8 + 2 个横向专题 | ⬜ 待开始 |
| P4 | 训练全流程（MiniMind 8 阶段） | ⬜ 待开始 |
| P5 | 收尾 + 待补清单 | ⬜ 待开始 |

## 已上线内容

- **首页**：Hero（闪烁光标）+ 三焦点模型卡 + **双模型层墙交互** + 10 项横向对照表 + 三轨 + 路线图
- **/architecture**：层墙 + 14 个模块清单（每页一句话说明）+ 12 模型全景表预告
- **/training**：MiniMind 规格（64M / 8 层 / 768 / 词表 6400）+ 8 阶段时间线
- **/ops**：高频前 20 算子（16 🔥 + 4 补），按「基础 / 注意力 / 推理策略 / 为模型补」分四组
- **/about**：定位、数据来源、Kimi K3 License 说明、性能硬约束
- **/plan**：v2.1 决策摘要 + 里程碑 + 明确不做清单

## 关键数据

| 项 | 值 |
|---|---|
| 站点地址 | https://weiyouzi321.github.io/seeing-llm/ |
| 首页 HTML 体积 | 77.6 KB（重构前 34.7 KB） |
| 子页面 | architecture 47.5 KB · ops 40.2 KB · training 27.5 KB · plan 23.6 KB · about 21.9 KB |
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

## 技术债

- **没有 `package-lock.json`** —— 本地装不了依赖。补上后应把 `npm ci` 与 `cache: 'npm'` 切回来。
- **架构图仍是合成占位图** —— HF 在沙箱返回 502，真实原图未拉下来。
  文件名与压缩档位已固定，替换 `raw/` 后重跑 `compress.py` 即可，无需改前端。

## 下一步（P1 剩余）

1. `/architecture/kimi-k3` 概览页 —— 真实规格 + 层骨架可交互图
2. 5 个模块页：KDA / Gated MLA / AttnRes / Stable LatentMoE / SiTU-GLU
   每页一个自绘 SVG 的可拖可点组件（不用位图）
