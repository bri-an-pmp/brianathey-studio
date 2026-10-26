#!/usr/bin/env python3
"""Stamp a fresh version on every CSS/JS reference so browsers never mix old and new files.
GitHub Pages lets browsers cache files for 10 minutes; a new ?v= forces a matching set.
Run before every publish:  python3 tools/stamp.py"""
import re, time, pathlib, subprocess, sys
root = pathlib.Path(__file__).resolve().parent.parent
# First copy the shared sections into the 16-Bit Zone page, so every theme is current
subprocess.run([sys.executable, str(root / 'tools' / 'sync-16bit.py')], check=True)
v = time.strftime('%Y%m%d%H%M%S')
html = root / 'index.html'
s = html.read_text()
s = re.sub(r'(href="(?:styles|fonts)\.css)(\?v=\w+)?"', rf'\1?v={v}"', s)
s = re.sub(r'(src="js/main\.js)(\?v=\w+)?"', rf'\1?v={v}"', s)
html.write_text(s)
for js in (root / 'js').glob('*.js'):
    t = js.read_text()
    t2 = re.sub(r"(from '\./[\w-]+\.js)(\?v=\w+)?'", rf"\1?v={v}'", t)
    if t2 != t:
        js.write_text(t2)
# The 16-Bit Zone page: its own files plus the main site's shared modules
zhtml = root / '16-bit' / 'index.html'
z = zhtml.read_text()
z = re.sub(r'(href="(?:styles|fonts)\.css)(\?v=\w+)?"', rf'\1?v={v}"', z)
z = re.sub(r'(src="js/main\.js)(\?v=\w+)?"', rf'\1?v={v}"', z)
zhtml.write_text(z)
for js in (root / '16-bit' / 'js').glob('*.js'):
    t = js.read_text()
    t2 = re.sub(r"(from '(?:\./|\.\./\.\./js/)[\w-]+\.js)(\?v=\w+)?'", rf"\1?v={v}'", t)
    if t2 != t:
        js.write_text(t2)
print('stamped', v)
