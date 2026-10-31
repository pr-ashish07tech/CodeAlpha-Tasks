// ===== धुन Music Player =====
const $ = id => document.getElementById(id);
const audio = $("audio-player");
const songs = SONGS.map(s => ({ ...s, src: s.file, duration: 0, missing: false }));
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

let currentId = null, isShuffle = false, isRepeat = false, currentTab = "all", searchQuery = "";
let favorites = read("dhun_favs", []);
let queue = [], seeking = false, autoAdvance = false, errorStreak = 0;

const byId = id => songs.find(s => s.id === id);
const fmt = t => (isFinite(t) ? Math.floor(t / 60) + ":" + String(Math.floor(t % 60)).padStart(2, "0") : "0:00");
const norm = s => s.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]/g, "");
let tt;
function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2800); }

function visibleSongs() {
  return songs.filter(s =>
    (currentTab === "all" || favorites.includes(s.id)) &&
    (!searchQuery || (s.title + " " + s.artist).toLowerCase().includes(searchQuery)));
}

// ---- load / play ----
function loadSong(id) {
  const s = byId(id); if (!s) return;
  currentId = id;
  if (!queue.includes(id)) queue = visibleSongs().map(x => x.id);
  $("song-title").textContent = s.title;
  $("song-artist").textContent = s.artist;
  $("cover-art").src = s.cover || COVERS[0];
  $("progress-bar").value = 0;
  $("current-time").textContent = "0:00";
  $("duration").textContent = s.duration ? fmt(s.duration) : "0:00";
  document.title = s.title + " - धुन";
  audio.src = s.src;          // each song has its own file
  audio.load();
  updateFavoriteBtn();
}
function playSong() {
  if (!currentId) { queue = visibleSongs().map(s => s.id); if (!queue.length) return; loadSong(queue[0]); }
  if (!audio.getAttribute("src")) audio.src = byId(currentId).src;
  audio.play().catch(() => {});
}
const pauseSong = () => audio.pause();
function selectSong(id) { autoAdvance = false; errorStreak = 0; queue = visibleSongs().map(s => s.id); loadSong(id); playSong(); renderPlaylist(); }

function step(dir) {
  if (!queue.length) queue = visibleSongs().map(s => s.id);
  if (!queue.length) return;
  let i = queue.indexOf(currentId);
  if (isShuffle && queue.length > 1) { let n; do { n = Math.floor(Math.random() * queue.length); } while (n === i); i = n; }
  else i = (i + dir + queue.length) % queue.length;
  loadSong(queue[i]); playSong(); renderPlaylist();
}

$("play-btn").onclick = () => (audio.paused ? playSong() : pauseSong());
$("next-btn").onclick = () => { autoAdvance = false; step(1); };
$("prev-btn").onclick = () => { autoAdvance = false; audio.currentTime > 3 ? (audio.currentTime = 0) : step(-1); };

audio.addEventListener("play", () => { $("play-btn").innerHTML = '<i class="fa-solid fa-pause"></i>'; errorStreak = 0; });
audio.addEventListener("pause", () => { $("play-btn").innerHTML = '<i class="fa-solid fa-play"></i>'; });
audio.addEventListener("loadedmetadata", () => {
  const s = byId(currentId); if (s) { s.duration = audio.duration; s.missing = false; }
  $("duration").textContent = fmt(audio.duration); renderPlaylist();
});
audio.addEventListener("timeupdate", () => {
  if (seeking || !audio.duration) return;
  $("progress-bar").value = (audio.currentTime / audio.duration) * 100;
  $("current-time").textContent = fmt(audio.currentTime);
});
$("progress-bar").addEventListener("input", e => { seeking = true; if (audio.duration) $("current-time").textContent = fmt(e.target.value / 100 * audio.duration); });
$("progress-bar").addEventListener("change", e => { if (audio.duration) audio.currentTime = e.target.value / 100 * audio.duration; seeking = false; });

// autoplay next song when one ends
audio.addEventListener("ended", () => { if (isRepeat) { audio.currentTime = 0; playSong(); } else { autoAdvance = true; step(1); } });

// wrong / missing file: say so, never play a different audio
audio.addEventListener("error", () => {
  const s = byId(currentId); if (!s || !audio.getAttribute("src")) return;
  s.missing = true; renderPlaylist();
  toast("Audio file not found: " + s.src);
  if (autoAdvance && ++errorStreak < queue.length) setTimeout(() => step(1), 900);
});

