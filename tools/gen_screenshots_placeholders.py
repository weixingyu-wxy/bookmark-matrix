"""生成截图占位图 (1280x800)
实际使用需要替换为真实运行截图
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = r"D:\AI_Agents\workspace\projects\edge-bookmark-matrix\store\screenshots"
os.makedirs(OUT, exist_ok=True)

CYAN = (6, 182, 212)
PURPLE = (124, 58, 237)
DARK_BG = (10, 10, 15)
DARK_ELEV = (21, 21, 27)
DARK_BORDER = (42, 42, 51)
TEXT_LIGHT = (244, 244, 246)
TEXT_DIM = (161, 161, 170)
TEXT_FAINT = (113, 113, 122)

CATEGORIES = [
    ('AI', '🤖', '#A78BFA', 12),
    ('Dev', '💻', '#60A5FA', 18),
    ('Learning', '📚', '#34D399', 8),
    ('Video', '🎬', '#F87171', 6),
    ('Music', '🎵', '#F472B6', 4),
    ('Shopping', '🛒', '#FB923C', 3),
    ('Social', '💬', '#38BDF8', 5),
    ('News', '📰', '#94A3B8', 7),
    ('Cloud', '☁️', '#22D3EE', 2),
]


def font(size):
    try:
        return ImageFont.truetype("C:/Windows/Fonts/msyh.ttc", size)
    except Exception:
        return ImageFont.load_default()


def make_bg(w=1280, h=800):
    img = Image.new('RGBA', (w, h), DARK_BG)
    return img


def draw_toolbar(draw, w, h, title="Bookmark Matrix"):
    """顶部工具栏"""
    bar_h = 56
    # 背景
    draw.rectangle([0, 0, w, bar_h], fill=DARK_ELEV)
    # 底边
    draw.line([(0, bar_h), (w, bar_h)], fill=DARK_BORDER, width=1)
    # logo
    draw.rounded_rectangle([14, 14, 42, 42], radius=6, fill=CYAN)
    # 标题
    draw.text((54, 18), title, fill=TEXT_LIGHT, font=font(15))
    # 搜索框
    sx = 220
    draw.rounded_rectangle([sx, 14, sx + 540, 42], radius=6, fill=DARK_BG, outline=DARK_BORDER)
    draw.text((sx + 12, 22), "🔍", fill=TEXT_FAINT, font=font(11))
    draw.text((sx + 32, 22), "Search bookmarks…", fill=TEXT_FAINT, font=font(11))
    # 右侧按钮
    for i, label in enumerate(['🌓', '⛶', '📊', '🩺', '⏰', '↕', '🎨', '↻']):
        x = w - 30 - i * 32
        draw.text((x, 18), label, fill=TEXT_DIM, font=font(13))
    return bar_h


def draw_sidebar(draw, x, y, w, h):
    """左侧侧边栏"""
    draw.rectangle([x, y, x + w, y + h], fill=DARK_ELEV)
    # 全部
    draw.rounded_rectangle([x + 8, y + 12, x + w - 8, y + 40], radius=6, fill=DARK_BORDER)
    draw.text((x + 16, y + 18), "▦", fill=TEXT_LIGHT, font=font(13))
    draw.text((x + 36, y + 20), "All", fill=TEXT_LIGHT, font=font(12))
    draw.text((x + w - 30, y + 20), "78", fill=TEXT_DIM, font=font(11))
    # 收藏
    draw.rounded_rectangle([x + 8, y + 48, x + w - 8, y + 76], radius=6, fill=DARK_BG)
    draw.text((x + 16, y + 54), "★", fill=TEXT_LIGHT, font=font(13))
    draw.text((x + 36, y + 56), "Starred", fill=TEXT_LIGHT, font=font(12))
    draw.text((x + w - 30, y + 56), "5", fill=TEXT_DIM, font=font(11))
    # 标题
    draw.text((x + 10, y + 92), "CATEGORIES (DRAG TO SORT)", fill=TEXT_FAINT, font=font(9))
    # 分类列表
    cy = y + 116
    for cat, emoji, color, count in CATEGORIES:
        # 色点
        draw.ellipse([x + 18, cy + 8, x + 26, cy + 16], fill=color)
        draw.text((x + 36, cy + 5), f"{cat}", fill=TEXT_LIGHT, font=font(12))
        draw.text((x + w - 30, cy + 6), str(count), fill=TEXT_DIM, font=font(11))
        cy += 32


def draw_card(draw, x, y, w, h, color, title, host, has_star=False, has_note=False):
    """单张卡片"""
    draw.rounded_rectangle([x, y, x + w, y + h], radius=6, fill=DARK_ELEV)
    # 左边框
    draw.rectangle([x, y, x + 3, y + h], fill=color)
    # 边界
    draw.rectangle([x, y, x + w, y + h], outline=DARK_BORDER, width=1)
    # favicon 占位 (用 host 首字母 + hash 颜色)
    if title:
        # 简单 hash
        h = sum(ord(c) for c in host) % 360
        fc = f"hsl({h}, 60%, 55%)"
    else:
        fc = (90, 90, 90)
    draw.rounded_rectangle([x + 10, y + 10, x + 26, y + 26], radius=4, fill=fc)
    draw.text((x + 14, y + 13), title[0] if title else "?", fill=(255, 255, 255), font=font(11))
    # 标题
    draw.text((x + 32, y + 12), title, fill=TEXT_LIGHT, font=font(11))
    # star
    if has_star:
        draw.text((x + w - 12, y + 6), "★", fill=(245, 158, 11), font=font(11))
    # domain
    draw.text((x + 10, y + 36), host, fill=TEXT_FAINT, font=font(9))
    # note indicator
    if has_note:
        draw.text((x + w - 14, y + h - 14), "📝", fill=TEXT_FAINT, font=font(9))


def draw_grid(draw, x, y, w, h, items):
    """卡片矩阵"""
    cols = 5
    card_w = (w - (cols - 1) * 8) // cols
    card_h = 60
    for i, it in enumerate(items):
        c = i % cols
        r = i // cols
        cx = x + c * (card_w + 8)
        cy = y + r * (card_h + 8)
        if cy + card_h > y + h:
            break
        draw_card(draw, cx, cy, card_w, card_h, it['color'], it['title'], it['host'], it.get('star'), it.get('note'))


def draw_section_header(draw, x, y, name, color, emoji, count):
    """分类段头"""
    draw.rounded_rectangle([x, y, x + 28, y + 28], radius=7, fill=color)
    draw.text((x + 8, y + 4), emoji, fill=(255, 255, 255), font=font(14))
    draw.text((x + 36, y + 6), name, fill=TEXT_LIGHT, font=font(15))
    # 数量徽章
    draw.rounded_rectangle([x + 36 + len(name) * 18, y + 6, x + 36 + len(name) * 18 + 28, y + 24], radius=10, fill=color)
    draw.text((x + 36 + len(name) * 18 + 8, y + 7), str(count), fill=(255, 255, 255), font=font(11))


# ===== 01-classification.png — 分类视图主界面 =====
def gen_classification():
    img = make_bg()
    d = ImageDraw.Draw(img)
    bar_h = draw_toolbar(d, 1280, 800)
    # 状态条
    d.rectangle([0, bar_h, 1280, bar_h + 24], fill=DARK_ELEV)
    d.line([(0, bar_h + 24), (1280, bar_h + 24)], fill=DARK_BORDER, width=1)
    d.text((14, bar_h + 6), "Total 78 bookmarks", fill=TEXT_DIM, font=font(11))
    # 主体内容
    content_y = bar_h + 40
    # AI section
    draw_section_header(d, 14, content_y, "AI", '#A78BFA', '🤖', 12)
    items_ai = [
        {'color': '#A78BFA', 'title': 'ChatGPT', 'host': 'chatgpt.com', 'star': True},
        {'color': '#A78BFA', 'title': 'Claude AI', 'host': 'claude.ai'},
        {'color': '#A78BFA', 'title': 'DeepSeek', 'host': 'chat.deepseek.com'},
        {'color': '#A78BFA', 'title': '通义千问', 'host': 'tongyi.aliyun.com'},
        {'color': '#A78BFA', 'title': 'Kimi', 'host': 'kimi.moonshot.cn'},
    ]
    draw_grid(d, 14, content_y + 40, 1252, 150, items_ai)
    # Dev section
    draw_section_header(d, 14, content_y + 210, "Dev", '#60A5FA', '💻', 18)
    items_dev = [
        {'color': '#60A5FA', 'title': 'GitHub', 'host': 'github.com', 'star': True},
        {'color': '#60A5FA', 'title': 'Stack Overflow', 'host': 'stackoverflow.com'},
        {'color': '#60A5FA', 'title': 'MDN Web Docs', 'host': 'developer.mozilla.org', 'note': True},
        {'color': '#60A5FA', 'title': 'LeetCode', 'host': 'leetcode.cn'},
        {'color': '#60A5FA', 'title': 'CodePen', 'host': 'codepen.io'},
    ]
    draw_grid(d, 14, content_y + 250, 1252, 150, items_dev)
    img.save(os.path.join(OUT, "01-classification.png"), 'PNG')
    print(f"  [OK] 01-classification.png")


# ===== 02-fullscreen.png — 全屏矩阵页 =====
def gen_fullscreen():
    img = make_bg()
    d = ImageDraw.Draw(img)
    bar_h = draw_toolbar(d, 1280, 800)
    # 主体
    content_y = bar_h + 8
    # 左侧侧边栏
    draw_sidebar(d, 0, content_y, 220, 800 - content_y)
    # 主区
    main_x = 230
    # 分类矩阵
    cy = content_y + 16
    for cat, emoji, color, count in CATEGORIES:
        draw_section_header(d, main_x, cy, cat, color, emoji, count)
        items = [
            {'color': color, 'title': f'{cat} Site 1', 'host': f'example.com'},
            {'color': color, 'title': f'{cat} Site 2', 'host': f'test.com'},
            {'color': color, 'title': f'{cat} Site 3', 'host': f'demo.com'},
        ]
        draw_grid(d, main_x, cy + 40, 1040, 80, items)
        cy += 140
    img.save(os.path.join(OUT, "02-fullscreen.png"), 'PNG')
    print(f"  [OK] 02-fullscreen.png")


# ===== 03-search.png — 搜索过滤 =====
def gen_search():
    img = make_bg()
    d = ImageDraw.Draw(img)
    bar_h = draw_toolbar(d, 1280, 800)
    # 搜索框内容
    sx = 220
    d.rounded_rectangle([sx, 14, sx + 540, 42], radius=6, fill=DARK_BG, outline=CYAN)
    d.text((sx + 12, 22), "🔍", fill=TEXT_DIM, font=font(11))
    d.text((sx + 32, 22), "github", fill=TEXT_LIGHT, font=font(11))
    # 状态条
    d.rectangle([0, bar_h, 1280, bar_h + 24], fill=DARK_ELEV)
    d.line([(0, bar_h + 24), (1280, bar_h + 24)], fill=DARK_BORDER, width=1)
    d.text((14, bar_h + 6), "Total 78 bookmarks", fill=TEXT_DIM, font=font(11))
    d.text((1100, bar_h + 6), "Showing 8", fill=CYAN, font=font(11))
    # 标签 chip 行
    chip_y = bar_h + 32
    d.rectangle([0, chip_y, 1280, chip_y + 40], fill=DARK_ELEV)
    d.line([(0, chip_y + 40), (1280, chip_y + 40)], fill=DARK_BORDER, width=1)
    chip_x = 14
    for tag in ['#work', '#react', '#important', '#tutorial', '#opensource']:
        w = len(tag) * 7 + 20
        d.rounded_rectangle([chip_x, chip_y + 8, chip_x + w, chip_y + 30], radius=10, fill=DARK_BG, outline=DARK_BORDER)
        d.text((chip_x + 8, chip_y + 12), tag, fill=TEXT_DIM, font=font(10))
        chip_x += w + 8
    # 主体
    content_y = chip_y + 56
    draw_section_header(d, 14, content_y, "Dev", '#60A5FA', '💻', 8)
    items = [
        {'color': '#60A5FA', 'title': 'GitHub', 'host': 'github.com', 'star': True},
        {'color': '#60A5FA', 'title': 'GitHub Trending', 'host': 'github.com/trending'},
        {'color': '#60A5FA', 'title': 'GitHub Docs', 'host': 'docs.github.com'},
        {'color': '#60A5FA', 'title': 'GitHub Actions', 'host': 'github.com/features/actions'},
        {'color': '#60A5FA', 'title': 'GitHub Issues', 'host': 'github.com/issues'},
    ]
    draw_grid(d, 14, content_y + 40, 1252, 150, items)
    img.save(os.path.join(OUT, "03-search.png"), 'PNG')
    print(f"  [OK] 03-search.png")


# ===== 04-themes.png — 主题选择 =====
def gen_themes():
    img = make_bg()
    d = ImageDraw.Draw(img)
    bar_h = draw_toolbar(d, 1280, 800)
    # 模态
    mx, my = 290, 130
    mw, mh = 700, 540
    d.rounded_rectangle([mx, my, mx + mw, my + mh], radius=12, fill=DARK_ELEV, outline=DARK_BORDER)
    # 头
    d.rectangle([mx, my, mx + mw, my + 50], fill=DARK_ELEV)
    d.line([(mx, my + 50), (mx + mw, my + 50)], fill=DARK_BORDER, width=1)
    d.text((mx + 16, my + 16), "🎨 Themes", fill=TEXT_LIGHT, font=font(15))
    d.text((mx + mw - 30, my + 14), "✕", fill=TEXT_DIM, font=font(16))
    # 外观按钮
    btn_y = my + 70
    for i, (label, active) in enumerate([('🌙 Dark', True), ('☀️ Light', False), ('⚙ Auto', False)]):
        x = mx + 16 + i * 220
        if active:
            d.rounded_rectangle([x, btn_y, x + 200, btn_y + 36], radius=6, fill=CYAN)
            d.text((x + 70, btn_y + 9), label, fill=(255, 255, 255), font=font(12))
        else:
            d.rounded_rectangle([x, btn_y, x + 200, btn_y + 36], radius=6, fill=DARK_BG, outline=DARK_BORDER)
            d.text((x + 70, btn_y + 9), label, fill=TEXT_DIM, font=font(12))
    # 主题卡片
    themes = [
        ('Midnight', '🌌', '#0A0A0F', '#FAFAFA', True),
        ('Minimal', '◻️', '#000000', '#FFFFFF', False),
        ('Cyber', '⚡', '#0B0F1A', '#22D3EE', False),
        ('Warm', '🍂', '#1A1410', '#FEF3E2', False),
    ]
    tx = mx + 16
    ty = my + 140
    for i, (name, emoji, dark, light, active) in enumerate(themes):
        col = i % 2
        row = i // 2
        x = tx + col * 340
        y = ty + row * 180
        if active:
            d.rounded_rectangle([x, y, x + 320, y + 160], radius=8, fill=DARK_BG, outline=CYAN, width=2)
        else:
            d.rounded_rectangle([x, y, x + 320, y + 160], radius=8, fill=DARK_BG, outline=DARK_BORDER)
        # swatch
        d.rounded_rectangle([x + 14, y + 14, x + 50, y + 50], radius=6, fill=dark)
        d.rounded_rectangle([x + 50, y + 14, x + 86, y + 50], radius=6, fill=light, outline=DARK_BORDER)
        # 文字
        d.text((x + 100, y + 18), f"{emoji} {name}", fill=TEXT_LIGHT, font=font(14))
        desc = {
            'Midnight': 'Default · warm dark, indigo',
            'Minimal': 'Pure black/white/gray',
            'Cyber': 'Neon on dark, cyan/magenta',
            'Warm': 'Cozy orange/amber',
        }
        d.text((x + 100, y + 38), desc[name], fill=TEXT_FAINT, font=font(11))
    img.save(os.path.join(OUT, "04-themes.png"), 'PNG')
    print(f"  [OK] 04-themes.png")


# ===== 05-board.png — 看板视图 =====
def gen_board():
    img = make_bg()
    d = ImageDraw.Draw(img)
    bar_h = draw_toolbar(d, 1280, 800)
    # 看板列
    status_cols = [
        ('Inbox', '📥', '#64748B', 4),
        ('Reading', '📖', '#06B6D4', 3),
        ('To-Do', '✅', '#10B981', 5),
        ('Done', '✨', '#8B5CF6', 2),
        ('Archive', '🗄️', '#475569', 1),
    ]
    col_w = 240
    gap = 12
    start_x = 14
    cy = bar_h + 24
    for i, (name, emoji, color, count) in enumerate(status_cols):
        x = start_x + i * (col_w + gap)
        # 列头
        d.rounded_rectangle([x, cy, x + col_w, cy + 720], radius=8, fill=DARK_ELEV, outline=DARK_BORDER)
        d.rectangle([x, cy, x + col_w, cy + 4], fill=color)
        # 标题
        d.text((x + 12, cy + 14), emoji, fill=(255, 255, 255), font=font(14))
        d.text((x + 36, cy + 18), name, fill=TEXT_LIGHT, font=font(14))
        d.rounded_rectangle([x + col_w - 36, cy + 14, x + col_w - 10, cy + 32], radius=10, fill=DARK_BG)
        d.text((x + col_w - 28, cy + 16), str(count), fill=TEXT_DIM, font=font(11))
        # 卡片
        for j in range(count):
            card_y = cy + 50 + j * 70
            # 卡片
            h = sum(ord(c) for c in name + str(j)) % 360
            card_color = f"hsl({h}, 60%, 55%)"
            d.rounded_rectangle([x + 8, card_y, x + col_w - 8, card_y + 60], radius=6, fill=DARK_BG, outline=DARK_BORDER)
            d.rectangle([x + 8, card_y, x + 11, card_y + 60], fill=card_color)
            d.text((x + 18, card_y + 8), f"{name} Card {j+1}", fill=TEXT_LIGHT, font=font(11))
            d.text((x + 18, card_y + 28), f"example-{j}.com", fill=TEXT_FAINT, font=font(9))
    img.save(os.path.join(OUT, "05-board.png"), 'PNG')
    print(f"  [OK] 05-board.png")


# ===== 06-stats.png — 统计图表 =====
def gen_stats():
    img = make_bg()
    d = ImageDraw.Draw(img)
    bar_h = draw_toolbar(d, 1280, 800)
    # 状态
    d.rectangle([0, bar_h, 1280, bar_h + 24], fill=DARK_ELEV)
    d.line([(0, bar_h + 24), (1280, bar_h + 24)], fill=DARK_BORDER, width=1)
    d.text((14, bar_h + 6), "Total 78 bookmarks", fill=TEXT_DIM, font=font(11))
    # 模态
    mx, my = 80, 100
    mw, mh = 1120, 600
    d.rounded_rectangle([mx, my, mx + mw, my + mh], radius=12, fill=DARK_ELEV, outline=DARK_BORDER)
    d.line([(mx, my + 50), (mx + mw, my + 50)], fill=DARK_BORDER, width=1)
    d.text((mx + 16, my + 16), "📊 Statistics", fill=TEXT_LIGHT, font=font(15))
    # 分类条形图
    d.text((mx + 16, my + 70), "Category Distribution", fill=TEXT_LIGHT, font=font(13))
    by_max = 18
    bar_x = mx + 16
    bar_y = my + 100
    bar_max_w = 700
    for i, (cat, emoji, color, count) in enumerate(CATEGORIES):
        y = bar_y + i * 36
        d.text((bar_x, y + 4), f"{emoji} {cat}", fill=TEXT_LIGHT, font=font(11))
        w = int(count / by_max * bar_max_w)
        d.rounded_rectangle([bar_x + 110, y + 2, bar_x + 110 + w, y + 22], radius=3, fill=color)
        d.text((bar_x + 110 + w + 6, y + 4), str(count), fill=TEXT_LIGHT, font=font(11))
    # 圆环图
    d.text((mx + 850, my + 70), "Proportion", fill=TEXT_LIGHT, font=font(13))
    cx, cy, r_out, r_in = mx + 950, my + 220, 100, 60
    # 简单画一个圆环
    import math
    total = sum(c[3] for c in CATEGORIES)
    start_angle = -90
    for cat, emoji, color, count in CATEGORIES:
        sweep = count / total * 360
        end_angle = start_angle + sweep
        # 画扇形 (简化为弧)
        d.pieslice([cx - r_out, cy - r_out, cx + r_out, cy + r_out], start_angle, end_angle, fill=color)
        start_angle = end_angle
    d.ellipse([cx - r_in, cy - r_in, cx + r_in, cy + r_in], fill=DARK_ELEV)
    d.text((cx - 18, cy - 8), str(total), fill=TEXT_LIGHT, font=font(20))
    d.text((cx - 12, cy + 12), "Total", fill=TEXT_DIM, font=font(10))
    # 时间线
    d.text((mx + 16, my + 430), "Timeline (Last 12 months)", fill=TEXT_LIGHT, font=font(13))
    tl_y = my + 460
    months = [3, 5, 2, 8, 12, 6, 4, 7, 5, 9, 11, 7]
    max_m = max(months)
    for i, m in enumerate(months):
        x = mx + 20 + i * 90
        h = int(m / max_m * 80)
        d.rectangle([x, tl_y + 80 - h, x + 60, tl_y + 80], fill=CYAN, width=0)
    img.save(os.path.join(OUT, "06-stats.png"), 'PNG')
    print(f"  [OK] 06-stats.png")


gen_classification()
gen_fullscreen()
gen_search()
gen_themes()
gen_board()
gen_stats()

print("\n[DONE] All screenshot placeholders generated")
print("Note: Replace with real running screenshots before submitting to store.")
