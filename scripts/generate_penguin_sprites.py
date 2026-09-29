import os
import math
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

RENDER_SIZE = 512
TARGET_SIZE = 128

SPECIES_CONFIG = {
    'snowy': {
        'name': 'Snowy',
        'coat_light': (45, 62, 95, 255),
        'coat_dark': (20, 26, 42, 255),
        'coat_outline': (14, 18, 30, 255),
        'belly_base': (244, 250, 255, 255),
        'belly_shadow': (215, 230, 245, 255),
        'belly_outline': (170, 190, 215, 255),
        'beak_base': (255, 145, 0, 255),
        'beak_dark': (220, 95, 0, 255),
        'feet_base': (255, 160, 20, 255),
        'feet_dark': (220, 105, 0, 255),
        'blush': (255, 140, 160, 150),
        'accessory': 'earmuffs',
        'accessory_color': (56, 189, 248, 255),
    },
    'sleepy': {
        'name': 'Sleepy',
        'coat_light': (125, 105, 165, 255),
        'coat_dark': (75, 58, 105, 255),
        'coat_outline': (45, 32, 68, 255),
        'belly_base': (250, 244, 255, 255),
        'belly_shadow': (222, 210, 240, 255),
        'belly_outline': (180, 165, 210, 255),
        'beak_base': (255, 175, 50, 255),
        'beak_dark': (225, 125, 15, 255),
        'feet_base': (255, 175, 50, 255),
        'feet_dark': (225, 125, 15, 255),
        'blush': (240, 140, 180, 130),
        'accessory': 'nightcap',
        'accessory_color': (168, 85, 247, 255),
    },
    'shy': {
        'name': 'Shy',
        'coat_light': (48, 140, 150, 255),
        'coat_dark': (22, 85, 95, 255),
        'coat_outline': (14, 52, 60, 255),
        'belly_base': (240, 253, 250, 255),
        'belly_shadow': (200, 232, 226, 255),
        'belly_outline': (155, 200, 195, 255),
        'beak_base': (255, 165, 30, 255),
        'beak_dark': (225, 115, 0, 255),
        'feet_base': (255, 165, 30, 255),
        'feet_dark': (225, 115, 0, 255),
        'blush': (255, 105, 135, 220),
        'accessory': 'scarf',
        'accessory_color': (244, 114, 182, 255),
    },
    'happy': {
        'name': 'Happy',
        'coat_light': (250, 175, 25, 255),
        'coat_dark': (205, 110, 10, 255),
        'coat_outline': (140, 70, 5, 255),
        'belly_base': (255, 253, 240, 255),
        'belly_shadow': (245, 230, 190, 255),
        'belly_outline': (210, 190, 140, 255),
        'beak_base': (255, 85, 15, 255),
        'beak_dark': (210, 55, 0, 255),
        'feet_base': (255, 95, 20, 255),
        'feet_dark': (215, 60, 5, 255),
        'blush': (255, 125, 95, 160),
        'accessory': 'bowtie',
        'accessory_color': (34, 197, 94, 255),
    },
    'hungry': {
        'name': 'Hungry',
        'coat_light': (32, 125, 130, 255),
        'coat_dark': (12, 75, 80, 255),
        'coat_outline': (8, 45, 50, 255),
        'belly_base': (255, 248, 235, 255),
        'belly_shadow': (235, 220, 195, 255),
        'belly_outline': (195, 175, 145, 255),
        'beak_base': (255, 145, 15, 255),
        'beak_dark': (215, 100, 5, 255),
        'feet_base': (255, 145, 15, 255),
        'feet_dark': (215, 100, 5, 255),
        'blush': (255, 140, 130, 150),
        'accessory': 'bib',
        'accessory_color': (251, 146, 60, 255),
    }
}

def create_layer():
    return Image.new('RGBA', (RENDER_SIZE, RENDER_SIZE), (0, 0, 0, 0))

