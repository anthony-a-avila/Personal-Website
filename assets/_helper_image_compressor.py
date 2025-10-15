import os
import random
from PIL import Image

# === CONFIG ===
FOLDER = os.path.dirname(__file__)   # folder where helper.py lives
MAX_SIZE_BYTES = 1_000_000           # 1 MB
TARGET_WIDTH = 1920                  # max width to resize to

# Collect all image files
valid_exts = ('.jpg', '.jpeg', '.png', '.webp')
images = [f for f in os.listdir(FOLDER) if f.lower().endswith(valid_exts)]
total = len(images)

if total == 0:
    print("No images found.")
    exit()

# Generate unique random numbers (no collisions)
unique_nums = random.sample(range(1, total * 10), total)

for i, (filename, rand_num) in enumerate(zip(images, unique_nums), 1):
    path = os.path.join(FOLDER, filename)
    with Image.open(path) as img:
        # Convert PNGs with transparency to RGB
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        # Resize if necessary
        if img.width > TARGET_WIDTH:
            ratio = TARGET_WIDTH / img.width
            new_height = int(img.height * ratio)
            img = img.resize((TARGET_WIDTH, new_height))

        # Save with decreasing quality until under 1 MB
        quality = 85
        temp_path = os.path.join(FOLDER, f"temp_{i}.jpg")
        while True:
            img.save(temp_path, "JPEG", quality=quality, optimize=True)
            size = os.path.getsize(temp_path)
            if size <= MAX_SIZE_BYTES or quality <= 30:
                break
            quality -= 5

    # Build new name (no collisions)
    new_name = f"{rand_num}.jpg"
    new_path = os.path.join(FOLDER, new_name)

    # Replace old image with the compressed version
    os.remove(path)
    os.rename(temp_path, new_path)

    print(f"✅ {filename} → {new_name} ({size/1024:.0f} KB)")

print(f"\nAll done! {total} images compressed, renamed, and saved in-place.")
