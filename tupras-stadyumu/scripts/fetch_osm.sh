#!/usr/bin/env bash
# Download OpenStreetMap extracts around Tüpraş Stadyumu into $1/osm (raw data, not committed).
# Uses the main API's /map call in small tiles (Overpass was not reachable from the build box).
# Area: Taksim / Harbiye / Cihangir in the west, Yıldız in the north, Tophane in the south and
# the Üsküdar shore across the Bosphorus — wide enough that streets run on past every view.
# A tile the API refuses (over 50 000 nodes) is split in four and fetched again.
set -uo pipefail
RAW=${1:-.raw}
mkdir -p "$RAW/osm/tiles"
python3 -I - > "$RAW/osm/tiles/list.txt" <<'PY'
lon0,lon1,lat0,lat1=28.966,29.042,41.018,41.062
nx,ny=13,9
for i in range(nx):
  for j in range(ny):
    a=lon0+(lon1-lon0)*i/nx; b=lon0+(lon1-lon0)*(i+1)/nx
    c=lat0+(lat1-lat0)*j/ny; d=lat0+(lat1-lat0)*(j+1)/ny
    print(f"t_{i}_{j} {a:.5f} {c:.5f} {b:.5f} {d:.5f}")
PY
fetch() { # name a c b d depth
  local name=$1 a=$2 c=$3 b=$4 d=$5 depth=${6:-0}
  local f="$RAW/osm/tiles/$name.osm"
  [ -s "$f" ] && return 0
  local code
  for try in 1 2 3; do
    code=$(curl -s -m 180 -o "$f.part" -w '%{http_code}' "https://api.openstreetmap.org/api/0.6/map?bbox=$a,$c,$b,$d")
    [ "$code" = 200 ] && { mv "$f.part" "$f"; echo "$name ok $(du -k "$f" | cut -f1) KB"; sleep 1; return 0; }
    [ "$code" = 400 ] && break
    sleep $((try * 5))
  done
  rm -f "$f.part"
  if [ "$code" = 400 ] && [ "$depth" -lt 3 ]; then
    echo "$name too dense, splitting"
    local mx my
    mx=$(python3 -c "print(f'{($a+$b)/2:.6f}')"); my=$(python3 -c "print(f'{($c+$d)/2:.6f}')")
    fetch "${name}a" "$a" "$c" "$mx" "$my" $((depth + 1))
    fetch "${name}b" "$mx" "$c" "$b" "$my" $((depth + 1))
    fetch "${name}c" "$a" "$my" "$mx" "$d" $((depth + 1))
    fetch "${name}d" "$mx" "$my" "$b" "$d" $((depth + 1))
    return 0
  fi
  echo "$name FAILED ($code)"
}
while read -r name a c b d; do
  fetch "$name" "$a" "$c" "$b" "$d"
done < "$RAW/osm/tiles/list.txt"
# 15 Temmuz Şehitler Köprüsü deck
[ -s "$RAW/osm/bridge.osm" ] || curl -sf -m 120 -o "$RAW/osm/bridge.osm" "https://api.openstreetmap.org/api/0.6/map?bbox=29.030,41.042,29.040,41.050"
echo done