def get_body_points(cx, cy, head_r, belly_rx, belly_ry):
    pts = []
    head_cy = cy - belly_ry * 0.72
    for a in range(-180, 1, 8):
        rad = math.radians(a)
        pts.append((cx + head_r * math.cos(rad), head_cy + head_r * math.sin(rad)))
    
    t_steps = 12
    p0 = (cx + head_r, head_cy)
    p1 = (cx + head_r * 1.15, head_cy + belly_ry * 0.45)
    p2 = (cx + belly_rx, cy - belly_ry * 0.1)
    p3 = (cx + belly_rx, cy + belly_ry * 0.2)
    for i in range(1, t_steps):
        t = i / t_steps
        x = (1-t)**3 * p0[0] + 3*(1-t)**2 * t * p1[0] + 3*(1-t)*t**2 * p2[0] + t**3 * p3[0]
        y = (1-t)**3 * p0[1] + 3*(1-t)**2 * t * p1[1] + 3*(1-t)*t**2 * p2[1] + t**3 * p3[1]
        pts.append((x, y))

    for a in range(15, 166, 8):
        rad = math.radians(a)
        pts.append((cx + belly_rx * math.cos(rad), cy + belly_ry * math.sin(rad)))

    p0 = (cx - belly_rx, cy + belly_ry * 0.2)
    p1 = (cx - belly_rx, cy - belly_ry * 0.1)
    p2 = (cx - head_r * 1.15, head_cy + belly_ry * 0.45)
    p3 = (cx - head_r, head_cy)
    for i in range(1, t_steps):
        t = i / t_steps
        x = (1-t)**3 * p0[0] + 3*(1-t)**2 * t * p1[0] + 3*(1-t)*t**2 * p2[0] + t**3 * p3[0]
        y = (1-t)**3 * p0[1] + 3*(1-t)**2 * t * p1[1] + 3*(1-t)*t**2 * p2[1] + t**3 * p3[1]
        pts.append((x, y))
        
    return pts

def draw_flipper_teardrop(cx, cy, length, width, angle_deg, base_col, shadow_col, outline_col):
    layer = create_layer()
    draw = ImageDraw.Draw(layer)
    
    tip_y = cy + length
    tip_r = width * 0.35
    top_w = width * 0.45
    
    pts = [
        (cx - top_w, cy),
        (cx - width * 0.6, cy + length * 0.5),
        (cx - tip_r, tip_y),
        (cx, tip_y + tip_r * 0.6),
        (cx + tip_r, tip_y),
        (cx + width * 0.6, cy + length * 0.5),
        (cx + top_w, cy),
    ]
    
    draw.polygon(pts, fill=base_col)
    draw.polygon([(cx - width * 0.3, cy + length * 0.3), (cx + width * 0.3, cy + length * 0.3), (cx, tip_y)], fill=shadow_col)
    draw.line([(cx - width * 0.2, cy + 15), (cx - width * 0.2, cy + length * 0.7)], fill=(255, 255, 255, 80), width=4)
    draw.line(pts + [pts[0]], fill=outline_col, width=6)
    
    if angle_deg != 0:
        layer = layer.rotate(angle_deg, resample=Image.Resampling.BICUBIC, center=(cx, cy))
    return layer

def draw_foot_clean(cx, cy, rx, ry, angle_deg, base_col, shadow_col, outline_col):
    layer = create_layer()
    draw = ImageDraw.Draw(layer)
    draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=base_col, outline=outline_col, width=5)
    draw.line([cx - rx * 0.3, cy - ry * 0.3, cx - rx * 0.45, cy + ry], fill=outline_col, width=4)
    draw.line([cx + rx * 0.3, cy - ry * 0.3, cx + rx * 0.45, cy + ry], fill=outline_col, width=4)
    draw.ellipse([cx - rx * 0.5, cy - ry * 0.7, cx + rx * 0.5, cy - ry * 0.1], fill=(255, 255, 255, 100))
    if angle_deg != 0:
        layer = layer.rotate(angle_deg, resample=Image.Resampling.BICUBIC, center=(cx, cy))
    return layer

