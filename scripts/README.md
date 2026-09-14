# Scripts

## fetch_raw.py

从官方渠道下载 17 张焦点模型架构原图到 `raw/`。
原图不入库（写入 `.gitignore`），仅作为压缩流水线的输入。

```bash
python scripts/fetch_raw.py
```

数据来源：
- Kimi K3：HF `moonshotai/Kimi-K3`、技术报告 PDF
- DeepSeek V4.1 Flash：HF `deepseek-ai/DeepSeek-V4.1-Flash`、技术报告 PDF（2026-09-10）
- Qwen3.8-2.4T-A95B：HF `Qwen/Qwen3.8-2.4T-A95B`、ModelScope

## make_placeholder.py

当外网下载不可用时（沙箱限制），生成 12000×9000 的合成占位图，每张约 4 MB。
P1/P3 阶段会用 `fetch_raw.py` 的真实图覆盖。

```bash
python scripts/make_placeholder.py
```

## compress.py

按 [static-site-image-pipeline] 技能的规范跑流水线：
- 三档输出：`thumb`(800px/q75) / `md`(1600px/q80) / `xl`(2400px/q80)
- 全部 WebP（Lanczos 重采样 + method=6）
- 输出到 `public/images/{tier}/{id}.webp`
- 生成 `manifests/images.json`（前端查表）

```bash
python scripts/compress.py
```

P0 实测：5 张原图 20.85 MB → 0.95 MB（4.6%），md 档每张约 65 KB。