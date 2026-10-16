// Flying cars in the haze: pairs of headlights (or tail lights) gliding on
// random curved paths. Nearer cars are bigger, brighter and faster.
export function startSpinners(canvas, { still = false } = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const host = canvas.parentElement;
  let w = 0;
  let h = 0;
  let cars = [];
  let running = false;
  let last = 0;

  // Pre-drawn glow sprites, so each frame is cheap.
  const sprite = (inner, mid) => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.12, inner);
    grad.addColorStop(0.4, mid);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return c;
  };
  const GLOW = {
    head: sprite('rgba(225, 238, 255, 1)', 'rgba(120, 170, 255, 0.25)'),
    tail: sprite('rgba(255, 70, 50, 1)', 'rgba(255, 40, 30, 0.22)'),
    nav: sprite('rgba(120, 230, 255, 1)', 'rgba(80, 200, 240, 0.2)'),
  };

  const rand = (a, b) => a + Math.random() * (b - a);

  function newCar(anywhere) {
    const depth = Math.random() ** 1.6; // most cars are far away
    const leftToRight = Math.random() < 0.5;
    const band = [h * 0.12, h * 0.62];
    const y0 = rand(...band);
    const y3 = rand(...band);
    const x0 = leftToRight ? -60 : w + 60;
    const x3 = leftToRight ? w + 60 : -60;
    // Two control points pull the path into a lazy S, dip or climb.
    const swing = h * rand(0.05, 0.25) * (Math.random() < 0.5 ? -1 : 1);
    const car = {
      p: [
        [x0, y0],
        [x0 + (x3 - x0) * rand(0.2, 0.4), y0 + swing],
        [x0 + (x3 - x0) * rand(0.6, 0.8), y3 - swing * rand(0.3, 1)],
        [x3, y3],
      ],
      depth,
      speed: 26 + depth * 150, // px per second along the path
      size: 0.6 + depth * 2.4,
      tail: Math.random() < 0.35, // seen from behind
      blink: Math.random() < 0.5,
      phase: Math.random() * Math.PI * 2,
      t: anywhere ? Math.random() : 0,
      delay: anywhere ? 0 : rand(0, 6),
    };
    car.len = Math.hypot(x3 - x0, y3 - y0) * 1.15;
    return car;
  }

  function bezier(p, t) {
    const u = 1 - t;
    const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return [
      a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0],
      a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1],
    ];
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = host.getBoundingClientRect();
    if (Math.round(r.width) === w && Math.abs(r.height - h) < 120 && cars.length) return;
    w = Math.round(r.width);
    h = Math.round(r.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(6, Math.min(18, Math.round(w / 85)));
    cars = Array.from({ length: count }, () => newCar(true));
    if (still) draw(0);
  }

  function light(img, x, y, r, alpha) {
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
  }

  function draw(now) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (const car of cars) {
      if (car.delay > 0) continue;
      const [x, y] = bezier(car.p, car.t);
      const [nx, ny] = bezier(car.p, Math.min(car.t + 0.01, 1));
      const ang = Math.atan2(ny - y, nx - x);
      // The two lights sit side by side, across the direction of travel (foreshortened).
      const gap = car.size * 2.2;
      const ox = -Math.sin(ang) * gap * 0.35 + Math.cos(ang) * gap * 0.25;
      const oy = Math.cos(ang) * gap * 0.35 * 0.4;
      const img = car.tail ? GLOW.tail : GLOW.head;
      const r = car.size * 7;
      const alpha = 0.35 + car.depth * 0.6;
      light(img, x - ox, y - oy, r, alpha);
      light(img, x + ox, y + oy, r, alpha);
      if (car.blink && Math.sin(now / 260 + car.phase) > 0.85) {
        light(GLOW.nav, x, y - car.size * 3, car.size * 5, 0.8);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      if (car.delay > 0) { car.delay -= dt; continue; }
      car.t += (car.speed * dt) / car.len;
      if (car.t >= 1) cars[i] = newCar(false);
    }
    draw(now);
    requestAnimationFrame(frame);
  }

  function setRunning(on) {
    if (still || on === running) return;
    running = on;
    if (on) { last = performance.now(); requestAnimationFrame(frame); }
  }

  resize();
  new ResizeObserver(resize).observe(host);
  // Only animate while the opening screen is on screen.
  new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting)).observe(host);
}
