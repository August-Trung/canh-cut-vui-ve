import os
import math
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

def create_canvas(size=256):
    return Image.new('RGBA', (size, size), (0, 0, 0, 0))

def draw_radial_gradient(img, center, radius, inner_color, outer_color):
    """Draw smooth radial gradient onto an RGBA image."""
    cx, cy = center
    w, h = img.size
    y, x = np.ogrid[:h, :w]
    dist = np.sqrt((x - cx)**2 + (y - cy)**2)
    t = np.clip(dist / radius, 0, 1)
    
    # Interpolate RGBA
    arr = np.zeros((h, w, 4), dtype=np.uint8)
    for c in range(4):
        arr[:, :, c] = (inner_color[c] * (1 - t) + outer_color[c] * t).astype(np.uint8)
    
    grad = Image.fromarray(arr, 'RGBA')
    img.alpha_composite(grad)

def save_icon(img, output_path, target_size=128):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    # Zero out faint blur halos (alpha < 6) to ensure 100% transparent backgrounds
    arr = np.array(img)
    arr[arr[:, :, 3] < 6, 3] = 0
    cleaned = Image.fromarray(arr, 'RGBA')
    # Resize with high quality Lanczos downsampling
    resized = cleaned.resize((target_size, target_size), Image.Resampling.LANCZOS)
    arr_res = np.array(resized)
    arr_res[arr_res[:, :, 3] < 4, 3] = 0
    final_img = Image.fromarray(arr_res, 'RGBA')
    final_img.save(output_path, 'PNG')
    print(f"Saved: {output_path}")

# ==========================================
# STATUS & UI ICONS
# ==========================================

def render_star():
    size = 256
    img = create_canvas(size)
    cx, cy = 128, 128
    
    # Outer glow
    glow = create_canvas(size)
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([45, 45, 211, 211], fill=(255, 215, 0, 80))
    glow = glow.filter(ImageFilter.GaussianBlur(10))
    img.alpha_composite(glow)

    # 5-pointed star points
    points = []
    r_outer = 82
    r_inner = 38
    for i in range(10):
        r = r_outer if i % 2 == 0 else r_inner
        angle = -math.pi / 2 + i * (math.pi / 5)
        points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    
    draw = ImageDraw.Draw(img)
    # Drop shadow
    shadow_points = [(x + 2, y + 6) for x, y in points]
    draw.polygon(shadow_points, fill=(160, 100, 10, 160))
    
    # Star base
    draw.polygon(points, fill=(255, 204, 0, 255), outline=(218, 140, 0, 255), width=4)
    
    # Star facets (2.5D bevel effect)
    for i in range(5):
        p_out = points[i * 2]
        p_in1 = points[(i * 2 + 9) % 10]
        p_in2 = points[(i * 2 + 1) % 10]
        # Light facet
        draw.polygon([(cx, cy), p_out, p_in1], fill=(255, 235, 120, 220))
        # Dark facet
        draw.polygon([(cx, cy), p_out, p_in2], fill=(240, 175, 10, 220))

    # Specular shine
    shine = create_canvas(size)
    sdraw = ImageDraw.Draw(shine)
    sdraw.ellipse([cx - 18, cy - 40, cx + 4, cy - 22], fill=(255, 255, 255, 220))
    sdraw.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=(255, 255, 255, 150))
    shine = shine.filter(ImageFilter.GaussianBlur(2))
    img.alpha_composite(shine)
    return img

def render_crown():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    
    # Crown body points
    # Base: (50, 190) to (206, 190)
    # Peaks: Left (50, 100), Center (128, 65), Right (206, 100)
    # Valleys: (90, 140), (166, 140)
    crown_pts = [
        (45, 185),
        (45, 105),
        (88, 145),
        (128, 65),
        (168, 145),
        (211, 105),
        (211, 185)
    ]
    # Shadow
    shadow_pts = [(x + 2, y + 6) for x, y in crown_pts]
    draw.polygon(shadow_pts, fill=(120, 70, 0, 140))
    # Base gold
    draw.polygon(crown_pts, fill=(255, 195, 20, 255), outline=(190, 120, 0, 255), width=5)
    
    # Front rim band
    draw.rounded_rectangle([40, 175, 216, 205], radius=8, fill=(220, 140, 10, 255), outline=(160, 90, 0, 255), width=3)
    draw.rounded_rectangle([46, 178, 210, 192], radius=4, fill=(255, 225, 80, 255))
    
    # Jewels on crown peaks
    jewels = [
        (45, 105, (60, 180, 255)),   # Sapphire left
        (128, 65, (255, 50, 80)),    # Ruby center
        (211, 105, (60, 180, 255))   # Sapphire right
    ]
    for jx, jy, color in jewels:
        draw.ellipse([jx - 14, jy - 14, jx + 14, jy + 14], fill=(255, 215, 0, 255), outline=(170, 110, 0, 255), width=2)
        draw.ellipse([jx - 10, jy - 10, jx + 10, jy + 10], fill=color, outline=(255, 255, 255, 200), width=1)
        draw.ellipse([jx - 5, jy - 6, jx, jy - 2], fill=(255, 255, 255, 240))
        
    # Band gems
    band_gems = [(75, 188), (128, 188), (181, 188)]
    for gx, gy in band_gems:
        draw.ellipse([gx - 7, gy - 7, gx + 7, gy + 7], fill=(255, 50, 80, 255), outline=(255, 255, 255, 180), width=1)
        
    return img

