"""
seeing-llm 图片压缩流水线

按 static-site-image-pipeline 技能的规范跑流水线：
- SPECS = [("thumb", 800, 75), ("md", 1600, 80), ("xl", 2400, 80)]
- 输出 public/images/{k3,v4,qwen}/{thumb,md,xl}.webp
- 生成 manifests/images.json（前端查表用）
- 验证：原始合计 / 压缩后合计 / 单张最大尺寸

目标：raw/ → 约 2.5 MB，降幅 ≥ 95%。
"""

import json
import sys
from io import BytesIO
from pathlib import Path

from PIL import Image

# Pillow DecompressionBombWarning 关闭（P0 已实测需要）
Image.MAX_IMAGE_PIXELS = None

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "raw"
OUT_BASE = ROOT / "public" / "images"
MANIFEST = ROOT / "manifests" / "images.json"

# (档位名, 长边像素, webp quality)
SPECS = [
    ("thumb", 800, 75),
    ("md",    1600, 80),
    ("xl",    2400, 80),
]


def compress_one(src: Path) -> dict:
    """压缩一张原图，返回 manifest 中的一项"""
    im = Image.open(src)
    im.load()
    w0, h0 = im.size
    # 透明通道处理
    if im.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1] if im.mode in ("RGBA", "LA") else None)
        im = bg
    elif im.mode != "RGB":
        im = im.convert("RGB")

    item = {
        "id": src.stem,
        "src": str(src.relative_to(ROOT)),
        "original": {"width": w0, "height": h0, "bytes": src.stat().st_size},
        "variants": {},
    }

    for tier, target_long, q in SPECS:
        # 等比缩到长边 target_long
        if w0 >= h0:
            new_w = target_long
            new_h = round(h0 * target_long / w0)
        else:
            new_h = target_long
            new_w = round(w0 * target_long / h0)
        # 防止微小图被放大
        if new_w > w0:
            new_w, new_h = w0, h0

        scaled = im.resize((new_w, new_h), Image.LANCZOS)
        buf = BytesIO()
        scaled.save(buf, format="WEBP", quality=q, method=6)
        data = buf.getvalue()

        out_dir = OUT_BASE / tier
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"{src.stem}.webp"
        out_path.write_bytes(data)

        item["variants"][tier] = {
            "width": new_w,
            "height": new_h,
            "bytes": len(data),
            "path": str(out_path.relative_to(ROOT)).replace("\\", "/"),
        }

    return item


def main():
    if not RAW.exists():
        print(f"[err] raw/ 不存在，先跑 python scripts/fetch_raw.py")
        sys.exit(1)

    srcs = sorted([p for p in RAW.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg"}])
    if not srcs:
        print(f"[err] raw/ 下没有 .png/.jpg/.jpeg")
        sys.exit(1)

    print(f"==> Found {len(srcs)} source images in {RAW}")
    print(f"==> Output base: {OUT_BASE}")
    print(f"==> Specs: {SPECS}\n")

    total_in = 0
    total_out = {tier: 0 for tier, _, _ in SPECS}
    items = []

    for src in srcs:
        try:
            item = compress_one(src)
            items.append(item)
            total_in += item["original"]["bytes"]
            for tier, info in item["variants"].items():
                total_out[tier] += info["bytes"]
            print(
                f"[{src.stem}] {item['original']['width']}x{item['original']['height']} "
                f"{item['original']['bytes']:>10,} B → "
                + ", ".join(
                    f"{t}={info['bytes']:>9,} B" for t, info in item["variants"].items()
                )
            )
        except Exception as e:
            print(f"[err] {src.name}: {e}")

    # 写 manifest
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    summary = {
        "source_count": len(items),
        "original_total_bytes": total_in,
        "compressed_total_bytes": sum(total_out.values()),
        "tier_bytes": total_out,
        "compression_ratio": sum(total_out.values()) / total_in if total_in else 0,
        "items": items,
    }
    MANIFEST.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n==> Wrote {MANIFEST}")
    print(f"\n==> Summary:")
    print(f"    Source: {len(items)} images, {total_in/1024/1024:.2f} MB raw")
    for tier, n in total_out.items():
        print(f"    {tier:>6}: {n/1024:.1f} KB  ({n/total_in*100:.1f}% of raw)")
    print(f"    Total compressed: {sum(total_out.values())/1024/1024:.2f} MB "
          f"({sum(total_out.values())/total_in*100:.1f}% of raw)")
    target_ratio = 2.5 * 1024 * 1024
    actual = sum(total_out.values())
    if actual > target_ratio * 1.2:
        print(f"    [warn] 超过 P0 目标（2.5 MB）超过 20%")
    elif actual <= target_ratio:
        print(f"    [ok ] 达到 P0 目标（≤ 2.5 MB）")


if __name__ == "__main__":
    main()