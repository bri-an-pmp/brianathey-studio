// Light, slanted rain drawn on a canvas behind the page. Pauses with the tab.
export function startRain(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let drops = [];
  let w = 0;
  let h = 0;
  let last = performance.now();
  const WIND = -0.18;

  function resize() {
    const widthChanged = window.innerWidth !== w;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(220, Math.round((w * h) / 7000));
    // Phones resize while scrolling (address bar); only reseed when the width changes.
    if (widthChanged || !drops.length) drops = Array.from({ length: count }, () => newDrop(true));
  }

  function newDrop(anywhere) {
    const depth = Math.random(); // far drops are smaller, slower, fainter
    return {
      x: Math.random() * (w + 200),
      y: anywhere ? Math.random() * h : -30,
      len: 8 + depth * 18,
      speed: 500 + depth * 700, // px per second
      alpha: 0.06 + depth * 0.16,
    };
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    for (const d of drops) {
      d.y += d.speed * dt;
      d.x += d.speed * WIND * dt;
      if (d.y > h + 30 || d.x < -40) Object.assign(d, newDrop(false));
      ctx.strokeStyle = `rgba(200, 220, 235, ${d.alpha})`;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.len * WIND, d.y - d.len);
      ctx.stroke();
    }
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
}
