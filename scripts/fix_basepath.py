# -*- coding: utf-8 -*-
"""
一次性修复：去掉 next/link 里手写的 basePath 前缀。

背景：next.config.js 配了 basePath='/seeing-llm' 后，next/link 会自动加前缀。
代码里若再手写 `${base}/xxx`，会被叠加成 /seeing-llm/seeing-llm/xxx → 404。
原生 <a> 不会自动加前缀，因此 SiteFooter 里的 ${base} 必须保留。

用法：python scripts/fix_basepath.py
"""
import re
import pathlib

FILES = [
    'src/app/about/page.tsx',
    'src/app/architecture/page.tsx',
    'src/app/ops/page.tsx',
    'src/app/plan/page.tsx',
    'src/app/training/page.tsx',
    'src/components/PlaceholderPage.tsx',
    'src/components/SiteHeader.tsx',
    'src/app/page.tsx',
]

BQ = chr(96)  # 反引号，避免 shell 转义问题

pat_link = re.compile(r'href=\{' + BQ + r'\$\{base\}([^' + BQ + r']*)' + BQ + r'\}')
pat_obj = re.compile(r'href: ' + BQ + r'\$\{base\}([^' + BQ + r']*)' + BQ)

root = pathlib.Path(__file__).resolve().parent.parent
for f in FILES:
    p = root / f
    if not p.exists():
        print('SKIP (missing)', f)
        continue
    s = p.read_text(encoding='utf-8')
    orig = s
    s = pat_link.sub(lambda m: 'href="%s"' % m.group(1), s)
    s = pat_obj.sub(lambda m: "href: '%s'" % m.group(1), s)
    if s != orig:
        p.write_text(s, encoding='utf-8')
        print('updated', f)
    else:
        print('no change', f)
