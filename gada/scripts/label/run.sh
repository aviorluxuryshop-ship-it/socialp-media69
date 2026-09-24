#!/usr/bin/env bash
# Rebuild the can label textures from the four-view reference sheets.
#
#   bash scripts/label/run.sh
#
# Needs python3 with pillow, numpy and scipy. Writes public/textures/*.webp
# and prints each flavour's layout (frontU and face angles) for data/products.ts.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/../.." && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

cp "$ROOT/media-source/gada-limon-4-gorunum.jpg" "$WORK/lemon.jpg"
cp "$ROOT/media-source/gada-seftali-4-gorunum.jpg" "$WORK/peach.jpg"
cp "$HERE"/*.py "$WORK/"
mkdir -p "$WORK/fonts"
curl -sfL -o "$WORK/fonts/FiraSansCondensed-Bold.ttf" \
  https://raw.githubusercontent.com/google/fonts/main/ofl/firasanscondensed/FiraSansCondensed-Bold.ttf

cd "$WORK"
for n in lemon peach; do
  python3 build_texture.py "$n" > /dev/null
  python3 pack.py "$n" | grep centers
done
python3 repair_peach.py peach_label_raw.png peach_label_fixed.png
cp lemon_label_raw.png lemon_label_fixed.png
for n in lemon peach; do
  python3 despeckle.py "$n" "${n}_label_fixed.png" "${n}_label_clean.png"
  python3 finalize.py "$n" "${n}_label_clean.png"
done
cp lemon-label.webp lemon-label-1k.webp peach-label.webp peach-label-1k.webp "$ROOT/public/textures/"
echo "lemon: $(cat lemon_layout.json)"
echo "peach: $(cat peach_layout.json)"
