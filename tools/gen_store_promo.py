"""生成 Edge 商店宣传图
- StoreIcon-44x44.png
- MediumIcon-300x300.png
- SmallPromo-50x50.png
- LargePromo-1400x560.png
"""
from PIL import Image, ImageDraw, ImageFont
import os

# 颜色
CYAN = (6, 182, 212)
PURPLE = (124, 58, 237)
WHITE = (255, 255, 255)
DARK = (10, 10, 15)
TEXT_LIGHT = (244, 244, 246)
TEXT_DIM = (161, 161, 170)

OUT = r"D:\AI_Agents\workspace\projects\edge-bookmark-matrix\store\promo"
os.makedirs(OUT, exist_ok=True)


def gradient_bg(size):
    """对角渐变"""
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


def render_logo(img, size, grid=3, padding=0.22, dot_ratio=0.42):
    """画 3x3 矩阵 + 中心高亮"""
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
    r = int(cell * 0.35)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE)


# ===== StoreIcon 44x44 =====
img = gradient_bg(44)
# 简化: 一个大圆点 (44 太小放不下 9 个点)
draw = ImageDraw.Draw(img)
cx, cy = 22, 22
r = 14
draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE)
# 中心蓝紫点
inner_r = 6
draw.ellipse([cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r], fill=(99, 102, 241))
img.save(os.path.join(OUT, "StoreIcon-44x44.png"), 'PNG')
print(f"  [OK] StoreIcon-44x44.png")

# ===== MediumIcon 300x300 =====
img = gradient_bg(300)
render_logo(img, 300, grid=3, padding=0.22, dot_ratio=0.46)
img.save(os.path.join(OUT, "MediumIcon-300x300.png"), 'PNG')
print(f"  [OK] MediumIcon-300x300.png")

# ===== SmallPromo 50x50 =====
img = gradient_bg(50)
draw = ImageDraw.Draw(img)
cx, cy = 25, 25
r = 16
draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE)
img.save(os.path.join(OUT, "SmallPromo-50x50.png"), 'PNG')
print(f"  [OK] SmallPromo-50x50.png")

# ===== LargePromo 1400x560 =====
W, H = 1400, 560
img = Image.new('RGBA', (W, H), DARK)
draw = ImageDraw.Draw(img)
# 左侧 logo 大块
logo_size = 320
logo_x = 80
logo_y = (H - logo_size) // 2
# 渐变 logo
for y in range(logo_size):
    for x in range(logo_size):
        t = (x + y) / (2 * logo_size)
        r = int(CYAN[0] * (1 - t) + PURPLE[0] * t)
        g = int(CYAN[1] * (1 - t) + PURPLE[1] * t)
        b = int(CYAN[2] * (1 - t) + PURPLE[2] * t)
        draw.point((logo_x + x, logo_y + y), fill=(r, g, b, 255))
# logo 上的矩阵点
draw2 = ImageDraw.Draw(img)
grid = 3
pad = int(logo_size * 0.22)
cell = (logo_size - 2 * pad) / grid
dot_r = cell * 0.46 / 2
for r in range(grid):
    for c in range(grid):
        cx = logo_x + pad + cell * (c + 0.5)
        cy = logo_y + pad + cell * (r + 0.5)
        x0 = int(cx - dot_r); y0 = int(cy - dot_r)
        x1 = int(cx + dot_r); y1 = int(cy + dot_r)
        draw2.ellipse([x0, y0, x1, y1], fill=WHITE)

# 右侧文字
text_x = logo_x + logo_size + 60
try:
    font_title = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 64)
    font_sub_cn = ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", 26)
    font_sub_en = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 22)
except Exception:
    font_title = ImageFont.load_default()
    font_sub_cn = ImageFont.load_default()
    font_sub_en = ImageFont.load_default()

# 标题
draw2.text((text_x, 140), "Bookmark Matrix", fill=TEXT_LIGHT, font=font_title)
# 中文副标题
draw2.text((text_x, 230), "智能书签管理器", fill=TEXT_LIGHT, font=font_sub_cn)
# 中文小描述
draw2.text((text_x, 280), "18 分类 · 标签 · 看板 · 4 主题 · 100% 离线", fill=TEXT_DIM, font=font_sub_cn)
# 英文小描述
draw2.text((text_x, 330), "Smart Bookmark Manager · 18 categories · Tags · Kanban · Offline", fill=TEXT_DIM, font=font_sub_en)
# 作者
draw2.text((text_x, 410), "Xingyu Wei", fill=TEXT_DIM, font=font_sub_en)

img.save(os.path.join(OUT, "LargePromo-1400x560.png"), 'PNG')
print(f"  [OK] LargePromo-1400x560.png")

print("\n[DONE] All promo images generated")
