#!/bin/bash
# Generate icons from PNG with dark background
# Usage: bash scripts/generate-icons.sh

set -e

PNG=".github/assets/runi.png"
ICON_DIR="src-tauri/icons"
BG_COLOR="#0a0a0a"  # Brand dark background (--color-bg-app)

mkdir -p "$ICON_DIR"

echo "🔄 Generating icons from PNG with dark background..."

# Get source PNG dimensions
if command -v identify &> /dev/null; then
  DIMENSIONS=$(identify -format "%wx%h" "$PNG")
  WIDTH=$(echo "$DIMENSIONS" | cut -d'x' -f1)
  HEIGHT=$(echo "$DIMENSIONS" | cut -d'x' -f2)
else
  WIDTH=$(magick identify -format "%w" "$PNG" 2>/dev/null)
  HEIGHT=$(magick identify -format "%h" "$PNG" 2>/dev/null)
fi

echo "  Source: ${WIDTH}x${HEIGHT}"

# Generate each icon size
for size in 32 128 256 512; do
  echo "  Creating ${size}x${size}..."
  
  # Calculate scaled dimensions (maintain aspect ratio, fit to height)
  # Integer math: scaled_w = WIDTH * size / HEIGHT (fit to height), centered horizontally
  scaled_w=$(( WIDTH * size / HEIGHT ))
  x_offset=$(( (size - scaled_w) / 2 ))
  
  # Create square canvas with dark background, then composite resized PNG on top
  # Force 8-bit RGBA format (required by Tauri) using -depth 8 and -type TrueColorMatte
  if command -v magick &> /dev/null; then
    magick -size ${size}x${size} xc:"$BG_COLOR" \
      \( "$PNG" -resize ${scaled_w}x${size} -alpha on -depth 8 \) \
      -geometry +${x_offset}+0 -compose Over -composite \
      -alpha on -type TrueColorMatte -depth 8 \
      "$ICON_DIR/${size}x${size}.png"
  else
    convert -size ${size}x${size} xc:"$BG_COLOR" \
      \( "$PNG" -resize ${scaled_w}x${size} -alpha on -depth 8 \) \
      -geometry +${x_offset}+0 -compose Over -composite \
      -alpha on -type TrueColorMatte -depth 8 \
      "$ICON_DIR/${size}x${size}.png"
  fi
done

# Rename 256x256 to 128x128@2x and 512x512 to icon.png
mv "$ICON_DIR/256x256.png" "$ICON_DIR/128x128@2x.png"
mv "$ICON_DIR/512x512.png" "$ICON_DIR/icon.png"

# Create ICO with multiple sizes
echo "  Creating icon.ico..."
if command -v magick &> /dev/null; then
  magick "$ICON_DIR/icon.png" -define icon:auto-resize=256,128,64,32,16 "$ICON_DIR/icon.ico"
else
  convert "$ICON_DIR/icon.png" -define icon:auto-resize=256,128,64,32,16 "$ICON_DIR/icon.ico"
fi

echo ""
echo "✅ Icons generated successfully!"
echo "   - Dark background (#0a0a0a) matching brand theme"
echo "   - Proper aspect ratio (no squishing)"
echo "   - Icon centered in square canvas"
echo "   - 8-bit RGBA format (required by Tauri)"
echo ""
echo "📦 Icon files:"
ls -lh "$ICON_DIR"/*.{png,ico} 2>/dev/null | awk '{printf "   %s\n", $9}'
