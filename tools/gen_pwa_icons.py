"""生成 PWA 图标 192 / 512
"""
from PIL import Image, ImageDraw
import os

CYAN = (6, 182, 212)
PURPLE = (124, 58, 237)
WHITE = (255, 255, 255)

OUT = r"D:\AI_Agents\workspace\projects\edge-bookmark-matrix\standalone"
os.makedirs(OUT, exist_ok=True)


def gradient_bg(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size)
            r = int(CYAN[0] * (1 - t) + PURPLE[0] * t)
            g = int(CYAN[1] * (1 - t) + PURPLE[1] * t)
            b = int(CYAN[2] * (1 - t) + PURPLE[2] * t)
            draw.point((x, y), fill=(r, g, b, 255))
    return img


def matrix_dots(img, size, grid=3, padding=0.22, dot_ratio=0.46):
    draw = ImageDraw.Draw(img)
    pad = int(size * padding)
    cell = (size - 2 * pad) / grid
    dot_r = cell * dot_ratio / 2
    for r in range(grid):
        for c in range(grid):
            cx = pad + cell * (c + 0.5)
            cy = pad + cell * (r + 0.5)
            x0 = int(cx - dot_r); y0 = int(cy - dot_r)
            x1 = int(cx + dot_r); y1 = int(cy + dot_r)
            draw.ellipse([x0, y0, x1, y1], fill=WHITE)
    # 中心高亮
    cx = int(size * 0.22 + cell * 1.5)
    cy = int(size * 0.22 + cell * 1.5)
    r = int(cell * 0.32)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE)


for size in (192, 512):
    img = gradient_bg(size)
    matrix_dots(img, size)
    img.save(os.path.join(OUT, f"icon-{size}.png"), 'PNG')
    print(f"  [OK] icon-{size}.png  ({size}x{size})")

print("[DONE] PWA icons generated")
