#!/bin/bash
# Turn a folder of photos into a web gallery.
#   tools/add-album.sh "Santiago de Chile"
# Reads photo-inbox/<name>/, writes assets/photos/<slug>/01.jpg + 01-thumb.jpg ...
# (resized, no camera or GPS data) and prints a starter entry for js/albums.js.
set -euo pipefail
cd "$(dirname "$0")/.."
NAME="${1:?Give the gallery name, e.g. tools/add-album.sh \"Santiago de Chile\"}"
SRC="photo-inbox/$NAME"
[ -d "$SRC" ] || { echo "No folder named \"$SRC\". Create it and copy the photos in."; exit 1; }
SLUG=$(python3 -c 'import sys,unicodedata,re;s=unicodedata.normalize("NFD",sys.argv[1]);s="".join(c for c in s if not unicodedata.combining(c));print(re.sub(r"[^a-z0-9]+","-",s.lower()).strip("-"))' "$NAME")
OUT="assets/photos/$SLUG"
[ -e "$OUT" ] && { echo "$OUT already exists. Remove it first if you want to rebuild this gallery."; exit 1; }
BIN="${TMPDIR:-/tmp}/bas-resize"
[ -x "$BIN" ] && [ "$BIN" -nt tools/resize.swift ] || swiftc -O tools/resize.swift -o "$BIN"
mkdir -p "$OUT"
n=0; entries=""
# oldest first by capture/modification time, so the gallery reads in order
while IFS= read -r f; do
  n=$((n+1)); id=$(printf %02d $n)
  read -r w h <<<"$("$BIN" "$f" "$OUT/$id.jpg" 1800 0.7)"
  read -r tw th <<<"$("$BIN" "$f" "$OUT/$id-thumb.jpg" 560 0.66)"
  entries+="      { w: $w, h: $h, tw: $tw, th: $th, en: 'TODO', es: 'TODO' }, // $(basename "$f")"$'\n'
  echo "  $id  ${w}x${h}  $(basename "$f")"
done < <(find "$SRC" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.heic' -o -iname '*.png' \) -print0 | xargs -0 stat -f '%m %N' | sort -n | cut -d' ' -f2-)
[ $n -gt 0 ] || { rmdir "$OUT"; echo "No photos found in $SRC"; exit 1; }
echo
echo "$n photos written to $OUT ($(du -sh "$OUT" | cut -f1))."
echo "Starter entry for js/albums.js:"
cat <<ENTRY
  {
    id: '$SLUG',
    title: { en: '$NAME', es: '$NAME' },
    subtitle: { en: 'TODO', es: 'TODO' },
    cover: 1,
    preview: [1, 2, 3, 4, 5, 6],
    photos: [
$entries    ],
  },
ENTRY
