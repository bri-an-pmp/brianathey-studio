# Generates layered brutalist skylines (SVG) for the desert view.
import random, sys
OUT = sys.argv[1]

def building(r, x, base, w, h, body, shade, lit, detail):
    """One brutalist mass: stacked/offset concrete volumes, cantilevers, fins, window recess bands."""
    g = []
    def rect(x0, y0, ww, hh, fill, op=None):
        o = f' opacity="{op:.2f}"' if op is not None else ''
        g.append(f'<rect x="{x0:.0f}" y="{y0:.0f}" width="{ww:.0f}" height="{hh:.0f}" fill="{fill}"{o}/>')
    kind = r.random()
    vols = []  # (x, y, w, h)
    if kind < 0.3:  # stacked, offset blocks (each floor group shifts)
        y = base; cw = w; cx = x
        for _ in range(r.randint(3, 5)):
            hh = h / r.uniform(3, 5)
            vols.append((cx, y - hh, cw, hh)); y -= hh
            cx += r.uniform(-0.15, 0.15) * w; cw *= r.uniform(0.85, 1.12)
    elif kind < 0.5:  # inverted ziggurat (wider at top) on a narrow core
        core = w * 0.45; vols.append((x + (w - core) / 2, base - h * 0.45, core, h * 0.45))
        y = base - h * 0.45; cw = core
        for _ in range(3):
            cw *= 1.3; hh = h * 0.18
            vols.append((x + (w - cw) / 2, y - hh, cw, hh)); y -= hh
    elif kind < 0.72:  # monolithic slab with a cantilevered top block
        vols.append((x, base - h, w * 0.6, h))
        vols.append((x - w * 0.15, base - h * 1.08, w * 0.95, h * 0.16))
    elif kind < 0.88:  # twin towers joined by a bridge
        tw = w * 0.36
        vols.append((x, base - h, tw, h)); vols.append((x + w - tw, base - h * 0.85, tw, h * 0.85))
        vols.append((x + tw, base - h * 0.7, w - 2 * tw, h * 0.1))
    else:  # squat megablock
        vols.append((x, base - h * 0.55, w * 1.3, h * 0.55))
        vols.append((x + w * 0.2, base - h * 0.75, w * 0.5, h * 0.2))
    for (vx, vy, vw, vh) in vols:
        rect(vx, vy, vw, vh, body)
        if detail:
            rect(vx + vw * 0.82, vy, vw * 0.18, vh, shade, 0.55)          # shadowed side
            rect(vx, vy, vw * 0.06, vh, lit, 0.35)                       # sun-lit edge
            band = r.uniform(9, 16)                                       # window recess bands
            yy = vy + band * 0.8
            while yy < vy + vh - band * 0.6:
                rect(vx + vw * 0.08, yy, vw * 0.72, band * 0.32, shade, 0.5); yy += band
            if r.random() < 0.4:                                          # vertical fins
                for k in range(1, 5):
                    rect(vx + vw * k / 5, vy, 2, vh, shade, 0.35)
    tv=min(vols,key=lambda v:v[1])
    return ''.join(g), (tv[0]+tv[2]/2, tv[1])

def layer(seed, W, H, n, hmin, hmax, wmin, wmax, body, shade, lit, detail, beacons=False):
    r = random.Random(seed); parts = []; x = -60; tops = []
    while x < W:
        w = r.uniform(wmin, wmax); h = r.uniform(hmin, hmax)
        g, top = building(r, x, H, w, h, body, shade, lit, detail)
        parts.append(g); tops.append(top)
        x += w * r.uniform(0.55, 1.2)
    if beacons:  # red aviation lights blinking on the rooftops
        r2 = random.Random(seed * 5 + 3)
        for bx, by in tops:
            if not (0 <= bx <= W): continue
            dur = r2.uniform(1.8, 3.4); beg = r2.uniform(0, dur)
            parts.append(f'<circle cx="{bx:.0f}" cy="{by-3:.0f}" r="9" fill="#ff3b2f" opacity="0.2"><animate attributeName="opacity" values="0.05;0.6;0.05" dur="{dur:.1f}s" begin="-{beg:.1f}s" repeatCount="indefinite"/></circle>')
            parts.append(f'<circle cx="{bx:.0f}" cy="{by-3:.0f}" r="3" fill="#ffd2c0" opacity="0.6"><animate attributeName="opacity" values="0.1;1;0.1" dur="{dur:.1f}s" begin="-{beg:.1f}s" repeatCount="indefinite"/></circle>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" '
            f'preserveAspectRatio="none">{"".join(parts)}</svg>')

files = {
  'dust-far.svg':  layer(5, 1600, 520, 0, 200, 470, 70, 170, '#d98a3c', '#c47430', '#f2b25a', False),
  'dust-mid.svg':  layer(17, 1600, 440, 0, 170, 410, 100, 230, '#a8461c', '#8a3614', '#d8742c', True, beacons=True),
  'dust-near.svg': layer(41, 1600, 380, 0, 150, 360, 150, 320, '#4a160a', '#2c0c05', '#9a3c18', True, beacons=True),
}
for name, svg in files.items():
    open(f'{OUT}/{name}', 'w').write(svg)
    print(name, len(svg))