// ---- volume ----
let lastVol = read("dhun_vol", 80);
function setVol(v) {
  v = Math.max(0, Math.min(100, v)); audio.volume = v / 100; $("volume-bar").value = v;
  $("volume-icon").className = v === 0 ? "fa-solid fa-volume-xmark" : v < 50 ? "fa-solid fa-volume-low" : "fa-solid fa-volume-high";
  if (v > 0) { lastVol = v; save("dhun_vol", v); }
}
$("volume-bar").addEventListener("input", e => setVol(+e.target.value));
$("volume-icon").onclick = () => setVol(audio.volume === 0 ? lastVol : 0);
setVol(lastVol);

$("shuffle-btn").onclick = () => { isShuffle = !isShuffle; $("shuffle-btn").classList.toggle("active-mode", isShuffle); };
$("repeat-btn").onclick = () => { isRepeat = !isRepeat; $("repeat-btn").classList.toggle("active-mode", isRepeat); };

// ---- favorites (saved in browser) ----
function toggleFavorite(id) {
  favorites = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id];
  save("dhun_favs", favorites);
  updateFavoriteBtn(); $("fav-count").textContent = favorites.length; renderPlaylist();
}
function updateFavoriteBtn() {
  const on = currentId && favorites.includes(currentId);
  $("favorite-btn").classList.toggle("active", !!on);
  $("favorite-btn").innerHTML = `<i class="${on ? "fa-solid" : "fa-regular"} fa-heart"></i>`;
}
$("favorite-btn").onclick = () => currentId ? toggleFavorite(currentId) : toast("Select a song first");

// ---- search & tabs ----
$("search-input").addEventListener("input", e => { searchQuery = e.target.value.toLowerCase().trim(); renderPlaylist(); });
function setTab(t) {
  currentTab = t;
  $("tab-all").classList.toggle("active", t === "all");
  $("tab-fav").classList.toggle("active", t === "fav");
  renderPlaylist();
}
$("tab-all").onclick = () => setTab("all");
$("tab-fav").onclick = () => setTab("fav");

// ---- playlist ----
function renderPlaylist() {
  const list = $("playlist"), items = visibleSongs();
  $("fav-count").textContent = favorites.length;
  if (!items.length) {
    list.innerHTML = `<li style="text-align:center;color:#999;padding:24px;line-height:1.5">${currentTab === "fav" && !searchQuery ? "No favorites yet.<br>Tap the heart on any song to save it here." : "No songs found"}</li>`;
    return;
  }
  list.innerHTML = items.map(s => {
    const fav = favorites.includes(s.id);
    return `<li class="song-item ${s.id === currentId ? "active" : ""} ${s.missing ? "missing" : ""}" data-id="${s.id}">
      <div class="song-info-left">
        <img src="${s.cover || COVERS[0]}" alt="" onerror="this.removeAttribute('src')">
        <div><div class="song-title-text">${s.title}</div><div class="song-artist-text">${s.artist}</div></div>
      </div>
      <div class="song-actions">
        <span>${s.duration ? fmt(s.duration) : ""}</span>
        <button class="item-fav-btn ${fav ? "active" : ""}" title="Favorite"><i class="${fav ? "fa-solid" : "fa-regular"} fa-heart"></i></button>
      </div></li>`;
  }).join("");
}
$("playlist").addEventListener("click", e => {
  const li = e.target.closest(".song-item"); if (!li) return;
  e.target.closest(".item-fav-btn") ? toggleFavorite(li.dataset.id) : selectSong(li.dataset.id);
});

// ---- add songs from device: matches by file name ----
function preload(s) {
  const a = new Audio(); a.preload = "metadata"; a.src = s.src;
  a.onloadedmetadata = () => { s.duration = a.duration; s.missing = false; renderPlaylist(); a.src = ""; };
  a.onerror = () => { a.src = ""; };
}
$("add-btn").onclick = () => $("file-input").click();
$("file-input").onchange = e => {
  let matched = 0, added = 0;
  for (const f of e.target.files) {
    const url = URL.createObjectURL(f), n = norm(f.name);
    const hit = songs.find(s => { const t = norm(s.title); return t.length >= 4 && n.includes(t); });
    if (hit) { hit.src = url; hit.missing = false; matched++; preload(hit); }
    else {
      const s = { id: "local-" + n + "-" + songs.length, title: f.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "), artist: "My device", cover: COVERS[0], src: url, duration: 0, missing: false };
      songs.push(s); added++; preload(s);
    }
  }
  e.target.value = ""; renderPlaylist();
  toast(matched + " matched, " + added + " new");
};

// ---- init ----
songs.forEach(preload);
loadSong(songs[0].id);
audio.removeAttribute("src");   // don't try to play until user chooses
renderPlaylist();