def render_close():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    # Circle button base
    draw.ellipse([34, 38, 222, 226], fill=(130, 25, 30, 140)) # shadow
    draw.ellipse([32, 32, 224, 224], fill=(235, 65, 75, 255), outline=(180, 30, 45, 255), width=6)
    # Gradient highlight crescent
    draw.ellipse([42, 40, 214, 130], fill=(255, 120, 130, 180))
    # Crisp white X
    line_w = 20
    draw.line([(85, 85), (171, 171)], fill=(255, 255, 255, 255), width=line_w)
    draw.line([(85, 171), (171, 85)], fill=(255, 255, 255, 255), width=line_w)
    # Rounded line caps
    for pt in [(85, 85), (171, 171), (85, 171), (171, 85)]:
        draw.ellipse([pt[0] - line_w // 2, pt[1] - line_w // 2, pt[0] + line_w // 2, pt[1] + line_w // 2], fill=(255, 255, 255, 255))
    return img

def render_check():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    # Circle button base
    draw.ellipse([34, 38, 222, 226], fill=(15, 90, 40, 140)) # shadow
    draw.ellipse([32, 32, 224, 224], fill=(46, 184, 92, 255), outline=(28, 128, 62, 255), width=6)
    # Highlight
    draw.ellipse([42, 40, 214, 130], fill=(110, 225, 145, 180))
    # Crisp white checkmark
    # (75, 130) -> (115, 170) -> (185, 90)
    line_w = 22
    draw.line([(75, 132), (115, 172)], fill=(255, 255, 255, 255), width=line_w)
    draw.line([(115, 172), (185, 90)], fill=(255, 255, 255, 255), width=line_w)
    for pt in [(75, 132), (115, 172), (185, 90)]:
        draw.ellipse([pt[0] - line_w // 2, pt[1] - line_w // 2, pt[0] + line_w // 2, pt[1] + line_w // 2], fill=(255, 255, 255, 255))
    return img

def render_lock():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    
    # Silver shackle
    draw.arc([75, 40, 181, 146], start=180, end=0, fill=(210, 220, 230, 255), width=24)
    draw.line([(75 + 12, 93), (75 + 12, 130)], fill=(180, 190, 200, 255), width=24)
    draw.line([(181 - 12, 93), (181 - 12, 130)], fill=(180, 190, 200, 255), width=24)
    
    # Body shadow
    draw.rounded_rectangle([52, 116, 204, 228], radius=24, fill=(120, 70, 0, 140))
    # Golden body
    draw.rounded_rectangle([50, 110, 206, 222], radius=24, fill=(250, 185, 25, 255), outline=(190, 125, 5, 255), width=5)
    # Highlight
    draw.rounded_rectangle([58, 118, 198, 155], radius=16, fill=(255, 225, 90, 200))
    
    # Keyhole
    draw.ellipse([114, 145, 142, 173], fill=(70, 40, 10, 255))
    draw.polygon([(122, 165), (134, 165), (138, 195), (118, 195)], fill=(70, 40, 10, 255))
    return img

def render_gift():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    
    # Box shadow
    draw.rounded_rectangle([48, 98, 208, 224], radius=12, fill=(80, 20, 30, 130))
    # Red box body
    draw.rounded_rectangle([50, 100, 206, 220], radius=12, fill=(225, 45, 60, 255), outline=(160, 25, 35, 255), width=5)
    # Lid
    draw.rounded_rectangle([42, 85, 214, 120], radius=8, fill=(245, 65, 80, 255), outline=(160, 25, 35, 255), width=4)
    
    # Golden Ribbon vertical
    draw.rectangle([112, 85, 144, 220], fill=(255, 210, 30, 255), outline=(190, 140, 0, 255), width=2)
    # Golden Ribbon horizontal
    draw.rectangle([50, 145, 206, 175], fill=(255, 210, 30, 255), outline=(190, 140, 0, 255), width=2)
    
    # Bow left & right
    draw.ellipse([70, 50, 126, 90], fill=(255, 215, 30, 255), outline=(190, 140, 0, 255), width=3)
    draw.ellipse([130, 50, 186, 90], fill=(255, 215, 30, 255), outline=(190, 140, 0, 255), width=3)
    # Center knot
    draw.ellipse([115, 65, 141, 91], fill=(255, 235, 80, 255), outline=(190, 140, 0, 255), width=3)
    return img

def render_calendar():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    # Shadow
    draw.rounded_rectangle([46, 52, 210, 224], radius=20, fill=(40, 50, 70, 130))
    # White page body
    draw.rounded_rectangle([44, 48, 212, 220], radius=20, fill=(248, 250, 252, 255), outline=(180, 195, 210, 255), width=5)
    # Red header
    draw.rounded_rectangle([44, 48, 212, 105], radius=20, fill=(235, 60, 70, 255), outline=(180, 35, 45, 255), width=4)
    draw.rectangle([44, 85, 212, 105], fill=(235, 60, 70, 255))
    
    # Binder rings
    for rx in [80, 128, 176]:
        draw.rounded_rectangle([rx - 6, 32, rx + 6, 62], radius=4, fill=(200, 210, 220, 255), outline=(140, 150, 160, 255), width=2)
        
    # Big date number "28" or star icon in calendar
    draw.ellipse([100, 130, 156, 186], fill=(255, 205, 30, 255), outline=(210, 145, 10, 255), width=3)
    draw.polygon([(128, 140), (133, 152), (145, 152), (135, 160), (139, 172), (128, 164), (117, 172), (121, 160), (111, 152), (123, 152)], fill=(255, 255, 255, 255))
    return img

def render_target():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    cx, cy = 128, 128
    
    # Outer shadow
    draw.ellipse([34, 38, 222, 226], fill=(50, 20, 20, 130))
    # Ring 1: Red outer
    draw.ellipse([32, 32, 224, 224], fill=(235, 55, 65, 255), outline=(180, 30, 40, 255), width=4)
    # Ring 2: White
    draw.ellipse([64, 64, 192, 192], fill=(250, 250, 252, 255), outline=(200, 205, 215, 255), width=3)
    # Ring 3: Red
    draw.ellipse([96, 96, 160, 160], fill=(235, 55, 65, 255), outline=(180, 30, 40, 255), width=3)
    # Center: Golden Bullseye
    draw.ellipse([116, 116, 140, 140], fill=(255, 215, 20, 255), outline=(200, 150, 0, 255), width=2)
    return img

def render_snowflake():
    size = 256
    img = create_canvas(size)
    cx, cy = 128, 128
    
    # Cyan glow
    glow = create_canvas(size)
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([48, 48, 208, 208], fill=(120, 220, 255, 100))
    glow = glow.filter(ImageFilter.GaussianBlur(10))
    img.alpha_composite(glow)
    
    draw = ImageDraw.Draw(img)
    # 6 branches
    line_w = 10
    branch_len = 68
    for i in range(6):
        ang = i * (math.pi / 3)
        ex = cx + branch_len * math.cos(ang)
        ey = cy + branch_len * math.sin(ang)
        # Main arm
        draw.line([(cx, cy), (ex, ey)], fill=(240, 250, 255, 255), width=line_w)
        # Sub-prongs
        p1 = 0.55 * branch_len
        p1x, p1y = cx + p1 * math.cos(ang), cy + p1 * math.sin(ang)
        for side in [-1, 1]:
            sang = ang + side * (math.pi / 4)
            px = p1x + 20 * math.cos(sang)
            py = p1y + 20 * math.sin(sang)
            draw.line([(p1x, p1y), (px, py)], fill=(200, 240, 255, 255), width=line_w - 2)
            
    # Center crystal
    draw.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=(255, 255, 255, 255), outline=(140, 215, 255, 255), width=3)
    return img

def render_sound(is_on=True):
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    
    # Speaker cone
    cone_pts = [(70, 100), (115, 75), (115, 181), (70, 156)]
    draw.polygon(cone_pts, fill=(70, 150, 245, 255), outline=(35, 100, 195, 255), width=4)
    # Speaker base box
    draw.rounded_rectangle([42, 100, 75, 156], radius=6, fill=(50, 125, 225, 255), outline=(35, 100, 195, 255), width=4)
    
    if is_on:
        # Sound waves
        for rad, start_a, end_a, width in [(38, -50, 50, 10), (62, -50, 50, 9)]:
            draw.arc([115 - rad, 128 - rad, 115 + rad, 128 + rad], start=start_a, end=end_a, fill=(80, 200, 255, 255), width=width)
    else:
        # Mute slash X
        draw.line([(145, 105), (185, 151)], fill=(235, 60, 70, 255), width=12)
        draw.line([(185, 105), (145, 151)], fill=(235, 60, 70, 255), width=12)
        
    return img

def render_export():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    
    # Tray
    draw.line([(55, 150), (55, 205)], fill=(80, 150, 230, 255), width=16)
    draw.line([(47, 205), (209, 205)], fill=(80, 150, 230, 255), width=16)
    draw.line([(201, 205), (201, 150)], fill=(80, 150, 230, 255), width=16)
    
    # Up arrow
    draw.line([(128, 160), (128, 55)], fill=(40, 190, 110, 255), width=20)
    draw.polygon([(128, 40), (85, 95), (171, 95)], fill=(40, 190, 110, 255))
    return img

def render_import():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    
    # Tray
    draw.line([(55, 150), (55, 205)], fill=(80, 150, 230, 255), width=16)
    draw.line([(47, 205), (209, 205)], fill=(80, 150, 230, 255), width=16)
    draw.line([(201, 205), (201, 150)], fill=(80, 150, 230, 255), width=16)
    
    # Down arrow
    draw.line([(128, 50), (128, 145)], fill=(245, 155, 30, 255), width=20)
    draw.polygon([(128, 165), (85, 110), (171, 110)], fill=(245, 155, 30, 255))
    return img

def render_trash():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    
    # Can body
    can_pts = [(70, 95), (80, 215), (176, 215), (186, 95)]
    draw.polygon(can_pts, fill=(235, 65, 75, 255), outline=(180, 30, 45, 255), width=5)
    # Fluting lines
    for fx in [105, 128, 151]:
        draw.line([(fx, 115), (fx, 195)], fill=(255, 130, 140, 200), width=4)
        
    # Lid
    draw.rounded_rectangle([52, 75, 204, 95], radius=6, fill=(200, 40, 50, 255), outline=(150, 25, 35, 255), width=4)
    # Lid handle
    draw.arc([108, 55, 148, 85], start=180, end=0, fill=(200, 40, 50, 255), width=6)
    return img

def render_decorate():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    
    # Cozy wooden garden bench
    # Backrest planks
    draw.rounded_rectangle([50, 75, 185, 95], radius=5, fill=(185, 115, 45, 255), outline=(130, 75, 25, 255), width=3)
    draw.rounded_rectangle([50, 102, 185, 122], radius=5, fill=(185, 115, 45, 255), outline=(130, 75, 25, 255), width=3)
    # Seat plank
    draw.rounded_rectangle([42, 132, 192, 152], radius=6, fill=(205, 135, 55, 255), outline=(140, 85, 30, 255), width=3)
    # Snow layer on backrest
    draw.ellipse([45, 70, 190, 84], fill=(245, 252, 255, 255))
    # Legs
    for lx in [60, 172]:
        draw.line([(lx, 150), (lx, 210)], fill=(90, 95, 105, 255), width=8)
        
    # Cozy hanging lantern on the side
    draw.ellipse([185, 125, 220, 160], fill=(255, 220, 50, 220)) # lantern glow
    draw.rounded_rectangle([190, 130, 215, 165], radius=4, fill=(255, 190, 20, 255), outline=(80, 50, 20, 255), width=3)
    draw.polygon([(185, 130), (202, 115), (220, 130)], fill=(60, 60, 70, 255))
    return img

# ==========================================
# EGGS (Basic, Frozen, Golden)
# ==========================================

def render_egg(variant='basic'):
    size = 256
    img = create_canvas(size)
    cx, cy = 128, 126
    rx, ry = 54, 72
    
    # Shadow
    sdraw = ImageDraw.Draw(img)
    sdraw.ellipse([cx - rx - 2, cy + ry - 16, cx + rx + 8, cy + ry + 12], fill=(30, 40, 50, 120))
    
    # Egg base shape using ellipse
    egg_box = [cx - rx, cy - ry, cx + rx, cy + ry]
    
    if variant == 'basic':
        base_color = (250, 252, 255, 255)
        border_color = (180, 205, 220, 255)
        sdraw.ellipse(egg_box, fill=base_color, outline=border_color, width=5)
        # Cyan specks
        spots = [(108, 105, 12), (145, 118, 16), (120, 150, 11), (148, 158, 13), (122, 122, 9)]
        for sx, sy, sr in spots:
            sdraw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(68, 205, 225, 230))
        # Specular shine
        sdraw.ellipse([cx - 30, cy - 48, cx - 8, cy - 18], fill=(255, 255, 255, 200))
        
    elif variant == 'frozen':
        # Ice glow
        glow = create_canvas(size)
        gdraw = ImageDraw.Draw(glow)
        gdraw.ellipse([cx - rx - 10, cy - ry - 10, cx + rx + 10, cy + ry + 10], fill=(130, 225, 255, 120))
        glow = glow.filter(ImageFilter.GaussianBlur(10))
        img.alpha_composite(glow)
        
        sdraw = ImageDraw.Draw(img)
        base_color = (175, 235, 255, 255)
        border_color = (90, 175, 230, 255)
        sdraw.ellipse(egg_box, fill=base_color, outline=border_color, width=5)
        
        # Ice crystal facets
        facet_pts = [
            [(128, 65), (102, 115), (128, 128)],
            [(128, 65), (128, 128), (154, 115)],
            [(102, 115), (128, 128), (128, 185), (98, 160)],
            [(154, 115), (128, 128), (128, 185), (158, 160)]
        ]
        shades = [(215, 248, 255, 200), (145, 220, 250, 200), (110, 195, 240, 200), (185, 240, 255, 200)]
        for fpts, fcol in zip(facet_pts, shades):
            sdraw.polygon(fpts, fill=fcol)
            
        # Tiny snowflakes
        sdraw.line([(120, 125), (136, 125)], fill=(255, 255, 255, 255), width=3)
        sdraw.line([(128, 117), (128, 133)], fill=(255, 255, 255, 255), width=3)
        
    elif variant == 'golden':
        # Golden glow
        glow = create_canvas(size)
        gdraw = ImageDraw.Draw(glow)
        gdraw.ellipse([cx - rx - 12, cy - ry - 12, cx + rx + 12, cy + ry + 12], fill=(255, 215, 0, 130))
        glow = glow.filter(ImageFilter.GaussianBlur(10))
        img.alpha_composite(glow)
        
        sdraw = ImageDraw.Draw(img)
        base_color = (255, 210, 25, 255)
        border_color = (195, 135, 5, 255)
        sdraw.ellipse(egg_box, fill=base_color, outline=border_color, width=6)
        
        # Golden shine curved bevels
        sdraw.ellipse([cx - 40, cy - 58, cx + 4, cy + 24], fill=(255, 245, 140, 180))
        sdraw.ellipse([cx - 26, cy - 44, cx - 8, cy - 18], fill=(255, 255, 255, 240))
        
        # Crown crest ornament
        sdraw.polygon([(119, 124), (128, 110), (137, 124), (143, 116), (139, 134), (117, 134), (113, 116)], fill=(255, 255, 255, 220))
        
    return img

# ==========================================
# FOOD ITEMS
# ==========================================

def render_krill():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    # Curled pink shrimp/krill
    draw.arc([60, 60, 196, 196], start=40, end=270, fill=(255, 100, 110, 255), width=36)
    # Segments
    for ang in [70, 110, 150, 190, 230]:
        rad = 68
        x = 128 + rad * math.cos(math.radians(ang))
        y = 128 + rad * math.sin(math.radians(ang))
        draw.ellipse([x - 7, y - 7, x + 7, y + 7], fill=(255, 170, 175, 255))
    # Tail fan
    draw.polygon([(65, 128), (40, 110), (45, 146)], fill=(255, 75, 90, 255))
    # Cute eye
    draw.ellipse([175, 155, 191, 171], fill=(40, 20, 20, 255))
    draw.ellipse([178, 157, 184, 163], fill=(255, 255, 255, 255))
    return img

def render_milk():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    # Ceramic mug shadow
    draw.rounded_rectangle([68, 88, 178, 218], radius=20, fill=(40, 50, 70, 120))
    # Handle
    draw.arc([145, 105, 205, 175], start=-90, end=90, fill=(80, 150, 225, 255), width=18)
    # Mug body
    draw.rounded_rectangle([65, 85, 175, 215], radius=20, fill=(90, 165, 240, 255), outline=(50, 115, 190, 255), width=5)
    # White milk froth oval
    draw.ellipse([75, 80, 165, 110], fill=(255, 255, 255, 255), outline=(220, 230, 240, 255), width=3)
    # Heart foam art
    draw.polygon([(120, 93), (120, 97), (116, 93)], fill=(215, 160, 130, 255))
    # Steam curls
    for sx in [105, 135]:
        draw.arc([sx - 15, 45, sx + 15, 75], start=-80, end=80, fill=(240, 248, 255, 160), width=4)
    return img

def render_berries():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    # Frosty leaves
    draw.polygon([(128, 90), (105, 55), (145, 60)], fill=(75, 170, 110, 255), outline=(45, 120, 75, 255), width=3)
    draw.polygon([(128, 90), (160, 65), (150, 95)], fill=(95, 190, 130, 255), outline=(45, 120, 75, 255), width=3)
    # 3 round glossy red berries
    berries = [(96, 142, 34), (160, 142, 34), (128, 180, 36)]
    for bx, by, br in berries:
        draw.ellipse([bx - br - 2, by - br + 4, bx + br + 2, by + br + 8], fill=(80, 15, 25, 140)) # shadow
        draw.ellipse([bx - br, by - br, bx + br, by + br], fill=(230, 35, 50, 255), outline=(160, 20, 35, 255), width=4)
        draw.ellipse([bx - br + 10, by - br + 8, bx - br + 22, by - br + 20], fill=(255, 255, 255, 220)) # shine
    return img

def render_squid():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    # Cute coral squid head
    draw.ellipse([80, 50, 176, 160], fill=(255, 120, 135, 255), outline=(200, 75, 95, 255), width=5)
    # Tentacles
    for tx in [92, 110, 128, 146, 164]:
        draw.rounded_rectangle([tx - 7, 145, tx + 7, 210], radius=6, fill=(255, 140, 155, 255), outline=(200, 75, 95, 255), width=3)
    # Big sparkling eyes
    for ex in [108, 148]:
        draw.ellipse([ex - 12, 105, ex + 12, 129], fill=(30, 20, 30, 255))
        draw.ellipse([ex - 7, 108, ex + 3, 118], fill=(255, 255, 255, 255))
    # Blush
    draw.ellipse([90, 125, 106, 135], fill=(255, 80, 100, 160))
    draw.ellipse([150, 125, 166, 135], fill=(255, 80, 100, 160))
    return img

def render_salmon():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    # Salmon horseshoe steak shape
    draw.ellipse([60, 60, 196, 200], fill=(255, 115, 60, 255), outline=(190, 65, 20, 255), width=6)
    draw.ellipse([98, 120, 158, 185], fill=(0, 0, 0, 0), outline=(190, 65, 20, 255), width=6)
    # White marbling stripes
    for my in [80, 100, 120, 140]:
        draw.arc([75, my - 20, 181, my + 40], start=20, end=160, fill=(255, 235, 225, 240), width=5)
    # Dark skin trim
    draw.arc([60, 60, 196, 200], start=180, end=360, fill=(80, 85, 95, 255), width=8)
    return img

def render_icecream():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    # Waffle cone
    cone_pts = [(90, 130), (166, 130), (128, 225)]
    draw.polygon(cone_pts, fill=(225, 160, 70, 255), outline=(165, 105, 30, 255), width=5)
    # Waffle cross-hatch
    draw.line([(100, 145), (145, 195)], fill=(185, 125, 45, 255), width=3)
    draw.line([(156, 145), (111, 195)], fill=(185, 125, 45, 255), width=3)
    # Ice cream scoop
    draw.ellipse([78, 65, 178, 150], fill=(155, 230, 255, 255), outline=(85, 175, 215, 255), width=5)
    # Frosting swirls
    draw.arc([90, 85, 166, 135], start=0, end=180, fill=(235, 250, 255, 255), width=8)
    # Red cherry on top
    draw.ellipse([116, 48, 140, 72], fill=(235, 40, 60, 255), outline=(160, 20, 35, 255), width=2)
    return img

# ==========================================
# MOODS (Happy, Excited, Curious, Sleepy, Hungry, Sad)
# ==========================================

def render_mood(mood):
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    cx, cy = 128, 128
    
    # Shadow
    draw.ellipse([34, 38, 222, 226], fill=(50, 50, 60, 100))
    
    if mood == 'happy':
        draw.ellipse([32, 32, 224, 224], fill=(255, 215, 30, 255), outline=(210, 155, 10, 255), width=6)
        # Happy arched eyes
        draw.arc([75, 85, 115, 125], start=180, end=360, fill=(70, 45, 10, 255), width=8)
        draw.arc([141, 85, 181, 125], start=180, end=360, fill=(70, 45, 10, 255), width=8)
        # Smiling mouth
        draw.arc([85, 120, 171, 185], start=0, end=180, fill=(70, 45, 10, 255), width=8)
        # Pink blush
        draw.ellipse([65, 135, 89, 155], fill=(255, 120, 140, 180))
        draw.ellipse([167, 135, 191, 155], fill=(255, 120, 140, 180))
        
    elif mood == 'excited':
        draw.ellipse([32, 32, 224, 224], fill=(255, 175, 30, 255), outline=(215, 120, 10, 255), width=6)
        # Star eyes
        for ex in [95, 161]:
            draw.polygon([(ex, 90), (ex+4, 102), (ex+16, 106), (ex+6, 114), (ex+8, 126), (ex, 118), (ex-8, 126), (ex-6, 114), (ex-16, 106), (ex-4, 102)], fill=(255, 255, 255, 255))
        # Big open happy mouth
        draw.chord([90, 130, 166, 195], start=0, end=180, fill=(180, 30, 40, 255), outline=(70, 45, 10, 255), width=6)
        draw.ellipse([110, 160, 146, 190], fill=(255, 110, 130, 255)) # tongue
        
    elif mood == 'curious':
        draw.ellipse([32, 32, 224, 224], fill=(255, 205, 50, 255), outline=(205, 145, 15, 255), width=6)
        # One big eye, one normal eye
        draw.ellipse([80, 85, 116, 125], fill=(50, 35, 10, 255))
        draw.ellipse([88, 93, 100, 105], fill=(255, 255, 255, 255))
        draw.ellipse([144, 92, 172, 122], fill=(50, 35, 10, 255))
        draw.ellipse([150, 97, 160, 107], fill=(255, 255, 255, 255))
        # Small curious 'o' mouth
        draw.ellipse([118, 145, 138, 168], fill=(60, 40, 15, 255))
        # Question mark sparkle
        draw.text((180, 45), "?", fill=(255, 140, 0, 255))
        
    elif mood == 'sleepy':
        draw.ellipse([32, 32, 224, 224], fill=(180, 190, 245, 255), outline=(130, 140, 210, 255), width=6)
        # Closed horizontal slit eyes
        draw.line([(75, 115), (115, 115)], fill=(60, 70, 110, 255), width=7)
        draw.line([(141, 115), (181, 115)], fill=(60, 70, 110, 255), width=7)
        # Small relaxed line mouth
        draw.line([(115, 160), (141, 160)], fill=(60, 70, 110, 255), width=6)
        # Sleepy bubble Zzz
        draw.ellipse([160, 60, 195, 95], fill=(220, 235, 255, 220), outline=(130, 150, 210, 255), width=3)
        
    elif mood == 'hungry':
        draw.ellipse([32, 32, 224, 224], fill=(255, 190, 40, 255), outline=(210, 135, 15, 255), width=6)
        # Round begging eyes
        for ex in [95, 161]:
            draw.ellipse([ex - 18, 88, ex + 18, 124], fill=(60, 40, 10, 255))
            draw.ellipse([ex - 12, 92, ex + 2, 106], fill=(255, 255, 255, 255))
            draw.ellipse([ex + 2, 108, ex + 10, 116], fill=(255, 255, 255, 255))
        # Open mouth with lick tongue
        draw.arc([100, 135, 156, 185], start=0, end=180, fill=(60, 40, 10, 255), width=7)
        draw.ellipse([115, 155, 141, 185], fill=(255, 100, 120, 255))
        
    elif mood == 'sad':
        draw.ellipse([32, 32, 224, 224], fill=(160, 205, 240, 255), outline=(110, 160, 200, 255), width=6)
        # Down-turned eyes
        draw.arc([75, 105, 115, 135], start=0, end=180, fill=(40, 70, 100, 255), width=7)
        draw.arc([141, 105, 181, 135], start=0, end=180, fill=(40, 70, 100, 255), width=7)
        # Sad frown mouth
        draw.arc([95, 155, 161, 200], start=180, end=360, fill=(40, 70, 100, 255), width=7)
        # Tear drop
        draw.ellipse([165, 135, 181, 157], fill=(65, 180, 255, 240))
        
    return img

def render_chevron(direction='right'):
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    # Circle button base
    draw.ellipse([34, 38, 222, 226], fill=(40, 55, 75, 140)) # shadow
    draw.ellipse([32, 32, 224, 224], fill=(70, 140, 220, 255), outline=(40, 95, 170, 255), width=6)
    draw.ellipse([42, 40, 214, 130], fill=(120, 180, 250, 180)) # highlight
    line_w = 20
    if direction == 'right':
        # Points pointing right
        draw.line([(105, 75), (160, 128)], fill=(255, 255, 255, 255), width=line_w)
        draw.line([(160, 128), (105, 181)], fill=(255, 255, 255, 255), width=line_w)
        for pt in [(105, 75), (160, 128), (105, 181)]:
            draw.ellipse([pt[0] - line_w // 2, pt[1] - line_w // 2, pt[0] + line_w // 2, pt[1] + line_w // 2], fill=(255, 255, 255, 255))
    else:
        # Points pointing left
        draw.line([(151, 75), (96, 128)], fill=(255, 255, 255, 255), width=line_w)
        draw.line([(96, 128), (151, 181)], fill=(255, 255, 255, 255), width=line_w)
        for pt in [(151, 75), (96, 128), (151, 181)]:
            draw.ellipse([pt[0] - line_w // 2, pt[1] - line_w // 2, pt[0] + line_w // 2, pt[1] + line_w // 2], fill=(255, 255, 255, 255))
    return img

def render_arrow_right():
    size = 256
    img = create_canvas(size)
    draw = ImageDraw.Draw(img)
    # Right arrow
    draw.line([(60, 128), (165, 128)], fill=(255, 205, 30, 255), width=24)
    draw.polygon([(160, 80), (215, 128), (160, 176)], fill=(255, 205, 30, 255))
    return img

# ==========================================
# GENERATION DRIVER
# ==========================================

def generate_all():
    base_dir = r"apps\web\src\assets\game"
    
    # Status
    save_icon(render_star(), os.path.join(base_dir, "icons", "status", "star.png"))
    save_icon(render_crown(), os.path.join(base_dir, "icons", "status", "crown.png"))
    save_icon(render_close(), os.path.join(base_dir, "icons", "status", "close.png"))
    save_icon(render_check(), os.path.join(base_dir, "icons", "status", "check.png"))
    save_icon(render_lock(), os.path.join(base_dir, "icons", "status", "lock.png"))
    save_icon(render_gift(), os.path.join(base_dir, "icons", "status", "gift.png"))
    save_icon(render_calendar(), os.path.join(base_dir, "icons", "status", "calendar.png"))
    save_icon(render_target(), os.path.join(base_dir, "icons", "status", "target.png"))
    save_icon(render_snowflake(), os.path.join(base_dir, "icons", "status", "snowflake.png"))
    save_icon(render_sound(True), os.path.join(base_dir, "icons", "status", "sound_on.png"))
    save_icon(render_sound(False), os.path.join(base_dir, "icons", "status", "sound_off.png"))
    save_icon(render_export(), os.path.join(base_dir, "icons", "status", "export.png"))
    save_icon(render_import(), os.path.join(base_dir, "icons", "status", "import.png"))
    save_icon(render_trash(), os.path.join(base_dir, "icons", "status", "trash.png"))
    save_icon(render_decorate(), os.path.join(base_dir, "icons", "actions", "decorate.png"))
    save_icon(render_chevron('left'), os.path.join(base_dir, "icons", "status", "chevron_left.png"))
    save_icon(render_chevron('right'), os.path.join(base_dir, "icons", "status", "chevron_right.png"))
    save_icon(render_arrow_right(), os.path.join(base_dir, "icons", "status", "arrow_right.png"))
    
    # Eggs
    save_icon(render_egg('basic'), os.path.join(base_dir, "items", "eggs", "egg_basic.png"))
    save_icon(render_egg('frozen'), os.path.join(base_dir, "items", "eggs", "egg_frozen.png"))
    save_icon(render_egg('golden'), os.path.join(base_dir, "items", "eggs", "egg_golden.png"))
    
    # Food
    save_icon(render_krill(), os.path.join(base_dir, "items", "food", "krill.png"))
    save_icon(render_milk(), os.path.join(base_dir, "items", "food", "milk.png"))
    save_icon(render_berries(), os.path.join(base_dir, "items", "food", "berries.png"))
    save_icon(render_squid(), os.path.join(base_dir, "items", "food", "squid.png"))
    save_icon(render_salmon(), os.path.join(base_dir, "items", "food", "salmon.png"))
    save_icon(render_icecream(), os.path.join(base_dir, "items", "food", "icecream.png"))
    
    # Moods
    for m in ['happy', 'excited', 'curious', 'sleepy', 'hungry', 'sad']:
        save_icon(render_mood(m), os.path.join(base_dir, "moods", f"mood_{m}.png"))

if __name__ == '__main__':
    generate_all()
