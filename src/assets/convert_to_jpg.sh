#!/bin/zsh

# Compression quality (1–100, higher = better quality, larger file)
QUALITY=85

for img in *.png; do
  # Skip if no .png files exist
  [[ -e "$img" ]] || continue

  # Remove extension and add .jpg
  base="${img:r}"
  out="$base.jpg"

  echo "Converting $img → $out (quality $QUALITY)..."
  convert "$img" -quality $QUALITY "$out"
done

echo "✅ Conversion complete!"
