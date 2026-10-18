#!/usr/bin/env python3
"""Generate the night-city skyline layers (SVG) with a 3D look.

Each tower is drawn in oblique projection: a front face, a lit top and a shadowed
side face, so it reads as a block rather than a flat cutout. Towers can have stepped
setbacks, lit window grids, glowing neon signs and blinking rooftop beacons.

    python3 tools/city.py assets
"""
import random
import sys

OUT = sys.argv[1] if len(sys.argv) > 1 else 'assets'
W = 1600
NEON = ['#ff3b5c', '#ff5fae', '#4fd8e8', '#b07cff', '#ffb347']


def mix(hex_a, hex_b, t):
    a = [int(hex_a[i:i + 2], 16) for i in (1, 3, 5)]
    b = [int(hex_b[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(x + (y - x) * t):02x}' for x, y in zip(a, b))


def block(r, out, x, y, w, H, d, base, windows, win_p):
    """One extruded box from (x, y) down to the ground H, depth d (side goes up-right)."""
    dy = d * 0.45
    side = mix(base, '#000000', 0.45)
    top = mix(base, '#6f8fd0', 0.35)
    out.append(f'<polygon points="{x + w:.0f},{y:.0f} {x + w + d:.0f},{y - dy:.0f} {x + w + d:.0f},{H} {x + w:.0f},{H}" fill="{side}"/>')
    out.append(f'<polygon points="{x:.0f},{y:.0f} {x + d:.0f},{y - dy:.0f} {x + w + d:.0f},{y - dy:.0f} {x + w:.0f},{y:.0f}" fill="{top}"/>')
    out.append(f'<rect x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{H - y:.0f}" fill="{base}"/>')
    # thin vertical seams on the side face sell the depth
    for k in range(1, 4):
        sx = x + w + d * k / 4
        out.append(f'<line x1="{sx:.1f}" y1="{y - dy * k / 4:.1f}" x2="{sx:.1f}" y2="{H}" stroke="{mix(side, "#000000", .3)}" stroke-width="1"/>')
    if windows is not None:
        for wy in range(int(y) + 10, H - 8, 11):
            for wx in range(int(x) + 6, int(x + w) - 6, 9):
                if r.random() < win_p:
                    a = r.random()
                    col = '#ffd9a8' if a < .55 else ('#a8d8ff' if a < .93 else '#ff4a62')
                    op = .45 + .5 * r.random()
                    if r.random() < .12:
                        dur = r.uniform(3, 9)
                        out.append(f'<rect x="{wx}" y="{wy}" width="4" height="3" fill="{col}" opacity="{op:.2f}"><animate attributeName="opacity" values="{op:.2f};{op:.2f};0.04;{op:.2f}" keyTimes="0;0.7;0.8;1" dur="{dur:.1f}s" begin="-{r.uniform(0, dur):.1f}s" repeatCount="indefinite"/></rect>')
                    else:
                        out.append(f'<rect x="{wx}" y="{wy}" width="4" height="3" fill="{col}" opacity="{op:.2f}"/>')
    return y - dy


def tower(r, out, wins, signs, beacons, x, H, w, h, d, base, win_p, neon_p, beacon_p):
    y = H - h
    roof = block(r, out, x, y, w, H, d, base, wins, win_p)
    top_x, top_y = x + w / 2 + d / 2, roof
    # stepped setbacks
    cw, cx, cy = w, x, y
    for _ in range(r.choice([0, 0, 1, 1, 2])):
        nw = cw * r.uniform(.5, .75)
        cx = cx + (cw - nw) * r.uniform(.2, .8)
        cw = nw
        nh = h * r.uniform(.08, .2)
        cy = cy - nh
        roof = block(r, out, cx, cy, cw, int(cy + nh), d * .8, base, wins, win_p)
        top_x, top_y = cx + cw / 2 + d * .4, roof
    # antenna
    if r.random() < .35:
        ah = r.uniform(25, 70)
        out.append(f'<rect x="{top_x - 1:.0f}" y="{top_y - ah:.0f}" width="2" height="{ah:.0f}" fill="{mix(base, "#000000", .2)}"/>')
        top_y -= ah
    # neon sign on the front face
    if r.random() < neon_p and w > 34 and h > 120:
        sw, sh = r.uniform(10, 18), r.uniform(50, min(140, h * .5))
        sx, sy = x + r.uniform(4, w - sw - 4), y + r.uniform(12, max(13, h * .3))
        col = r.choice(NEON)
        g = f'<g filter="url(#glow)"><rect x="{sx:.0f}" y="{sy:.0f}" width="{sw:.0f}" height="{sh:.0f}" fill="#05040a" stroke="{col}" stroke-width="1.6"/>'
        for k in range(int(sh // 14)):  # glyph-like strokes, like vertical signage
            gy = sy + 6 + k * 14
            g += f'<rect x="{sx + 3:.0f}" y="{gy:.0f}" width="{sw - 6:.0f}" height="2" fill="{col}"/><rect x="{sx + sw / 2 - 1:.0f}" y="{gy + 3:.0f}" width="2" height="6" fill="{col}"/>'
        if r.random() < .3:
            g += f'<animate attributeName="opacity" values="1;1;.25;1;.6;1" keyTimes="0;.6;.62;.66;.7;1" dur="{r.uniform(4, 9):.1f}s" repeatCount="indefinite"/>'
        out.append(g + '</g>')
    # blinking rooftop beacon
    if r.random() < beacon_p:
        col = '#ff3b4f' if r.random() < .75 else '#7fd3ff'
        dur = r.uniform(1.6, 3.2)
        beg = r.uniform(0, dur)
        out.append(f'<circle cx="{top_x:.0f}" cy="{top_y - 2:.0f}" r="5" fill="{col}" opacity=".25"><animate attributeName="opacity" values="0.06;0.55;0.06" dur="{dur:.1f}s" begin="-{beg:.1f}s" repeatCount="indefinite"/></circle>'
                   f'<circle cx="{top_x:.0f}" cy="{top_y - 2:.0f}" r="1.8" fill="#fff" opacity=".6"><animate attributeName="opacity" values="0.15;1;0.15" dur="{dur:.1f}s" begin="-{beg:.1f}s" repeatCount="indefinite"/></circle>')


def layer(seed, H, base, hmin, hmax, wmin, wmax, depth, win_p, neon_p, beacon_p):
    r = random.Random(seed)
    out, wins, signs, beacons = [], [], [], []  # windows, signs and beacons are drawn inline
    x = -40
    while x < W:
        w = r.uniform(wmin, wmax)
        h = r.uniform(hmin, hmax)
        tower(r, out, wins, signs, beacons, x, H, w, h, depth * r.uniform(.7, 1.2), base, win_p, neon_p, beacon_p)
        x += w + r.uniform(-w * .25, w * .35)
    defs = ('<defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%">'
            '<feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>')
    parts = [defs, ''.join(out)]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" '
            f'preserveAspectRatio="none">{"".join(parts)}</svg>')


def megastructures(seed, H):
    """Far layer: huge stepped pyramids and needle towers fading into the haze."""
    r = random.Random(seed)
    out = []
    for cx in (260, 980, 1420):
        base_w, h = r.uniform(380, 520), r.uniform(300, 400)
        steps = 6
        for i in range(steps):
            t0, t1 = i / steps, (i + 1) / steps
            w0, w1 = base_w * (1 - t0 * .8), base_w * (1 - t1 * .8)
            y0, y1 = H - h * t0, H - h * t1
            shade = mix('#1a3768', '#2f5596', i / steps)
            out.append(f'<polygon points="{cx - w0 / 2:.0f},{y0:.0f} {cx - w1 / 2:.0f},{y1:.0f} {cx + w1 / 2:.0f},{y1:.0f} {cx + w0 / 2:.0f},{y0:.0f}" fill="{shade}"/>')
            out.append(f'<polygon points="{cx:.0f},{y0:.0f} {cx:.0f},{y1:.0f} {cx + w1 / 2:.0f},{y1:.0f} {cx + w0 / 2:.0f},{y0:.0f}" fill="#0f2348" opacity=".45"/>')
            for k in range(3):  # faint lit floors
                ly = y0 - (y0 - y1) * (k + .5) / 3
                lw = w0 - (w0 - w1) * (k + .5) / 3
                out.append(f'<rect x="{cx - lw / 2 + 6:.0f}" y="{ly:.0f}" width="{lw - 12:.0f}" height="1.4" fill="#ffd9a8" opacity="{r.uniform(.15, .35):.2f}"/>')
        out.append(f'<rect x="{cx - 2:.0f}" y="{H - h - 60:.0f}" width="4" height="60" fill="#2f5596"/>')
        out.append(f'<circle cx="{cx:.0f}" cy="{H - h - 62:.0f}" r="3" fill="#ff3b4f"><animate attributeName="opacity" values=".2;1;.2" dur="2.4s" repeatCount="indefinite"/></circle>')
    for nx in (620, 1200, 60):
        nh = r.uniform(380, 470)
        out.append(f'<polygon points="{nx - 16},{H} {nx - 5},{H - nh:.0f} {nx + 5},{H - nh:.0f} {nx + 16},{H}" fill="#24477f"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" '
            f'preserveAspectRatio="none">{"".join(out)}</svg>')


if __name__ == '__main__':
    files = {
        'city-far.svg': megastructures(7, 480),
        'city-mid.svg': layer(21, 380, '#0d1c3a', 130, 340, 50, 120, 22, .05, .45, .5),
        'city-near.svg': layer(42, 280, '#04060d', 90, 250, 70, 170, 30, .07, .3, .65),
    }
    for name, svg in files.items():
        open(f'{OUT}/{name}', 'w').write(svg)
        print(name, len(svg) // 1024, 'KB')
