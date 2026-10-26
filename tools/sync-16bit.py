#!/usr/bin/env python3
"""Copies the shared sections of the main page into the 16-Bit Zone page, so every theme shows
the same, current content. Blocks are marked in index.html with <!-- SHARE:name --> … <!-- /SHARE:name -->
and land in 16-bit/index.html between <!-- SYNC:name --> … <!-- /SYNC:name -->.
Runs automatically from tools/stamp.py. Usage: python3 tools/sync-16bit.py [main_dir] [zone_dir]"""
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
main_dir = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root
zone_dir = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else root / '16-bit'

main = (main_dir / 'index.html').read_text()
zone_file = zone_dir / 'index.html'
zone = zone_file.read_text()

blocks = {m.group(1): m.group(2) for m in re.finditer(r'<!-- SHARE:([\w-]+)[^>]*-->\n(.*?)\n\s*<!-- /SHARE:\1 -->', main, re.S)}


def adapt(html):
    # the 16-bit page lives one folder down, and its top is #title
    html = re.sub(r'(src|href)="assets/', r'\1="../assets/', html)
    html = html.replace('href="#top"', 'href="#title"')
    # the 16-bit page has no file-opening animation; plain anchors are enough
    return re.sub(r' data-file="[\w-]+"', '', html)


missing, synced = [], []
for name in re.findall(r'<!-- SYNC:([\w-]+) -->', zone):
    if name not in blocks:
        missing.append(name)
        continue
    pattern = re.compile(rf'(<!-- SYNC:{name} -->)(.*?)([ \t]*<!-- /SYNC:{name} -->)', re.S)
    zone, n = pattern.subn(lambda m: m.group(1) + '\n' + adapt(blocks[name]) + '\n' + m.group(3), zone)
    if n != 1:
        missing.append(f'{name} (marker problem in 16-bit page)')
        continue
    synced.append(name)

# Music players allowed on the main page must also be allowed here
frame = re.search(r'frame-src ([^;]+);', main)
if frame:
    zone = re.sub(r'frame-src [^;]+;', f'frame-src {frame.group(1)};', zone)

zone_file.write_text(zone)
print('synced 16-bit:', ', '.join(synced) or 'nothing', '| missing in main page:', ', '.join(missing) or 'none')
if missing:
    sys.exit(1)
