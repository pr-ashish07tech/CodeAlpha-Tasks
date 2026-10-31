(() => {
  'use strict';

  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SYMBOLS = [
    'π', '∑', '√x', '∫', '∞', 'Δ', 'θ', 'x²', 'eˣ', 'sin x', 'cos x', 'log x', 'a² + b² = c²',
    'f(x)', 'dy/dx', '≈', '≠', '≥', '±', '÷', '×', '%', '7 × 8 = 56', '12 + 30 = 42',
    '√144 = 12', '3.14159', '2.71828', 'n!', '∂', 'λ', 'Σ xᵢ', 'lim x→0',
  ];

  let w = 0, h = 0, dpr = 1;
  let floaters = [];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeFloater(initial) {
    return {
      text: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      x: rand(0, w),
      y: initial ? rand(0, h) : h + 40,
      size: rand(16, 44),
      speed: rand(6, 20),            // px per second upward
      sway: rand(0.2, 0.8),
      phase: rand(0, Math.PI * 2),
      alpha: rand(0.07, 0.17),
      rot: rand(-0.25, 0.25),
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.max(14, Math.round((w * h) / 38000));
    floaters = Array.from({ length: count }, () => makeFloater(true));
    if (reduceMotion) draw(performance.now());   // animated mode redraws on its own loop
  }

  /* ---------- layers ---------- */
  function drawGrid() {
    const step = 28;
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += step) {
      ctx.strokeStyle = (x / step) % 5 === 0 ? 'rgba(40,90,160,.16)' : 'rgba(40,90,160,.07)';
      ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.strokeStyle = (y / step) % 5 === 0 ? 'rgba(40,90,160,.16)' : 'rgba(40,90,160,.07)';
      ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); ctx.stroke();
    }
  }

  function drawAxes(cx, cy) {
    ctx.strokeStyle = 'rgba(30,50,80,.55)';
    ctx.fillStyle = 'rgba(30,50,80,.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    const unit = 56;
    for (let i = -Math.floor(cx / unit); i <= Math.floor((w - cx) / unit); i++) {
      if (!i) continue;
      ctx.beginPath(); ctx.moveTo(cx + i * unit, cy - 4); ctx.lineTo(cx + i * unit, cy + 4); ctx.stroke();
      ctx.fillText(String(i), cx + i * unit, cy + 16);
    }
    ctx.textAlign = 'right';
    for (let j = -Math.floor(cy / unit); j <= Math.floor((h - cy) / unit); j++) {
      if (!j) continue;
      ctx.beginPath(); ctx.moveTo(cx - 4, cy - j * unit); ctx.lineTo(cx + 4, cy - j * unit); ctx.stroke();
      ctx.fillText(String(j), cx - 8, cy - j * unit + 3);
    }
  }

  function plot(fn, cx, cy, color, label, labelX) {
    const unit = 56;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let started = false;
    for (let px = 0; px <= w; px += 3) {
      const y = cy - fn((px - cx) / unit) * unit;
      if (y < -200 || y > h + 200) { started = false; continue; }
      started ? ctx.lineTo(px, y) : ctx.moveTo(px, y);
      started = true;
    }
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = 'italic 15px Georgia, serif';
    ctx.textAlign = 'left';
    const lx = Math.min(w - 110, Math.max(10, labelX));
    const ly = cy - fn((lx - cx) / unit) * unit - 10;
    ctx.fillText(label, lx, Math.min(h - 10, Math.max(20, ly)));
  }

  function drawUnitCircle(cx, cy, t) {
    const r = 56 * 1.5;
    const ox = cx + 56 * 5.2, oy = cy + 56 * 2.6;
    if (ox + r > w || oy + r > h) return;
    ctx.strokeStyle = 'rgba(200,110,20,.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.stroke();
    const a = t * 0.0006;
    const px = ox + Math.cos(a) * r, py = oy - Math.sin(a) * r;
    ctx.strokeStyle = 'rgba(200,110,20,.85)';
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(px, py); ctx.stroke();
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, oy); ctx.moveTo(px, py); ctx.lineTo(ox, py); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(200,110,20,.95)';
    ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
    ctx.font = 'italic 13px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('x² + y² = 1', ox - r * .6, oy + r + 18);
  }

  function drawBars() {
    const values = [3, 5, 4, 7, 6, 9, 8, 11];
    const bw = 18, gap = 8, base = h - 24;
    const x0 = 28;
    ctx.fillStyle = 'rgba(40,160,110,.18)';
    ctx.strokeStyle = 'rgba(40,160,110,.55)';
    ctx.lineWidth = 1;
    values.forEach((v, i) => {
      const bh = v * 9;
      ctx.fillRect(x0 + i * (bw + gap), base - bh, bw, bh);
      ctx.strokeRect(x0 + i * (bw + gap) + .5, base - bh + .5, bw, bh);
    });
  }

  function drawFloaters(t, dt) {
    ctx.textAlign = 'center';
    floaters.forEach((f, i) => {
      if (!reduceMotion) {
        f.y -= f.speed * dt;
        if (f.y < -60) floaters[i] = makeFloater(false);
      }
      const x = f.x + Math.sin(t * 0.0004 * f.sway + f.phase) * 14;
      ctx.save();
      ctx.translate(x, f.y);
      ctx.rotate(f.rot);
      ctx.globalAlpha = f.alpha;
      ctx.fillStyle = '#1e3a5f';
      ctx.font = `italic ${f.size}px Georgia, "Times New Roman", serif`;
      ctx.fillText(f.text, 0, 0);
      ctx.restore();
    });
  }

  /* ---------- frame ---------- */
  let last = performance.now();

  function draw(t) {
    const dt = Math.min((t - last) / 1000, 0.1);
    last = t;

    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#f7f9fc');
    g.addColorStop(1, '#dde7f3');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    drawGrid();
    drawBars();

    const cx = Math.round(w * 0.5 / 28) * 28;
    const cy = Math.round(h * 0.5 / 28) * 28;
    drawAxes(cx, cy);

    const p = reduceMotion ? 0 : t * 0.0009;
    plot(x => Math.sin(x + p) * 1.6, cx, cy, 'rgba(0,140,185,.85)', 'y = sin x', 60);
    plot(x => Math.cos(x * 0.7 - p) * 1.1, cx, cy, 'rgba(214,51,108,.75)', 'y = cos x', w - 140);
    plot(x => 0.12 * x * x - 2.4, cx, cy, 'rgba(47,158,68,.75)', 'y = x²', cx + 56 * 4.2);
    plot(x => Math.exp(-Math.abs(x) * 0.5) * 2.2, cx, cy, 'rgba(224,138,0,.8)', 'y = e^-|x|', cx - 56 * 3.6);

    drawUnitCircle(cx, cy, t);
    drawFloaters(t, dt);

    if (!reduceMotion) requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  if (!reduceMotion) requestAnimationFrame(draw);
})();