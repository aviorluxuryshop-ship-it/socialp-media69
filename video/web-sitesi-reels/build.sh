#!/usr/bin/env bash
# Rebuilds the reel end to end: sound mix -> 60 fps frames -> final MP4.
# Needs: node + playwright (Chromium), python3 + numpy + scipy, ffmpeg.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out final

python3 audio/mix.py
node src/render.js video out/video_60.mp4 60 0 20

ffmpeg -v error -y -i out/video_60.mp4 -i out/mix_raw.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p -movflags +faststart \
  -af "loudnorm=I=-14:TP=-1.2:LRA=11" -ar 48000 -c:a aac -b:a 256k -shortest \
  final/socialp-web-sitesi-reels.mp4

echo "done -> final/socialp-web-sitesi-reels.mp4"
