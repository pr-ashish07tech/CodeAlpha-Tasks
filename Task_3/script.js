(() => {
  'use strict';

  const MAX_DIGITS = 12;
  const screen = document.getElementById('screen');
  const ind = {
    m: document.getElementById('ind-m'),
    gt: document.getElementById('ind-gt'),
    neg: document.getElementById('ind-neg'),
    e: document.getElementById('ind-e'),
    chk: document.getElementById('ind-chk'),
  };

  const state = {
    cur: '0',          // number being typed / shown (string)
    acc: null,         // left operand
    op: null,          // pending operator
    fresh: true,       // next digit starts a new number
    lastOp: null,      // for repeated "=" and AUTO REPLAY
    lastB: null,
    memory: 0,
    mrcPressed: false,
    gt: 0,
    error: false,
    tape: [],          // entries shown by CHECK
    checkIdx: -1,
  };

  /* ---------- helpers ---------- */
  const num = s => parseFloat(s);
  const digitCount = s => s.replace(/[-.]/g, '').length;

  // Round to fit the 12-digit display; returns string or null on overflow
  function fmt(n) {
    if (!isFinite(n)) return null;
    n = parseFloat(n.toPrecision(MAX_DIGITS));
    const intLen = Math.abs(Math.trunc(n)).toString().length;
    if (intLen > MAX_DIGITS) return null;
    let s = n.toFixed(Math.max(0, MAX_DIGITS - intLen));
    if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s === '-0' ? '0' : s;
  }

  function setError() {
    state.error = true;
    state.op = null;
  }

  function setResult(n, addToGT = true) {
    const s = fmt(n);
    if (s === null) { setError(); return false; }
    state.cur = s;
    state.fresh = true;
    if (addToGT) state.gt += num(s);
    return true;
  }

  function compute(a, op, b) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? Infinity : a / b;
    }
    return b;
  }

  function record(text) {
    state.tape.push(text);
    state.checkIdx = -1;
  }

  /* ---------- rendering ---------- */
  function render() {
    let text = state.error ? '0' : state.cur;
    const neg = text.startsWith('-');
    if (neg) text = text.slice(1);
    if (!text.includes('.')) text += '.';
    screen.textContent = text;

    ind.neg.classList.toggle('on', neg);
    ind.e.classList.toggle('on', state.error);
    ind.m.classList.toggle('on', state.memory !== 0);
    ind.gt.classList.toggle('on', state.gt !== 0);
    ind.chk.classList.toggle('on', state.checkIdx !== -1);
  }

  /* ---------- actions ---------- */
  function digit(d) {
    if (state.error) return;
    state.checkIdx = -1;
    state.mrcPressed = false;
    if (state.fresh) { state.cur = '0'; state.fresh = false; }
    if (digitCount(state.cur) >= MAX_DIGITS) return;
    if (state.cur === '0' || state.cur === '-0') {
      if (d === '00') return;
      state.cur = (state.cur.startsWith('-') ? '-' : '') + d;
    } else {
      state.cur += d;
    }
  }

  function decimal() {
    if (state.error) return;
    if (state.fresh) { state.cur = '0'; state.fresh = false; }
    if (!state.cur.includes('.') && digitCount(state.cur) < MAX_DIGITS) state.cur += '.';
  }

  function operator(o) {
    if (state.error) return;
    const b = num(state.cur);
    if (state.op && !state.fresh) {
      const r = compute(state.acc, state.op, b);
      record(`${state.cur} ${state.op}`);
      if (!setResult(r, false)) return;
      state.acc = num(state.cur);
    } else {
      if (!state.op) record(`${state.cur} ${o}`);
      state.acc = b;
    }
    state.op = o;
    state.fresh = true;
    state.lastOp = null;
  }

  function equals() {
    if (state.error) return;
    const b = num(state.cur);
    if (state.op) {
      record(`${state.cur} =`);
      const r = compute(state.acc, state.op, b);
      state.lastOp = state.op;
      state.lastB = b;
      state.op = null;
      setResult(r);
    } else if (state.lastOp) {
      setResult(compute(b, state.lastOp, state.lastB));
    }
  }

  // AUTO REPLAY: repeat the last operation on what is on the display
  function replay() {
    if (state.error || !state.lastOp) return;
    setResult(compute(num(state.cur), state.lastOp, state.lastB));
  }

  function percent() {
    if (state.error) return;
    const b = num(state.cur);
    if (state.op) {
      const a = state.acc;
      let r;
      switch (state.op) {
        case '*': r = a * b / 100; break;
        case '/': r = b === 0 ? Infinity : a / b * 100; break;
        case '+': r = a + a * b / 100; break;
        case '-': r = a - a * b / 100; break;
      }
      state.op = null;
      state.lastOp = null;
      record(`${state.cur} %`);
      setResult(r);
    } else {
      setResult(b / 100, false);
    }
  }

  // MU (mark-up): A x B MU -> A + B% of A ; A ÷ B MU -> A / (1 - B%)
  function markup() {
    if (state.error || !state.op) return;
    const a = state.acc, b = num(state.cur);
    let r = null;
    if (state.op === '*') r = a * (1 + b / 100);
    else if (state.op === '/') r = b >= 100 ? Infinity : a / (1 - b / 100);
    else return;
    state.op = null;
    state.lastOp = null;
    record(`${state.cur} MU`);
    setResult(r);
  }

  function sqrt() {
    if (state.error) return;
    const n = num(state.cur);
    if (n < 0) return setError();
    setResult(Math.sqrt(n), false);
  }

  function sign() {
    if (state.error || state.cur === '0') return;
    state.cur = state.cur.startsWith('-') ? state.cur.slice(1) : '-' + state.cur;
  }

  function grandTotal() {
    if (state.error) return;
    const s = fmt(state.gt);
    if (s === null) return setError();
    state.cur = s;
    state.fresh = true;
    state.gt = 0;           // second press shows 0 (GT is cleared once recalled)
  }

  function clearEntry() {
    if (state.error) { state.error = false; state.cur = '0'; state.fresh = true; return; }
    state.cur = '0';
    state.fresh = false;
  }

  function allClear() {
    Object.assign(state, {
      cur: '0', acc: null, op: null, fresh: true, lastOp: null, lastB: null,
      gt: 0, error: false, tape: [], checkIdx: -1, mrcPressed: false,
    });
  }

  // CORRECT / DELETE: remove the last typed digit
  function correct() {
    if (state.error || state.fresh) return;
    state.cur = state.cur.slice(0, -1);
    if (state.cur === '' || state.cur === '-') state.cur = '0';
  }

  // CHECK: step back through the entries you've keyed in
  function check() {
    if (!state.tape.length) return;
    state.checkIdx = state.checkIdx <= 0 ? state.tape.length - 1 : state.checkIdx - 1;
    const entry = state.tape[state.checkIdx];
    screen.textContent = entry.split(' ')[0].includes('.') ? entry.split(' ')[0] : entry.split(' ')[0] + '.';
    ind.chk.classList.add('on');
  }

  function memory(kind) {
    if (state.error) return;
    const v = num(state.cur);
    if (kind === 'mrc') {
      if (state.mrcPressed) {
        state.memory = 0;
        state.mrcPressed = false;
      } else {
        const s = fmt(state.memory);
        if (s !== null) { state.cur = s; state.fresh = true; }
        state.mrcPressed = true;
      }
      return;
    }
    state.mrcPressed = false;
    state.memory += kind === 'm+' ? v : -v;
    state.fresh = true;
  }

  /* ---------- dispatcher ---------- */
  function press(k) {
    if (k !== 'mrc') state.mrcPressed = false;
    if (k !== 'check') { /* leaving CHECK mode keeps the display intact */ }

    if (/^\d$|^00$/.test(k)) digit(k);
    else if (k === '.') decimal();
    else if ('+-*/'.includes(k) && k.length === 1) operator(k);
    else switch (k) {
      case '=': equals(); break;
      case '%': percent(); break;
      case 'mu': markup(); break;
      case 'sqrt': sqrt(); break;
      case 'sign': sign(); break;
      case 'gt': grandTotal(); break;
      case 'ce': clearEntry(); break;
      case 'ac': allClear(); break;
      case 'replay': replay(); break;
      case 'correct': correct(); break;
      case 'mrc': case 'm+': case 'm-': memory(k); break;
      case 'check': render(); check(); return;
    }
    render();
  }

  /* ---------- events ---------- */
  document.getElementById('calc').addEventListener('click', e => {
    const btn = e.target.closest('[data-k]');
    if (btn) press(btn.dataset.k);
  });

  const keyMap = {
    Enter: '=', '=': '=', Backspace: 'correct', Delete: 'ce', Escape: 'ac',
    ',': '.', '.': '.', '%': '%', '+': '+', '-': '-', '*': '*', '/': '/',
    x: '*', X: '*', r: 'sqrt', m: 'mrc',
  };

  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = /^\d$/.test(e.key) ? e.key : keyMap[e.key];
    if (!k) return;
    e.preventDefault();
    const btn = document.querySelector(`[data-k="${CSS.escape(k)}"]`);
    if (btn) {
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 90);
    }
    press(k);
  });

  render();
})();