"""
seeing-llm P0 占位图生成器（v2）

由于网络环境受限（P0 沙箱无法稳定访问 huggingface.co / OSS 等），
P0 阶段先用合成大图验证图片流水线（目标：单张原图 ≥3MB → 压缩后
md 档 < 200 KB）。

P1/P3 阶段会把占位图替换为真实架构原图。
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

Image.MAX_IMAGE_PIXELS = None

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "raw"
RAW.mkdir(exist_ok=True)


def make_busy_image(
    out_path: Path,
    title: str,
    subtitle: str,
    width: int = 12000,
    height: int = 9000,
):
    """生成一张大尺寸"真实感"架构图：背景 + 大量小色块 + 文字标签 + 装饰线。
    颜色复杂、文字密集 → PNG 文件不会被压得太狠，能模拟真实架构图大小。
    """
    import random
    rng = random.Random(42)  # 固定种子，结果可复现

    # 背景：深空蓝紫
    img = Image.new("RGB", (width, height), "#0F172A")
    draw = ImageDraw.Draw(img)

    # 字体
    def load_font(size: int):
        for fnt in ["arialbd.ttf", "arial.ttf", "Arial.ttf"]:
            try:
                return ImageFont.truetype(fnt, size)
            except Exception:
                continue
        return ImageFont.load_default()

    title_font = load_font(180)
    sub_font = load_font(100)
    block_font = load_font(72)
    tiny_font = load_font(48)

    # 标题
    draw.text((200, 250), title, fill="#FFFFFF", font=title_font)
    draw.text((200, 480), subtitle, fill="#A5B4FC", font=sub_font)

    # 大模块块（4 列 × 12 行）
    cols, rows = 4, 12
    block_w = (width - 600) // cols
    block_h = (height - 1500) // rows
    grid_x0, grid_y0 = 300, 1000

    colors = ["#4F46E5", "#7C3AED", "#06B6D4", "#22D3EE", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899"]

    for r in range(rows):
        for c in range(cols):
            x = grid_x0 + c * block_w + 40
            y = grid_y0 + r * block_h + 30
            color = colors[(r * cols + c + hash(title)) % len(colors)]
            draw.rounded_rectangle(
                [(x, y), (x + block_w - 80, y + block_h - 60)],
                radius=20,
                fill=color,
                outline="#FFFFFF",
                width=4,
            )
            label = f"L{r*cols + c + 1:03d}"
            draw.text((x + 30, y + 20), label, fill="#FFFFFF", font=block_font)
            sub_labels = ["KDA", "MLA", "MOE", "FFN", "EMBED", "NORM", "GQA", "ATTN"]
            sub = sub_labels[(r + c) % len(sub_labels)]
            draw.text((x + 30, y + 110), sub, fill="#E0E7FF", font=tiny_font)
            # 装饰小方块
            for _ in range(8):
                cx = x + 200 + rng.randint(0, max(0, block_w - 280))
                cy = y + 200 + rng.randint(0, max(0, block_h - 240))
                cs = rng.randint(8, 24)
                cc = colors[(r + c + rng.randint(0, 7)) % len(colors)]
                draw.rectangle([(cx, cy), (cx + cs, cy + cs)], fill=cc)
            # 文字（密集）
            for _ in range(3):
                tx = x + 30 + rng.randint(0, max(0, block_w - 380))
                ty = y + 200 + rng.randint(0, max(0, block_h - 280))
                txt = f"{rng.randint(100, 999)}.{rng.randint(100, 999)}"
                draw.text((tx, ty), txt, fill="#F1F5F9", font=tiny_font)

    # 连接线（模拟架构图箭头）
    for _ in range(200):
        x1 = rng.randint(300, width - 300)
        y1 = rng.randint(1000, height - 600)
        x2 = x1 + rng.randint(-400, 400)
        y2 = y1 + rng.randint(-300, 300)
        if 200 < x2 < width - 200 and 800 < y2 < height - 200:
            draw.line([(x1, y1), (x2, y2)], fill="#475569", width=3)

    # 顶部色带
    for i in range(120):
        c = (
            int(79 - 50 * i / 120),
            int(70 - 30 * i / 120),
            int(229 - 50 * i / 120),
        )
        draw.rectangle([(0, i), (width, i + 1)], fill=c)

    # 底部色带
    for i in range(120):
        c = (
            int(34 - 20 * i / 120),
            int(211 - 100 * i / 120),
            int(238 - 80 * i / 120),
        )
        draw.rectangle([(0, height - 120 + i), (width, height - 120 + i + 1)], fill=c)

    # 占位水印
    draw.text(
        (200, height - 250),
        "seeing-llm P0 · placeholder diagram · real image in P1/P3",
        fill="#94A3B8",
        font=sub_font,
    )

    img.save(out_path, format="PNG", optimize=False, compress_level=1)
    return img.size, out_path.stat().st_size


def main():
    items = [
        ("k3_overall.png", "Kimi K3 整体架构", "23 × (3 KDA + 1 Gated MLA) + 1 dense · 2.8T / 104B"),
        ("v4_overall.png", "DeepSeek V4.1 Flash", "CED · 20 encoder + 20 decoder · 552B"),
        ("qwen_overall.png", "Qwen3.8-2.4T-A95B", "23 × (3 Gated DeltaNet + 1 Gated Attention)"),
        ("k3_kda.png", "KDA 线性注意力细节", "delta rule + L2-norm + gated state"),
        ("v4_ced.png", "CED 因果编码器-解码器", "encoder hidden → decoder KV projection"),
    ]
    results = []
    for fname, title, sub in items:
        out = RAW / fname
        if out.exists() and out.stat().st_size > 1_000_000:
            print(f"[skip] {fname} already exists ({out.stat().st_size:,} B)")
            sz = Image.open(out).size
        else:
            print(f"[make] {fname} ...", end=" ", flush=True)
            sz, n = make_busy_image(out, title, sub)
            print(f"done {sz[0]}x{sz[1]} {n/1024/1024:.2f} MB")
        results.append({"id": fname, "path": str(out.relative_to(ROOT)), "size": sz, "bytes": out.stat().st_size})

    (RAW / "_metadata.json").write_text(
        json.dumps({
            "note": "P0 占位图。真实原图在 P1/P3 阶段替换。",
            "items": results,
        }, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    total = sum(r["bytes"] for r in results)
    print(f"\n[total] {len(results)} imgs, {total/1024/1024:.2f} MB raw")


if __name__ == "__main__":
    main()