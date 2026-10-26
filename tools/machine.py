#!/usr/bin/env python3
"""Draws assets/machine.svg: a tileable panel of dark gunmetal machinery (plates, rivets,
vents, cables, bolts, seams and a few red indicator lights) for the Thermal theme.
Original artwork, generated procedurally. Run: python3 tools/machine.py [seed]"""
import random, sys, pathlib

SEED = int(sys.argv[1]) if len(sys.argv) > 1 else 27
W = H = 960      # tile size; plate edges sit on a 40 px grid so the tile repeats cleanly
G = 40
rnd = random.Random(SEED)
out = []
add = out.append

add(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">')
add('<defs>'
    '<linearGradient id="p0" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1d2024"/><stop offset="1" stop-color="#0c0d0f"/></linearGradient>'
    '<linearGradient id="p1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#17191c"/><stop offset="1" stop-color="#08090a"/></linearGradient>'
    '<linearGradient id="p2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22252a"/><stop offset=".5" stop-color="#121417"/><stop offset="1" stop-color="#0a0b0c"/></linearGradient>'
    '<linearGradient id="pipe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2f35"/><stop offset=".35" stop-color="#121417"/><stop offset="1" stop-color="#050506"/></linearGradient>'
    '<radialGradient id="rv" cx=".35" cy=".35" r=".75"><stop offset="0" stop-color="#5a6068"/><stop offset=".45" stop-color="#23262b"/><stop offset="1" stop-color="#070708"/></radialGradient>'
    '<radialGradient id="led" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff6a5a"/><stop offset=".4" stop-color="#ff1a1a"/><stop offset="1" stop-color="#ff1a1a" stop-opacity="0"/></radialGradient>'
    '<filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
    '</defs>')
add(f'<rect width="{W}" height="{H}" fill="#060607"/>')


def split(x, y, w, h, depth=0):
    """Recursively cut the tile into plates along the grid."""
    big = w > 6 * G or h > 6 * G
    if not big and (depth > 6 or (w <= 3 * G and h <= 3 * G) or (depth > 2 and rnd.random() < 0.12)):
        return [(x, y, w, h)]
    vertical = w > h if abs(w - h) > 2 * G else rnd.random() < 0.5
    span = w if vertical else h
    cuts = [c for c in range(2 * G, span - 2 * G + 1, G)]
    if not cuts:
        return [(x, y, w, h)]
    c = rnd.choice(cuts)
    if vertical:
        return split(x, y, c, h, depth + 1) + split(x + c, y, w - c, h, depth + 1)
    return split(x, y, w, c, depth + 1) + split(x, y + c, w, h - c, depth + 1)


def rivet(cx, cy, r=4.5):
    add(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r + 1.5:.1f}" fill="#030303" opacity=".8"/>'
        f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="url(#rv)"/>')


def vents(x, y, w, h):
    n = max(3, int(w // 18))
    gap = w / n
    for i in range(n):
        add(f'<rect x="{x + i * gap + 3:.1f}" y="{y:.1f}" width="{gap - 7:.1f}" height="{h:.1f}" rx="{(gap - 7) / 2:.1f}" fill="#020202" stroke="#26292e" stroke-width="1"/>')


def bolt(cx, cy, r):
    pts = " ".join(f"{cx + r * __import__('math').cos(a * 3.14159 / 3):.1f},{cy + r * __import__('math').sin(a * 3.14159 / 3):.1f}" for a in range(6))
    add(f'<polygon points="{pts}" fill="url(#rv)" stroke="#030303" stroke-width="1.5"/><circle cx="{cx}" cy="{cy}" r="{r * .35:.1f}" fill="#08090a"/>')


plates = split(0, 0, W, H)
for (x, y, w, h) in plates:
    inset = 3
    px, py, pw, ph = x + inset, y + inset, w - 2 * inset, h - 2 * inset
    grad = rnd.choice(['p0', 'p1', 'p1', 'p2'])
    cut = min(18, pw / 6, ph / 6)  # chamfered corners
    path = (f'M{px + cut:.1f} {py:.1f} H{px + pw - cut:.1f} L{px + pw:.1f} {py + cut:.1f} V{py + ph - cut:.1f} '
            f'L{px + pw - cut:.1f} {py + ph:.1f} H{px + cut:.1f} L{px:.1f} {py + ph - cut:.1f} V{py + cut:.1f} Z')
    add(f'<path d="{path}" fill="url(#{grad})" stroke="#000" stroke-width="2"/>')
    # bevel: light along the top-left, shadow along the bottom-right
    add(f'<path d="M{px + cut:.1f} {py + 1.5:.1f} H{px + pw - cut:.1f} M{px + 1.5:.1f} {py + cut:.1f} V{py + ph - cut:.1f}" stroke="#3a3f46" stroke-width="1.2" opacity=".7"/>')
    add(f'<path d="M{px + cut:.1f} {py + ph - 1.5:.1f} H{px + pw - cut:.1f} M{px + pw - 1.5:.1f} {py + cut:.1f} V{py + ph - cut:.1f}" stroke="#000" stroke-width="1.5" opacity=".9"/>')
    # rivets near the corners of larger plates
    if pw > 90 and ph > 90:
        for cx, cy in [(px + 14, py + 14), (px + pw - 14, py + 14), (px + 14, py + ph - 14), (px + pw - 14, py + ph - 14)]:
            rivet(cx, cy)
    # one or two features per plate
    # wear: a few faint scratches on every plate
    for _ in range(rnd.randint(2, 6)):
        sx, sy = px + rnd.uniform(.1, .9) * pw, py + rnd.uniform(.1, .9) * ph
        add(f'<path d="M{sx:.1f} {sy:.1f} l{rnd.uniform(-30, 30):.1f} {rnd.uniform(-8, 8):.1f}" stroke="#8a929c" stroke-width=".5" opacity="{rnd.uniform(.06, .18):.2f}"/>')
    for _ in range(rnd.choice([2, 2, 3])):
        kind = rnd.choice(['vents', 'groove', 'inset', 'bolts', 'pipe', 'pipe', 'led', 'led', 'trace', 'greeble', 'greeble', 'screen', 'buttons'])
        if kind == 'vents' and pw > 120 and ph > 70:
            vw = min(pw - 50, rnd.randint(80, 240)); vh = min(ph - 40, rnd.randint(20, 60))
            vents(px + (pw - vw) / 2, py + (ph - vh) / 2, vw, vh)
        elif kind == 'groove':
            for i in range(rnd.randint(2, 5)):
                gy = py + 24 + i * 9
                if gy < py + ph - 20:
                    add(f'<path d="M{px + 26:.1f} {gy:.1f} H{px + pw - 26:.1f}" stroke="#020202" stroke-width="3"/><path d="M{px + 26:.1f} {gy + 1.6:.1f} H{px + pw - 26:.1f}" stroke="#2c3036" stroke-width=".8"/>')
        elif kind == 'inset' and pw > 110 and ph > 90:
            iw, ih = pw * rnd.uniform(.4, .7), ph * rnd.uniform(.35, .6)
            ix, iy = px + (pw - iw) / 2, py + (ph - ih) / 2
            add(f'<rect x="{ix:.1f}" y="{iy:.1f}" width="{iw:.1f}" height="{ih:.1f}" rx="5" fill="#050506" stroke="#2a2d32" stroke-width="1.5"/>'
                f'<rect x="{ix + 4:.1f}" y="{iy + 4:.1f}" width="{iw - 8:.1f}" height="{ih - 8:.1f}" rx="3" fill="url(#p1)" opacity=".6"/>')
        elif kind == 'bolts' and pw > 80:
            for i in range(rnd.randint(2, 4)):
                bolt(px + 30 + i * 26, py + ph - 30, 7)
        elif kind == 'pipe' and pw > 110:
            yy = py + rnd.uniform(.3, .7) * ph
            add(f'<path d="M{px + 10:.1f} {yy:.1f} C{px + pw * .3:.1f} {yy - 30:.1f} {px + pw * .7:.1f} {yy + 30:.1f} {px + pw - 10:.1f} {yy:.1f}" stroke="#000" stroke-width="15" fill="none" stroke-linecap="round"/>'
                f'<path d="M{px + 10:.1f} {yy:.1f} C{px + pw * .3:.1f} {yy - 30:.1f} {px + pw * .7:.1f} {yy + 30:.1f} {px + pw - 10:.1f} {yy:.1f}" stroke="url(#pipe)" stroke-width="11" fill="none" stroke-linecap="round"/>'
                f'<path d="M{px + 10:.1f} {yy - 3:.1f} C{px + pw * .3:.1f} {yy - 33:.1f} {px + pw * .7:.1f} {yy + 27:.1f} {px + pw - 10:.1f} {yy - 3:.1f}" stroke="#41464d" stroke-width="1.2" fill="none" opacity=".6"/>')
        elif kind == 'led' and rnd.random() < .55:
            lx, ly = px + rnd.uniform(.2, .8) * pw, py + rnd.uniform(.2, .8) * ph
            add(f'<circle cx="{lx:.1f}" cy="{ly:.1f}" r="9" fill="url(#led)" opacity=".55"/><circle cx="{lx:.1f}" cy="{ly:.1f}" r="2.4" fill="#ff3b30"/>')
        elif kind == 'greeble' and pw > 60 and ph > 50:
            gx, gy = px + rnd.uniform(.15, .55) * pw, py + rnd.uniform(.15, .55) * ph
            for i in range(rnd.randint(3, 7)):
                bw, bh = rnd.randint(8, 30), rnd.randint(6, 18)
                add(f'<rect x="{gx + rnd.uniform(-10, 40):.1f}" y="{gy + i * 9:.1f}" width="{bw}" height="{bh}" rx="1.5" fill="{rnd.choice(["#0b0c0e", "#1a1d21", "#25292e"])}" stroke="#000" stroke-width="1"/>')
        elif kind == 'screen' and pw > 120 and ph > 80:
            sw_, sh_ = min(pw - 50, rnd.randint(60, 140)), min(ph - 40, rnd.randint(24, 44))
            sx, sy = px + (pw - sw_) / 2, py + (ph - sh_) / 2
            add(f'<rect x="{sx:.1f}" y="{sy:.1f}" width="{sw_}" height="{sh_}" rx="3" fill="#020202" stroke="#2c3036" stroke-width="2"/>')
            for i in range(int(sw_ // 16)):
                if rnd.random() < .6:
                    add(f'<rect x="{sx + 6 + i * 16:.1f}" y="{sy + sh_ / 2 - 2:.1f}" width="10" height="4" rx="2" fill="#ff1a1a" opacity="{rnd.uniform(.25, .7):.2f}" filter="url(#glow)"/>')
        elif kind == 'buttons' and pw > 90:
            bx, by = px + 22, py + rnd.uniform(.3, .8) * ph
            for i in range(rnd.randint(2, 5)):
                add(f'<circle cx="{bx + i * 18:.1f}" cy="{by:.1f}" r="6" fill="#050506" stroke="#30343a" stroke-width="1.5"/><circle cx="{bx + i * 18 - 1:.1f}" cy="{by - 1:.1f}" r="3" fill="{"#7a0d0d" if rnd.random() < .3 else "#1c1f23"}"/>')
        elif kind == 'trace' and rnd.random() < .45:
            tx, ty = px + 20, py + rnd.uniform(.3, .8) * ph
            seg = f'M{tx:.1f} {ty:.1f} h{pw * .25:.1f} l14 -14 h{pw * .3:.1f}'
            add(f'<path d="{seg}" stroke="#ff1a1a" stroke-width="1.4" fill="none" opacity=".35" filter="url(#glow)"/>')

# panel seams across the tile edges, so repeated tiles join on a seam
add(f'<rect x="0" y="0" width="{W}" height="{H}" fill="none" stroke="#000" stroke-width="4"/>')
add('</svg>')
path = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'machine.svg'
path.write_text(''.join(out))
print(f'wrote {path} ({path.stat().st_size // 1024} KB, {len(plates)} plates)')
