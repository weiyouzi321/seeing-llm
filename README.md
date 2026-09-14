# seeing-llm · 看见大模型

把"大模型是怎么造出来的"从论文与源码，变成**可点、可拖、可算给你看**的交互式教材。

聚焦 **Kimi K3**、**DeepSeek V4.1 Flash**、**Qwen3.8-2.4T-A95B** 三个最新最知名的开源旗舰。

## 站点

🌐 **已上线**：https://weiyouzi321.github.io/seeing-llm/

当前为 **P0 阶段**（项目骨架 + 图片流水线）：
首页 / 关于 / 方案 / 三个轨道占位页 已可访问，焦点模型图是占位合成图。
P1 起陆续交付真实内容。

## 三轨信息架构

- **轨道 A · 架构解剖**：14 个模块页，每页一个"它为什么这样设计"的可拖可点组件
- **轨道 B · 训练全流程**：MiniMind 8 阶段可视时间线（P4）
- **轨道 C · 算子与策略**：TorchCode 高频前 20 个算子

## 里程碑

| 阶段 | 内容 | 状态 |
|---|---|---|
| **P0** | 项目骨架 + 图片流水线（101 MB → 2.5 MB） | ✅ 已完成 |
| P1 | Kimi K3 垂直切片（约 12 页） | ⏳ |
| P2 | 算子前 20 页 | ⏳ |
| P3 | 补齐 V4.1 Flash + Qwen3.8 + 双模型层墙 + 2 个横向专题 | ⏳ |
| P4 | 训练全流程（轨道 B） | ⏳ |
| P5 | 收尾 + 「待补清单」上线 | ⏳ |

进度细节见 [`STATUS.md`](./STATUS.md)。

## 技术栈

- Next.js 14.2.5（App Router · `output: 'export'` · `trailingSlash`）
- TypeScript 5.5.3 · Tailwind CSS 3.4.6
- 部署：GitHub Actions → `out/` → `peaceiris/actions-gh-pages` → `gh-pages`

> ⚠️ **basePath 坑**：部署在 `/seeing-llm` 子路径下，`next/link` 会自动加前缀，
> 但原生 `<img src>`、`fetch()`、`next/script` **都不会**。涉及静态资源的路径必须
> 显式拼 `process.env.NEXT_PUBLIC_BASE_PATH`（见 `src/lib/diagrams.ts`）。

## 图片流水线

```bash
python scripts/make_placeholder.py   # 生成/补齐原图到 raw/
python scripts/compress.py           # 三档压缩 → public/images/{thumb,md,xl}/
```

- `thumb` 800px q75 · `md` 1600px q80 · `xl` 2400px q80
- 实测 20.85 MB → 0.95 MB（**4.6%**）。降幅主要来自降分辨率，不是换格式。
- 原图 `raw/` 不入库（见 `.gitignore`）；只提交压缩产物。
- 详见 [`scripts/README.md`](./scripts/README.md)。

## 本地开发

```bash
npm install
npm run dev                # http://localhost:3000
npm run build              # 静态导出到 out/（CI 会自动设置 BASE_PATH）
npx serve out -l 3000      # 预览产物
```

## 建设方案

完整内容、设计、开发方案见 [`seeing-llm-建设方案-v2.1.md`](./seeing-llm-建设方案-v2.1.md)（规格冻结版）。

## 许可

代码与内容采用 MIT 协议（仅本站原创部分）。站点引用的架构图、模型卡内容遵循原方许可（K3 为 Kimi K3 License）。

---

v2.1 · 规格冻结 · 2026-09-14