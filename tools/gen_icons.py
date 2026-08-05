"""生成 Bookmark Matrix 扩展图标
扁平 + 矩阵点 + 渐变背景
"""
from PIL import Image, ImageDraw
import os

# 颜色
CYAN = (6, 182, 212)       # #06B6D4
PURPLE = (124, 58, 237)    # #7C3AED
WHITE = (255, 255, 255)
LIGHT = (241, 245, 249)    # #F1F5F9
SLATE = (15, 23, 42)       # #0F172A

OUTPUT_DIR = r"D:\AI_Agents\workspace\projects\edge-bookmark-matrix\src\icons"
os.makedirs(OUTPUT_DIR, exist_ok=True)


def gradient_bg(size, c1, c2):
    """生成对角渐变背景"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    for y in range(size):
        for x in range(size):
            # 对角渐变
            t = (x + y) / (2 * size)
            r = int(c1[0] * (1 - t) + c2[0] * t)
            g = int(c1[1] * (1 - t) + c2[1] * t)
            b = int(c1[2] * (1 - t) + c2[2] * t)
            draw.point((x, y), fill=(r, g, b, 255))
    return img


def draw_matrix_dots(img, size, color, grid=3, padding=0.18, dot_ratio=0.42):
    """画 3x3 矩阵点 (扁平风格)"""
    draw = ImageDraw.Draw(img)
    pad = int(size * padding)
    cell = (size - 2 * pad) / grid
    dot_r = cell * dot_ratio / 2
    for r in range(grid):
        for c in range(grid):
            cx = pad + cell * (c + 0.5)
            cy = pad + cell * (r + 0.5)
            # 中心点
            x0 = int(cx - dot_r); y0 = int(cy - dot_r)
            x1 = int(cx + dot_r); y1 = int(cy + dot_r)
            draw.ellipse([x0, y0, x1, y1], fill=color)


def gen_icon(size, mode='dark'):
    """生成单个尺寸图标"""
    img = gradient_bg(size, CYAN, PURPLE)

    if size >= 48:
        # 大尺寸：矩阵点
        draw_matrix_dots(img, size, WHITE, grid=3, padding=0.22, dot_ratio=0.46)
        # 中心点高亮（强调）
        draw = ImageDraw.Draw(img)
        cell = (size - 2 * int(size * 0.22)) / 3
        cx = int(size * 0.22 + cell * 1.5)
        cy = int(size * 0.22 + cell * 1.5)
        r = int(cell * 0.32)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE)
    else:
        # 小尺寸 (16x16): 简化
        draw = ImageDraw.Draw(img)
        # 中心一个大点
        margin = int(size * 0.22)
        # 4 个角点
        for (dx, dy) in [(0, 0), (1, 0), (0, 1), (1, 1)]:
            x = margin + dx * (size - 2 * margin) / 1
            y = margin + dy * (size - 2 * margin) / 1
            r = size * 0.13
            draw.ellipse([x - r, y - r, x + r, y + r], fill=WHITE)

    img.save(os.path.join(OUTPUT_DIR, f"icon{size}.png"), 'PNG')
    print(f"  [OK] icon{size}.png  ({size}x{size})")


def main():
    print(f"Output: {OUTPUT_DIR}")
    for s in (16, 48, 128):
        gen_icon(s)
    print("[DONE] All icons generated")


if __name__ == "__main__":
    main()