def draw_fish_prop(cx, cy, outline_col):
    layer = create_layer()
    draw = ImageDraw.Draw(layer)
    draw.ellipse([cx - 40, cy - 14, cx + 26, cy + 14], fill=(125, 211, 252, 255), outline=outline_col, width=4)
    draw.polygon([(cx + 20, cy), (cx + 46, cy - 16), (cx + 46, cy + 16)], fill=(56, 189, 248, 255), outline=outline_col)
    draw.line([(cx + 20, cy), (cx + 46, cy - 16), (cx + 46, cy + 16), (cx + 20, cy)], fill=outline_col, width=4)
    draw.ellipse([cx - 28, cy - 6, cx - 18, cy + 4], fill=(255, 255, 255, 255), outline=outline_col, width=2)
    draw.ellipse([cx - 25, cy - 4, cx - 21, cy], fill=(0, 0, 0, 255))
    return layer

def render_species_frame(species_id: str, pose: str) -> Image.Image:
    spec = SPECIES_CONFIG[species_id]
    img = create_layer()
    
    cx = 256
    belly_cy = 345
    ground_y = 480
    
    body_angle = 0
    body_x = 0
    body_y = 0
    flipper_l_angle = 18
    flipper_r_angle = -18
    flipper_l_pivot = (cx - 105, belly_cy - 40)
    flipper_r_pivot = (cx + 105, belly_cy - 40)
    
    foot_left_y = ground_y - 20
    foot_right_y = ground_y - 20
    foot_left_angle = -6
    foot_right_angle = 6
    
    eyes_style = 'normal'
    if species_id == 'sleepy':
        eyes_style = 'sleepy_half'
    
    has_fish = False
    
    if pose == 'idle':
        pass
    elif pose == 'walk_0':
        body_angle = -3.5
        body_x = -8
        flipper_l_angle = 38
        flipper_r_angle = -6
        foot_left_y = ground_y - 20
        foot_left_angle = -8
        foot_right_y = ground_y - 52
        foot_right_angle = 22
    elif pose == 'walk_1':
        body_angle = 0
        body_x = -2
        flipper_l_angle = 20
        flipper_r_angle = -18
        foot_left_y = ground_y - 20
        foot_left_angle = -6
        foot_right_y = ground_y - 30
        foot_right_angle = 10
    elif pose == 'walk_2':
        body_angle = 3.5
        body_x = 8
        flipper_l_angle = 6
        flipper_r_angle = -38
        foot_right_y = ground_y - 20
        foot_right_angle = 8
        foot_left_y = ground_y - 52
        foot_left_angle = -22
    elif pose == 'walk_3':
        body_angle = 0
        body_x = 2
        flipper_l_angle = 18
        flipper_r_angle = -20
        foot_right_y = ground_y - 20
        foot_right_angle = 6
        foot_left_y = ground_y - 30
        foot_left_angle = -10
    elif pose == 'sleep':
        body_y = 16
        eyes_style = 'closed_sleep'
        flipper_l_angle = 8
        flipper_r_angle = -8
        foot_left_y = ground_y - 20
        foot_right_y = ground_y - 20
    elif pose == 'eat':
        eyes_style = 'happy_squint'
        flipper_l_angle = 48
        flipper_r_angle = -48
        has_fish = True
    elif pose == 'celebrate':
        body_y = -10
        eyes_style = 'happy_squint'
        flipper_l_angle = -130
        flipper_r_angle = 130
        foot_left_angle = -14
        foot_right_angle = 14
    elif pose == 'slide':
        # Streamlined belly slide pose
        body_y = 12
        eyes_style = 'happy_squint'
        flipper_l_angle = 45
        flipper_r_angle = -45
        foot_left_y = ground_y - 36
        foot_right_y = ground_y - 36
        foot_left_angle = -25
        foot_right_angle = 25

    # 1. Feet
    foot_left = draw_foot_clean(cx - 60 + body_x, foot_left_y + body_y, 48, 22, foot_left_angle, spec['feet_base'], spec['feet_dark'], spec['coat_outline'])
    foot_right = draw_foot_clean(cx + 60 + body_x, foot_right_y + body_y, 48, 22, foot_right_angle, spec['feet_base'], spec['feet_dark'], spec['coat_outline'])
    img.alpha_composite(foot_left)
    img.alpha_composite(foot_right)

    # 2. Body Layer with Masked Radial Gradient
    body_pts = get_body_points(cx + body_x, belly_cy + body_y, head_r=100, belly_rx=135, belly_ry=105)
    
    body_mask = create_layer()
    bmask_draw = ImageDraw.Draw(body_mask)
    bmask_draw.polygon(body_pts, fill=(255, 255, 255, 255))
    
    w, h = RENDER_SIZE, RENDER_SIZE
    y, x = np.ogrid[:h, :w]
    dist = np.sqrt((x - (cx + body_x + 35))**2 + (y - (belly_cy + body_y + 35))**2)
    t = np.clip(dist / 175.0, 0, 1)
    grad_arr = np.zeros((h, w, 4), dtype=np.uint8)
    c_in = np.array(spec['coat_light'])
    c_out = np.array(spec['coat_dark'])
    for c in range(4):
        grad_arr[:, :, c] = (c_in[c] * (1 - t) + c_out[c] * t).astype(np.uint8)
    
    mask_np = np.array(body_mask)[:, :, 3]
    grad_arr[:, :, 3] = (grad_arr[:, :, 3].astype(np.float32) * (mask_np.astype(np.float32) / 255.0)).astype(np.uint8)
    body_layer = Image.fromarray(grad_arr, 'RGBA')
    
    bdraw = ImageDraw.Draw(body_layer)
    bdraw.line(body_pts + [body_pts[0]], fill=spec['coat_outline'], width=7)
    
    # Belly patch
    bdraw.ellipse([cx + body_x - 90, belly_cy + body_y - 70, cx + body_x + 90, belly_cy + body_y + 92], fill=spec['belly_base'], outline=spec['belly_outline'], width=5)
    bdraw.ellipse([cx + body_x - 80, belly_cy + body_y - 35, cx + body_x + 80, belly_cy + body_y + 88], fill=spec['belly_shadow'])
    
    # Cheeks
    bdraw.ellipse([cx + body_x - 82, belly_cy + body_y - 110, cx + body_x - 44, belly_cy + body_y - 85], fill=spec['blush'])
    bdraw.ellipse([cx + body_x + 44, belly_cy + body_y - 110, cx + body_x + 82, belly_cy + body_y - 85], fill=spec['blush'])
    
    # Eyes
    eye_y = belly_cy + body_y - 138
    if eyes_style == 'closed_sleep':
        bdraw.arc([cx + body_x - 65, eye_y - 10, cx + body_x - 25, eye_y + 16], 20, 160, fill=spec['coat_outline'], width=6)
        bdraw.arc([cx + body_x + 25, eye_y - 10, cx + body_x + 65, eye_y + 16], 20, 160, fill=spec['coat_outline'], width=6)
    elif eyes_style == 'happy_squint':
        bdraw.arc([cx + body_x - 65, eye_y - 18, cx + body_x - 25, eye_y + 12], 200, 340, fill=spec['coat_outline'], width=7)
        bdraw.arc([cx + body_x + 25, eye_y - 18, cx + body_x + 65, eye_y + 12], 200, 340, fill=spec['coat_outline'], width=7)
    elif eyes_style == 'sleepy_half':
        bdraw.ellipse([cx + body_x - 62, eye_y - 20, cx + body_x - 28, eye_y + 18], fill=(16, 22, 34, 255))
        bdraw.ellipse([cx + body_x - 55, eye_y - 12, cx + body_x - 41, eye_y + 2], fill=(255, 255, 255, 255))
        bdraw.chord([cx + body_x - 66, eye_y - 26, cx + body_x - 24, eye_y + 8], 180, 360, fill=spec['coat_light'], outline=spec['coat_outline'], width=4)
        
        bdraw.ellipse([cx + body_x + 28, eye_y - 20, cx + body_x + 62, eye_y + 18], fill=(16, 22, 34, 255))
        bdraw.ellipse([cx + body_x + 36, eye_y - 12, cx + body_x + 50, eye_y + 2], fill=(255, 255, 255, 255))
        bdraw.chord([cx + body_x + 24, eye_y - 26, cx + body_x + 66, eye_y + 8], 180, 360, fill=spec['coat_light'], outline=spec['coat_outline'], width=4)
    else:
        bdraw.ellipse([cx + body_x - 62, eye_y - 25, cx + body_x - 28, eye_y + 22], fill=(16, 22, 34, 255))
        bdraw.ellipse([cx + body_x - 55, eye_y - 18, cx + body_x - 41, eye_y - 4], fill=(255, 255, 255, 255))
        bdraw.ellipse([cx + body_x - 41, eye_y + 6, cx + body_x - 33, eye_y + 14], fill=(255, 255, 255, 220))

        bdraw.ellipse([cx + body_x + 28, eye_y - 25, cx + body_x + 62, eye_y + 22], fill=(16, 22, 34, 255))
        bdraw.ellipse([cx + body_x + 36, eye_y - 18, cx + body_x + 50, eye_y - 4], fill=(255, 255, 255, 255))
        bdraw.ellipse([cx + body_x + 50, eye_y + 6, cx + body_x + 58, eye_y + 14], fill=(255, 255, 255, 220))
    
    # Beak
    beak_y = belly_cy + body_y - 95
    beak_pts = [(cx + body_x - 28, beak_y), (cx + body_x + 28, beak_y), (cx + body_x, beak_y + 32)]
    bdraw.polygon(beak_pts, fill=spec['beak_base'], outline=spec['coat_outline'])
    bdraw.line(beak_pts + [beak_pts[0]], fill=spec['coat_outline'], width=5)
    bdraw.ellipse([cx + body_x - 14, beak_y + 3, cx + body_x + 14, beak_y + 13], fill=(255, 255, 255, 120))
    
    # Accessories
    head_cy = belly_cy + body_y - 105 * 0.72
    acc = spec['accessory']
    acc_col = spec['accessory_color']
    
    if acc == 'earmuffs':
        bdraw.arc([cx + body_x - 85, head_cy - 110, cx + body_x + 85, head_cy - 20], 195, 345, fill=(240, 248, 255, 255), width=9)
        bdraw.ellipse([cx + body_x - 112, head_cy - 65, cx + body_x - 74, head_cy - 15], fill=acc_col, outline=spec['coat_outline'], width=5)
        bdraw.ellipse([cx + body_x + 74, head_cy - 65, cx + body_x + 112, head_cy - 15], fill=acc_col, outline=spec['coat_outline'], width=5)
    elif acc == 'nightcap':
        cap_pts = [
            (cx + body_x - 70, head_cy - 80),
            (cx + body_x + 65, head_cy - 90),
            (cx + body_x + 140, head_cy - 15),
            (cx + body_x - 15, head_cy - 95),
        ]
        bdraw.polygon(cap_pts, fill=acc_col, outline=spec['coat_outline'])
        bdraw.line(cap_pts + [cap_pts[0]], fill=spec['coat_outline'], width=5)
        bdraw.ellipse([cx + body_x + 125, head_cy - 30, cx + body_x + 160, head_cy + 5], fill=(255, 255, 255, 255), outline=spec['coat_outline'], width=4)
    elif acc == 'scarf':
        scarf_y = head_cy + 42
        bdraw.rounded_rectangle([cx + body_x - 75, scarf_y - 12, cx + body_x + 75, scarf_y + 20], radius=14, fill=acc_col, outline=spec['coat_outline'], width=5)
        bdraw.rounded_rectangle([cx + body_x + 25, scarf_y + 12, cx + body_x + 65, scarf_y + 70], radius=10, fill=acc_col, outline=spec['coat_outline'], width=5)
    elif acc == 'bowtie':
        bt_y = head_cy + 54
        bdraw.polygon([(cx + body_x, bt_y), (cx + body_x - 36, bt_y - 18), (cx + body_x - 36, bt_y + 18)], fill=acc_col, outline=spec['coat_outline'])
        bdraw.polygon([(cx + body_x, bt_y), (cx + body_x + 36, bt_y - 18), (cx + body_x + 36, bt_y + 18)], fill=acc_col, outline=spec['coat_outline'])
        bdraw.line([(cx + body_x, bt_y), (cx + body_x - 36, bt_y - 18), (cx + body_x - 36, bt_y + 18), (cx + body_x, bt_y)], fill=spec['coat_outline'], width=4)
        bdraw.line([(cx + body_x, bt_y), (cx + body_x + 36, bt_y - 18), (cx + body_x + 36, bt_y + 18), (cx + body_x, bt_y)], fill=spec['coat_outline'], width=4)
        bdraw.ellipse([cx + body_x - 10, bt_y - 10, cx + body_x + 10, bt_y + 10], fill=acc_col, outline=spec['coat_outline'], width=4)
    elif acc == 'bib':
        bib_y = head_cy + 48
        bdraw.ellipse([cx + body_x - 55, bib_y, cx + body_x + 55, bib_y + 72], fill=acc_col, outline=spec['coat_outline'], width=5)
        bdraw.ellipse([cx + body_x - 14, bib_y + 25, cx + body_x + 14, bib_y + 45], fill=(255, 255, 255, 220))

    if has_fish:
        fish_layer = draw_fish_prop(cx + body_x, beak_y + 20, spec['coat_outline'])
        body_layer.alpha_composite(fish_layer)

    if body_angle != 0:
        body_layer = body_layer.rotate(body_angle, resample=Image.Resampling.BICUBIC, center=(cx + body_x, ground_y))
        
    img.alpha_composite(body_layer)
    
    # 3. Flippers
    flipper_l = draw_flipper_teardrop(flipper_l_pivot[0] + body_x, flipper_l_pivot[1] + body_y, length=125, width=46, angle_deg=flipper_l_angle, base_col=spec['coat_light'], shadow_col=spec['coat_dark'], outline_col=spec['coat_outline'])
    flipper_r = draw_flipper_teardrop(flipper_r_pivot[0] + body_x, flipper_r_pivot[1] + body_y, length=125, width=46, angle_deg=flipper_r_angle, base_col=spec['coat_light'], shadow_col=spec['coat_dark'], outline_col=spec['coat_outline'])
    img.alpha_composite(flipper_l)
    img.alpha_composite(flipper_r)
    
    return img.resize((TARGET_SIZE, TARGET_SIZE), Image.Resampling.LANCZOS)

def main():
    out_dir = os.path.join('apps', 'web', 'public', 'assets', 'game', 'penguins')
    os.makedirs(out_dir, exist_ok=True)
    
    poses = ['idle', 'walk_0', 'walk_1', 'walk_2', 'walk_3', 'sleep', 'eat', 'celebrate', 'slide']
    species_list = list(SPECIES_CONFIG.keys())
    
    total = len(species_list) * (len(poses) + 1)
    count = 0
    
    print(f"Generating {total} high-quality penguin sprite frames...")
    for sp in species_list:
        base_frame = render_species_frame(sp, 'idle')
        base_path = os.path.join(out_dir, f"penguin_{sp}.png")
        base_frame.save(base_path, 'PNG')
        count += 1
        
        for pose in poses:
            frame = render_species_frame(sp, pose)
            path = os.path.join(out_dir, f"penguin_{sp}_{pose}.png")
            frame.save(path, 'PNG')
            count += 1
            print(f"[{count}/{total}] Generated {path}")
            
    print("All penguin frames generated successfully!")

if __name__ == '__main__':
    main()
