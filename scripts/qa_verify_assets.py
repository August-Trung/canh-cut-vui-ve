import os
import re
from PIL import Image

def run_qa():
    base_dir = os.path.normpath('apps/web/src/assets/game')
    index_path = os.path.normpath('apps/web/src/assets/game/index.ts')

    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Check imports in index.ts
    import_pattern = re.compile(r"import\s+(\w+)\s+from\s+['\"](.+?)['\"]")
    imports = import_pattern.findall(content)

    print(f"=== 1. VERIFY PHYSICAL FILES ===")
    print(f"Total imports in index.ts: {len(imports)}")
    
    imported_files = set()
    missing_files = []
    for var_name, rel_path in imports:
        full_path = os.path.normpath(os.path.join(base_dir, rel_path))
        if not os.path.exists(full_path):
            missing_files.append((var_name, rel_path, full_path))
        imported_files.add(full_path)

    print(f"Missing imported files: {len(missing_files)}")
    for m in missing_files:
        print(f"  [ERROR] Missing: {m[0]} -> {m[1]}")

    all_pngs = set()
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.endswith('.png'):
                all_pngs.add(os.path.normpath(os.path.join(root, f)))

    print(f"Total physical PNG files: {len(all_pngs)}")
    print(f"Total imported PNG files: {len(imported_files)}")
    unreferenced = all_pngs - imported_files
    print(f"Unreferenced PNG files: {len(unreferenced)}")
    for u in unreferenced:
        print(f"  [WARN] Unreferenced: {u}")

    # Count keys in GAME_ASSETS
    # Extract keys inside export const GAME_ASSETS = { ... }
    m = re.search(r"export const GAME_ASSETS = \{([^}]+(?:\{[^}]*\}[^}]*)*)\}\s*as const", content, re.DOTALL)
    if m:
        body = m.group(1)
        keys = []
        for line in body.split('\n'):
            line = line.strip()
            if not line or line.startswith('//'):
                continue
            key_match = re.match(r"^(['\"]?[\w\-]+['\"]?)\s*:", line)
            if key_match:
                keys.append(key_match.group(1).strip("'\""))
            else:
                simple_match = re.match(r"^([\w\-]+),?$", line)
                if simple_match:
                    keys.append(simple_match.group(1))
        print(f"Total Registry keys in GAME_ASSETS: {len(keys)}")
    else:
        print("Could not parse GAME_ASSETS block")

    # 2. Check Transparency & Alpha Channel
    print(f"\n=== 2. VERIFY TRANSPARENCY & ALPHA ===")
    non_alpha = []
    solid_bg = []
    bad_dimensions = []
    bbox_issues = []

    for p in sorted(all_pngs):
        rel = os.path.relpath(p, base_dir)
        with Image.open(p) as img:
            w, h = img.size
            if w != 128 or h != 128:
                bad_dimensions.append((rel, w, h))
            if img.mode != 'RGBA':
                non_alpha.append((rel, img.mode))
                continue
            
            # Check corners for transparency
            # Pixel values at corners should have alpha == 0
            corners = [
                img.getpixel((0, 0)),
                img.getpixel((w - 1, 0)),
                img.getpixel((0, h - 1)),
                img.getpixel((w - 1, h - 1))
            ]
            opaque_corners = [c for c in corners if c[3] > 0]
            if len(opaque_corners) > 0:
                solid_bg.append((rel, opaque_corners))
            
            # Check bounding box
            alpha = img.split()[-1]
            bbox = alpha.getbbox()
            if not bbox:
                bbox_issues.append((rel, "Entire image is transparent!"))
            else:
                bw = bbox[2] - bbox[0]
                bh = bbox[3] - bbox[1]
                # If bbox touches 0,0 or 128,128 completely, might be clipped
                if bbox[0] == 0 or bbox[1] == 0 or bbox[2] == w or bbox[3] == h:
                    bbox_issues.append((rel, f"Touches edge (might be clipped): {bbox}"))

    print(f"Non-RGBA images: {len(non_alpha)}")
    for item in non_alpha:
        print(f"  [ERROR] Non-RGBA: {item[0]} (mode: {item[1]})")

    print(f"Images with non-transparent corners (solid/rectangle bg): {len(solid_bg)}")
    for item in solid_bg:
        print(f"  [ERROR] Non-transparent corner: {item[0]}")

    print(f"Images with incorrect dimensions (!= 128x128): {len(bad_dimensions)}")
    for item in bad_dimensions:
        print(f"  [WARN] Dimensions: {item[0]} ({item[1]}x{item[2]})")

    print(f"Images with bbox issues: {len(bbox_issues)}")
    for item in bbox_issues:
        print(f"  [WARN] Bbox: {item[0]} -> {item[1]}")

if __name__ == '__main__':
    run_qa()
