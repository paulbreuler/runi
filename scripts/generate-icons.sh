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

# Generate .icns file for macOS (required for rounded corners)
if [[ "$OSTYPE" == "darwin"* ]] && command -v iconutil &> /dev/null; then
  echo "  Creating icon.icns for macOS..."
  ICONSET="$ICON_DIR/icon.iconset"
  mkdir -p "$ICONSET"
  
  # Create required iconset sizes from existing PNGs
  # 16x16 (use 32x32 scaled down)
  if command -v magick &> /dev/null; then
    magick "$ICON_DIR/32x32.png" -resize 16x16 "$ICONSET/icon_16x16.png"
    cp "$ICON_DIR/32x32.png" "$ICONSET/icon_16x16@2x.png"
    cp "$ICON_DIR/32x32.png" "$ICONSET/icon_32x32.png"
    magick "$ICON_DIR/128x128.png" -resize 64x64 "$ICONSET/icon_32x32@2x.png"
    cp "$ICON_DIR/128x128.png" "$ICONSET/icon_128x128.png"
    cp "$ICON_DIR/128x128@2x.png" "$ICONSET/icon_128x128@2x.png"
    magick "$ICON_DIR/icon.png" -resize 256x256 "$ICONSET/icon_256x256.png"
    cp "$ICON_DIR/icon.png" "$ICONSET/icon_256x256@2x.png"
    # Create 1024x1024 for 512x512@2x
    magick "$ICON_DIR/icon.png" -resize 1024x1024 "$ICONSET/icon_512x512@2x.png"
    cp "$ICON_DIR/icon.png" "$ICONSET/icon_512x512.png"
  else
    convert "$ICON_DIR/32x32.png" -resize 16x16 "$ICONSET/icon_16x16.png"
    cp "$ICON_DIR/32x32.png" "$ICONSET/icon_16x16@2x.png"
    cp "$ICON_DIR/32x32.png" "$ICONSET/icon_32x32.png"
    convert "$ICON_DIR/128x128.png" -resize 64x64 "$ICONSET/icon_32x32@2x.png"
    cp "$ICON_DIR/128x128.png" "$ICONSET/icon_128x128.png"
    cp "$ICON_DIR/128x128@2x.png" "$ICONSET/icon_128x128@2x.png"
    convert "$ICON_DIR/icon.png" -resize 256x256 "$ICONSET/icon_256x256.png"
    cp "$ICON_DIR/icon.png" "$ICONSET/icon_256x256@2x.png"
    # Create 1024x1024 for 512x512@2x
    convert "$ICON_DIR/icon.png" -resize 1024x1024 "$ICONSET/icon_512x512@2x.png"
    cp "$ICON_DIR/icon.png" "$ICONSET/icon_512x512.png"
  fi
  
  # Generate .icns from iconset
  iconutil -c icns "$ICONSET" -o "$ICON_DIR/icon.icns"
  rm -rf "$ICONSET"
  echo "  ✅ icon.icns created successfully"
elif [[ "$OSTYPE" == "darwin"* ]]; then
  echo "  ⚠️  iconutil not found, skipping .icns generation"
fi

echo ""
echo "✅ Icons generated successfully!"
echo "   - Dark background (#0a0a0a) matching brand theme"
echo "   - Proper aspect ratio (no squishing)"
echo "   - Icon centered in square canvas"
echo "   - 8-bit RGBA format (required by Tauri)"
if [ -f "$ICON_DIR/icon.icns" ]; then
  echo "   - .icns file generated for macOS rounded corners"
fi
echo ""
echo "📦 Icon files:"
ls -lh "$ICON_DIR"/*.{png,ico,icns} 2>/dev/null | awk '{printf "   %s\n", $9}'
