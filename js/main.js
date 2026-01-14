const button = document.getElementById('play-button');
const inlinePlay = document.getElementById('play-inline');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const widget = document.getElementById('music-widget');
const disc = document.getElementById('disc');
const audio = document.getElementById('audio');
const progressBar = document.querySelector('.progress');
const progressFill = document.getElementById('progress');
const timeEl = document.querySelector('.time');
const titleEl = document.getElementById('title');
const artistEl = document.getElementById('artist');
const bgImage = document.querySelector('.bg-image');


let isPlaying = false; 

// Default playlist (edit here or use an external playlist file)


// External playlist configuration - point this to a JSON or JS file containing the tracks array
// JSON example: assets/playlist.json
// JS example: assets/tracks.js that sets window.TRACKS = [ ... ]
const PLAYLIST_JSON = 'assets/playlist.json';
const PLAYLIST_JS = 'assets/tracks.js';

function applyTracks(newTracks) {
  if (!Array.isArray(newTracks) || newTracks.length === 0) return false;
  tracks = newTracks.map(t => ({
    title: t.title || t.name || 'Unknown',
    artist: t.artist || '',
    src: t.src || t.file || '',
    cover: t.cover || t.image || ''
  }));
  return true;
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = url;
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error('Script load error'));
    document.head.appendChild(s);
  });
}

