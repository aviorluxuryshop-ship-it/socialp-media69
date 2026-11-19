#!/usr/bin/env bash
# Download OpenStreetMap extracts around Tüpraş Stadyumu into $1/osm (raw data, not committed).
# Uses the main API's /map call in small tiles (Overpass was not reachable from the build box).
set -euo pipefail
RAW=${1:-.raw}
mkdir -p "$RAW/osm/tiles"
python3 -I - "$RAW" <<'PY' > "$RAW/osm/tiles/list.txt"
import sys
lon0,lon1,lat0,lat1=28.984,29.030,41.026,41.050
nx,ny=8,5
for i in range(nx):
  for j in range(ny):
    a=lon0+(lon1-lon0)*i/nx; b=lon0+(lon1-lon0)*(i+1)/nx
    c=lat0+(lat1-lat0)*j/ny; d=lat0+(lat1-lat0)*(j+1)/ny
    print(f"t_{i}_{j} {a:.5f},{c:.5f},{b:.5f},{d:.5f}")
PY
while read -r name bbox; do
  [ -s "$RAW/osm/tiles/$name.osm" ] && continue
  curl -sf -m 120 -o "$RAW/osm/tiles/$name.osm" "https://api.openstreetmap.org/api/0.6/map?bbox=$bbox"
  echo "$name ok"; sleep 1
done < "$RAW/osm/tiles/list.txt"
# 15 Temmuz Şehitler Köprüsü deck
curl -sf -m 120 -o "$RAW/osm/bridge.osm" "https://api.openstreetmap.org/api/0.6/map?bbox=29.030,41.042,29.040,41.050"
echo done
