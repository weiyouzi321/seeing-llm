"""
seeing-llm 图片采集脚本

从官方渠道下载 17 张焦点模型架构原图到 raw/。
原图不入库（写入 .gitignore），仅作为压缩流水线的输入。

数据来源：
- Kimi K3：HF kimi-ai/Kimi-K3、技术报告 PDF
- DeepSeek V4.1 Flash：HF deepseek-ai/DeepSeek-V4.1-Flash、技术报告 PDF（2026-09-10）
- Qwen3.8-2.4T-A95B：HF Qwen/Qwen3.8-2.4T-A95B、ModelScope
"""

import json
import os
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "raw"
RAW.mkdir(exist_ok=True)

# 来源清单（P0 阶段先填主要的几张，后续 P1/P3 补全）
SOURCES = [
    {
        "id": "k3_overall",
        "model": "k3",
        "label": "Kimi K3 整体架构图",
        "url": "https://kimi-moonlight.oss-cn-hangzhou.aliyuncs.com/Kimi-K3-architecture.png",
        "expected_min_bytes": 100_000,
        "source": "官方技术报告 PDF · kimi-ai/Kimi-K3",
    },
    {
        "id": "k3_kda",
        "model": "k3",
        "label": "KDA 线性注意力结构",
        "url": "https://kimi-moonlight.oss-cn-hangzhou.aliyuncs.com/Kimi-K3-KDA.png",
        "expected_min_bytes": 50_000,
        "source": "KDA 论文 arXiv:2510.26692",
    },
    {
        "id": "v4_overall",
        "model": "v4",
        "label": "DeepSeek V4.1 Flash 整体架构图",
        "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/architecture.png",
        "expected_min_bytes": 100_000,
        "source": "HF deepseek-ai/DeepSeek-V4.1-Flash README",
    },
    {
        "id": "v4_ced",
        "model": "v4",
        "label": "CED 因果编码器-解码器结构",
        "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/ced.png",
        "expected_min_bytes": 50_000,
        "source": "V4.1 技术报告 PDF（2026-09-10）",
    },
    {
        "id": "v4_csa2",
        "model": "v4",
        "label": "CSA2 跨层稀疏注意力",
        "url": "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/resolve/main/csa2.png",
        "expected_min_bytes": 50_000,
        "source": "V4.1 技术报告 PDF",
    },
    {
        "id": "qwen_overall",
        "model": "qwen",
        "label": "Qwen3.8 整体架构图",
        "url": "https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B/resolve/main/architecture.png",
        "expected_min_bytes": 100_000,
        "source": "HF Qwen/Qwen3.8-2.4T-A95B README",
    },
    {
        "id": "qwen_gated_deltanet",
        "model": "qwen",
        "label": "Gated DeltaNet 结构",
        "url": "https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B/resolve/main/gated-deltanet.png",
        "expected_min_bytes": 50_000,
        "source": "Qwen3.8 技术报告",
    },
    {
        "id": "qwen_gated_attn",
        "model": "qwen",
        "label": "Gated Attention 结构",
        "url": "https://huggingface.co/Qwen/Qwen3.8-2.4T-A95B/resolve/main/gated-attention.png",
        "expected_min_bytes": 50_000,
        "source": "Qwen3.8 技术报告",
    },
]


def download(url: str, dest: Path, min_bytes: int):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "seeing-llm/0.1"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = resp.read()
        if len(data) < min_bytes:
            print(f"  [warn] {url} only got {len(data)} bytes (expected > {min_bytes})")
            return False
        dest.write_bytes(data)
        return True
    except Exception as e:
        print(f"  [err ] {url}: {e}")
        return False


def main():
    print(f"==> Target: {RAW}")
    print(f"==> Sources: {len(SOURCES)}\n")

    manifest = []
    ok_count = 0
    skip_count = 0
    fail_count = 0

    for s in SOURCES:
        out = RAW / f"{s['id']}.png"
        # 若以 .jpg 结尾改后缀
        if s["url"].lower().endswith((".jpg", ".jpeg")):
            out = RAW / f"{s['id']}.jpg"

        print(f"[{s['id']}] {s['label']}")
        if out.exists() and out.stat().st_size > s["expected_min_bytes"]:
            print(f"  [skip] already exists ({out.stat().st_size:,} bytes)")
            skip_count += 1
        else:
            if download(s["url"], out, s["expected_min_bytes"]):
                print(f"  [ok ] {out.name} ({out.stat().st_size:,} bytes)")
                ok_count += 1
            else:
                fail_count += 1

        manifest.append({
            **s,
            "local_path": str(out.relative_to(ROOT)) if out.exists() else None,
            "size_bytes": out.stat().st_size if out.exists() else 0,
        })

    # 写元数据
    meta = {
        "total_sources": len(SOURCES),
        "downloaded_ok": ok_count,
        "skipped_existing": skip_count,
        "failed": fail_count,
        "items": manifest,
    }
    (RAW / "_metadata.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\n==> Wrote {RAW / '_metadata.json'}")
    print(f"==> Stats: ok={ok_count} skip={skip_count} fail={fail_count}")

    if fail_count == len(SOURCES):
        print("\n[hint] 全部下载失败 → 检查网络，或 URL 模式（HF 文件通常在 resolve/main/）。")
        sys.exit(2)


if __name__ == "__main__":
    main()