async function loadExternalPlaylist() {
  // Try JSON first
  try {
    const res = await fetch(PLAYLIST_JSON, { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      if (applyTracks(data)) {
        console.log('Loaded playlist from', PLAYLIST_JSON);
        return true;
      }
    }
  } catch (e) {
    // ignore and try JS
  }

  // Try JS file that defines window.TRACKS or window.tracks
  try {
    await loadScript(PLAYLIST_JS);
    const ext = window.TRACKS || window.tracks;
    if (applyTracks(ext)) {
      console.log('Loaded playlist from', PLAYLIST_JS);
      return true;
    }
  } catch (e) {
    // ignore
  }

  return false;
}

function formatTime(s) {
  if (isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function updatePlayUI(playing) {
  if (playing) {
    disc.classList.add('spin');
    if (inlinePlay) inlinePlay.textContent = '⏸';
    if (button) button.textContent = '⏸';
    widget.classList.add('show');
  } else {
    disc.classList.remove('spin');
    if (inlinePlay) inlinePlay.textContent = '▶';
    if (button) button.textContent = '▶';
    // keep widget visible when a track is loaded
  }
}

function setBackgroundCover(url) {
  if (!bgImage || !url) return;
  // fade out while we preload the new image
  bgImage.style.opacity = '0';
  const img = new Image();
  img.src = url;
  img.onload = () => {
    bgImage.style.backgroundImage = `url('${url}')`;
    bgImage.style.opacity = '1';
  };
  img.onerror = () => {
    // fallback: set immediately
    bgImage.style.backgroundImage = `url('${url}')`;
    bgImage.style.opacity = '1';
  };
}

// Update marquee for long titles/artists: measure masks and texts, set CSS vars and enable animation only when necessary
function updateTitleMarquee() {
  const masks = Array.from(document.querySelectorAll('.marquee-mask'));
  const controls = document.querySelector('.controls');
  if (!masks.length) return;

  // Match mask width to .controls width so visible length equals controls
  if (controls) {
    const w = controls.offsetWidth + 'px';
    masks.forEach(mask => { mask.style.width = w; });
  }

  // Respect reduced-motion preference
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    masks.forEach(mask => {
      const text = mask.querySelector('.marquee-text');
      if (text) {
        text.classList.remove('marquee');
        text.style.removeProperty('--marquee-distance');
        text.style.removeProperty('--marquee-duration');
      }
    });
    return;
  }

  masks.forEach(mask => {
    const text = mask.querySelector('.marquee-text');
    if (!text) return;

    // Allow per-mask width override via data-mask-width (e.g. '180px' or '60%')
    if (mask.dataset.maskWidth) {
      mask.style.width = mask.dataset.maskWidth;
    }

    const maskW = mask.offsetWidth;
    const textW = text.scrollWidth;
    if (textW > maskW + 1) {
      const distance = textW - maskW + 8;
      text.style.setProperty('--marquee-distance', distance + 'px');

      // duration: prefer explicit data-duration (seconds), else compute from data-speed (px/s), fallback to default
      let duration;
      if (mask.dataset.duration) {
        const d = parseFloat(mask.dataset.duration);
        if (isFinite(d) && d > 0) duration = d;
      } else if (mask.dataset.speed) {
        const sp = parseFloat(mask.dataset.speed);
        if (isFinite(sp) && sp > 0) duration = Math.max(4, distance / sp);
      } else {
        const speed = 40;
        duration = Math.max(6, distance / speed);
      }
      text.style.setProperty('--marquee-duration', duration + 's');

      // direction: data-direction='ltr' for single-direction left→right
      const dir = (mask.dataset.direction || '').toLowerCase();
      if (dir === 'ltr') text.classList.add('marquee-ltr');
      else text.classList.remove('marquee-ltr');

      text.classList.add('marquee');
    } else {
      text.classList.remove('marquee');
      text.classList.remove('marquee-ltr');
      text.style.removeProperty('--marquee-distance');
      text.style.removeProperty('--marquee-duration');
    }
  });
}

// Recompute on resize
window.addEventListener('resize', updateTitleMarquee);

function loadTrack(index) {
  const nextIndex = (index + tracks.length) % tracks.length;
  const t = tracks[nextIndex];
  if (!t) return;

  // 🚫 Prevent reload of same track
  if (audio.src && audio.src.includes(t.src)) {
    currentIndex = nextIndex;
    return;
  }

  currentIndex = nextIndex;

  audio.pause();          // stop current play safely
  audio.src = t.src;      // change source
  audio.load();           // explicit load

  if (disc) disc.src = t.cover;
  setBackgroundCover(t.cover);
  // Place title text into the marquee span (keeps markup intact)
  const titleSpan = titleEl ? titleEl.querySelector('.marquee-text') : null;
  if (titleSpan) { titleSpan.textContent = t.title; titleSpan.setAttribute('title', t.title); }
  else if (titleEl) titleEl.textContent = t.title;
  // Place artist text into marquee span (if present)
  const artistSpan = artistEl ? artistEl.querySelector('.marquee-text') : null;
  if (artistSpan) { artistSpan.textContent = t.artist; artistSpan.setAttribute('title', t.artist); }
  else if (artistEl) artistEl.textContent = t.artist;
  // Update marquee sizing/animation
  requestAnimationFrame(updateTitleMarquee);
  progressFill.style.width = '0%';
  if (timeEl) timeEl.textContent = formatTime(0);
  isPlaying = false;
  updatePlayUI(false);
}
function playCurrent() {
  audio.play().catch(err => {
    if (err.name !== 'AbortError') {
      console.error(err);
    }
  });
  isPlaying = true;
  updatePlayUI(true);
}

function togglePlay() {
  if (!isPlaying) {
    playCurrent();
  } else {
    audio.pause();
    isPlaying = false;
    updatePlayUI(false);
  }
}


// Attach listeners
if (inlinePlay) inlinePlay.addEventListener('click', togglePlay);
if (button) button.addEventListener('click', togglePlay);

if (prevBtn) prevBtn.addEventListener('click', () => {
  loadTrack(currentIndex - 1);
  playCurrent();
});
if (nextBtn) nextBtn.addEventListener('click', () => {
  loadTrack(currentIndex + 1);
  playCurrent();
});

// Progress updates
audio.addEventListener('timeupdate', () => {
  const pct = (audio.currentTime / (audio.duration || 1)) * 100;
  progressFill.style.width = `${pct}%`;
  if (timeEl) timeEl.textContent = formatTime(audio.currentTime);
});

// Initialize UI
window.addEventListener('DOMContentLoaded', async () => {
  if (progressFill) progressFill.style.width = '0%';
  if (timeEl) timeEl.textContent = formatTime(0);

  // Try to load an external playlist (assets/playlist.json) first. Falls back to default `tracks` if not found.
  try {
    const loaded = await loadExternalPlaylist();
    if (loaded) {
      console.log('Loaded playlist from external file.');
    } else {
      console.log('No external playlist found; using built-in tracks.');
    }
  } catch (err) {
    console.warn('Error loading external playlist:', err);
  }

  loadTrack(0);
  // Ensure marquee is measured for the first track
  requestAnimationFrame(updateTitleMarquee);
});

// Seek when clicking progress
if (progressBar) {
  progressBar.addEventListener('click', (e) => {
    if (!isFinite(audio.duration) || audio.duration === 0) return;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    audio.currentTime = pct * audio.duration;
  });
}

// When a track ends, advance to the next track and play
audio.addEventListener('ended', () => {
  loadTrack(currentIndex + 1);
  playCurrent();
});

/* Pause when tab inactive */
document.addEventListener("visibilitychange", () => {
  if (document.hidden && isPlaying) {
    audio.pause();
    updatePlayUI(false);
    isPlaying = false;
  }
});


// ===============================
// GLASS CREDIT AUTO-HIDE
// ===============================

document.addEventListener('DOMContentLoaded', () => {
  const credit = document.querySelector('.glass-credit');
  if (!credit) return;

  let hideTimer;

  function showCredit() {
    credit.style.opacity = '1';

    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      credit.style.opacity = '0';
    }, 3000);
  }

  // Show on user activity
  ['mousemove', 'touchstart', 'scroll', 'keydown'].forEach(evt => {
    window.addEventListener(evt, showCredit, { passive: true });
  });

  // Initial show
  showCredit();
});