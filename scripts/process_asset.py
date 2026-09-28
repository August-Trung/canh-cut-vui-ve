import sys
import os
from PIL import Image
import numpy as np

def make_transparent_and_center(input_path: str, output_path: str, target_size: int = 128):
    if not os.path.exists(input_path):
        print(f"Error: {input_path} does not exist", file=sys.stderr)
        sys.exit(1)

    img = Image.open(input_path).convert('RGBA')
    arr = np.array(img, dtype=np.float32)

    # Sample corners to determine background color
    corners = np.vstack([
        arr[0:5, 0:5, :3].reshape(-1, 3),
        arr[0:5, -5:, :3].reshape(-1, 3),
        arr[-5:, 0:5, :3].reshape(-1, 3),
        arr[-5:, -5:, :3].reshape(-1, 3),
    ])
    bg_color = np.median(corners, axis=0)

    # Color Euclidean distance from background
    diff = arr[:, :, :3] - bg_color
    dist = np.sqrt(np.sum(diff * diff, axis=2))

    # Thresholds for clean feathered edge
    inner_thresh = 22.0
    outer_thresh = 50.0

    alpha = np.clip((dist - inner_thresh) / (outer_thresh - inner_thresh), 0.0, 1.0) * 255.0
    arr[:, :, 3] = alpha

    processed = Image.fromarray(arr.astype(np.uint8))

    # Crop to non-transparent bounding box
    bbox = processed.getbbox()
    if bbox:
        processed = processed.crop(bbox)

    # Pad with gentle margin to maintain aspect ratio and prevent edge clipping
    w, h = processed.size
    max_dim = max(w, h)
    # 8% padding
    pad_dim = int(max_dim * 1.12)
    square_canvas = Image.new('RGBA', (pad_dim, pad_dim), (0, 0, 0, 0))
    offset = ((pad_dim - w) // 2, (pad_dim - h) // 2)
    square_canvas.paste(processed, offset)

    # Resize to target size
    final_img = square_canvas.resize((target_size, target_size), Image.Resampling.LANCZOS)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final_img.save(output_path, format='PNG')
    print(f"Processed: {input_path} -> {output_path} ({final_img.size})")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python process_asset.py <input_img> <output_png> [target_size]")
        sys.exit(1)
    
    in_file = sys.argv[1]
    out_file = sys.argv[2]
    size = int(sys.argv[3]) if len(sys.argv) > 3 else 128
    make_transparent_and_center(in_file, out_file, size)
