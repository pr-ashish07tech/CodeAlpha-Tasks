(() => {
  'use strict';

  const CATEGORIES = ['Libraries', 'Nature', 'Architecture', 'Still life'];
  const STORE = { custom: 'picskala.custom', favs: 'picskala.favs' };

  // Starter images (swap the URLs for your own photos any time)
  const pic = (seed, w = 900, h = 1125) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
  const DEFAULTS = [
    ['Reading by the window', 'Libraries', 'window'],
    ['Stacks after dusk', 'Libraries', 'stacks'],
    ['The long study table', 'Libraries', 'study'],
    ['Margins and marginalia', 'Libraries', 'margin'],
    ['Ivy on old stone', 'Nature', 'ivy'],
    ['Orchard in October', 'Nature', 'orchard'],
    ['Path through the beeches', 'Nature', 'beech'],
    ['Morning on the lake', 'Nature', 'lake'],
    ['The quad at noon', 'Architecture', 'quad'],
    ['Arched cloister', 'Architecture', 'cloister'],
    ['Spiral stair', 'Architecture', 'stair'],
    ['Clock tower', 'Architecture', 'tower'],
    ['Tea and a first edition', 'Still life', 'tea'],
    ['Pressed flowers', 'Still life', 'flowers'],
    ['Inkwell and quill', 'Still life', 'ink'],
    ['Candle, letters, pears', 'Still life', 'pears']
  ].map(([title, category, seed], i) => ({ id: 'd' + i, title, category, src: pic(seed), custom: false }));

  // ---------- State ----------
  const load = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  };

  let custom = load(STORE.custom, []);
  let favs = new Set(load(STORE.favs, []));
  let category = 'All';
  let query = '';
  let visible = [];
  let current = 0;

  const $ = id => document.getElementById(id);
  const grid = $('grid'), filters = $('filters'), countEl = $('count'), emptyEl = $('empty');
  const lightbox = $('lightbox'), lbImg = $('lbImg');
  const dialog = $('addDialog');

  const allItems = () => [...DEFAULTS, ...custom];

  // ---------- Toast ----------
  let toastTimer;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ---------- Filters ----------
  function renderFilters() {
    const names = ['All', ...CATEGORIES, 'Favourites'];
    filters.innerHTML = '';
    names.forEach(name => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (name === category ? ' active' : '');
      b.textContent = name;
      b.setAttribute('aria-pressed', name === category);
      b.addEventListener('click', () => { category = name; renderFilters(); renderGrid(); });
      filters.appendChild(b);
    });
  }

  // ---------- Grid ----------
  function renderGrid() {
    const q = query.trim().toLowerCase();
    visible = allItems().filter(item => {
      const inCat = category === 'All' || (category === 'Favourites' ? favs.has(item.id) : item.category === category);
      return inCat && (!q || item.title.toLowerCase().includes(q));
    });

    grid.innerHTML = '';
    visible.forEach((item, i) => {
      const card = document.createElement('figure');
      card.className = 'card';
      card.tabIndex = 0;
      card.style.animationDelay = Math.min(i * 40, 400) + 'ms';
      const isFav = favs.has(item.id);
      card.innerHTML = `
        <div class="frame"><img loading="lazy" alt=""></div>
        <figcaption><span class="title"></span><span class="tag"></span></figcaption>
        <button class="card-btn fav ${isFav ? 'on' : ''}" type="button" aria-label="Save to favourites" aria-pressed="${isFav}">${isFav ? '♥' : '♡'}</button>
        ${item.custom ? '<button class="card-btn del" type="button" aria-label="Remove image">&times;</button>' : ''}`;
      const img = card.querySelector('img');
      img.src = item.src;
      img.alt = item.title;
      card.querySelector('.title').textContent = item.title;
      card.querySelector('.tag').textContent = item.category;

      card.addEventListener('click', e => {
        if (e.target.closest('.fav')) return toggleFav(item.id);
        if (e.target.closest('.del')) return removeItem(item.id);
        openLightbox(i);
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target === card) openLightbox(i);
      });
      grid.appendChild(card);
    });

    countEl.textContent = `${visible.length} ${visible.length === 1 ? 'image' : 'images'}` + (favs.size ? ` · ${favs.size} saved` : '');
    emptyEl.hidden = visible.length > 0;
  }

  function toggleFav(id) {
    favs.has(id) ? favs.delete(id) : favs.add(id);
    save(STORE.favs, [...favs]);
    toast(favs.has(id) ? 'Saved to favourites' : 'Removed from favourites');
    renderGrid();
  }

  function removeItem(id) {
    if (!confirm('Remove this image from your gallery?')) return;
    custom = custom.filter(c => c.id !== id);
    favs.delete(id);
    save(STORE.custom, custom);
    save(STORE.favs, [...favs]);
    toast('Image removed');
    renderGrid();
  }

  // ---------- Lightbox ----------
  function showImage(index) {
    if (!visible.length) return;
    current = (index + visible.length) % visible.length;
    const item = visible[current];
    lbImg.classList.add('swap');
    setTimeout(() => {
      lbImg.src = item.src;
      lbImg.alt = item.title;
      $('lbCaption').textContent = item.title;
      $('lbMeta').textContent = `${item.category} · ${current + 1} of ${visible.length}`;
      lbImg.onload = () => lbImg.classList.remove('swap');
      if (lbImg.complete) lbImg.classList.remove('swap');
    }, 180);
  }

  function openLightbox(index) {
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    showImage(index);
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  $('lbNext').addEventListener('click', () => showImage(current + 1));
  $('lbPrev').addEventListener('click', () => showImage(current - 1));
  $('lbClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showImage(current + 1);
    if (e.key === 'ArrowLeft') showImage(current - 1);
  });

  // Touch swipe
  let touchX = null;
  lightbox.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showImage(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  // ---------- Add image ----------
  const catSelect = $('categoryInput');
  CATEGORIES.forEach(c => catSelect.add(new Option(c, c)));

  $('openAdd').addEventListener('click', () => { $('addForm').reset(); dialog.showModal(); });
  $('cancelAdd').addEventListener('click', () => dialog.close());

  // Downscale uploads so they fit in localStorage
  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = img.width * scale;
          c.height = img.height * scale;
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  $('addForm').addEventListener('submit', async e => {
    e.preventDefault();
    const file = $('fileInput').files[0];
    const url = $('urlInput').value.trim();
    if (!file && !url) return toast('Choose a file or paste a URL');

    let src = url;
    try { if (file) src = await fileToDataURL(file); } catch { return toast('That file could not be read'); }

    custom.push({
      id: 'c' + Date.now(),
      title: $('captionInput').value.trim(),
      category: catSelect.value,
      src,
      custom: true
    });
    const ok = save(STORE.custom, custom);
    dialog.close();
    category = 'All';
    renderFilters();
    renderGrid();
    toast(ok ? 'Image saved to your gallery' : 'Added, but storage is full so it won’t persist');
  });

  // ---------- Search ----------
  $('search').addEventListener('input', e => { query = e.target.value; renderGrid(); });

  // ---------- Init ----------
  renderFilters();
  renderGrid();
})();