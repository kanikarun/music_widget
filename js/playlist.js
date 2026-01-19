// ===============================
// PLAYLIST MODULE WITH BACKGROUND SUPPORT + FAVORITES
// ===============================
(function () {
  const playlistToggle = document.getElementById('playlist-toggle');
  const playlistOverlay = document.getElementById('playlist-overlay');
  const playlistClose = document.getElementById('playlist-close');
  const playlistTracks = document.getElementById('playlist-tracks');

  const sortTitleBtn = document.getElementById('sort-title');
  const sortArtistBtn = document.getElementById('sort-artist');
  const sortOrderBtn = document.getElementById('sort-order');
  const searchInput = document.getElementById('playlist-search');

  // 🔹 FAVORITES ELEMENTS
  const favoritesToggle = document.getElementById('favorites-toggle');
  const favoritesOverlay = document.getElementById('favorites-overlay');
  const favoritesClose = document.getElementById('favorites-close');
  const favoritesTracks = document.getElementById('favorites-tracks');
  const widgetFavBtn = document.getElementById('widget-fav-btn');

  const playBtn = document.getElementById('play-inline');
  const playIcon = playBtn?.querySelector('.play-icon');
  const pauseIcon = playBtn?.querySelector('.pause-icon');
  const audio = document.getElementById('audio');
  const disc = document.getElementById('disc');

  const nextBtn = document.getElementById('next');
  const prevBtn = document.getElementById('prev');

  let isPlaylistOpen = false;
  let isFavoritesOpen = false;
  let sortMode = localStorage.getItem('playlistSortMode') || 'title';
  let sortOrder = localStorage.getItem('playlistSortOrder') || 'asc';
  const collapsedArtists = new Set();
  let searchQuery = '';

  // 🔹 Playback queue
  let playQueue = [];
  let queueIndex = 0;

  // 🔹 FAVORITES MODE
  let playMode = 'normal'; // normal | favorites
  let favoritesQueue = [];
  let favoritesIndex = 0;

  // 🔹 detect iOS
  const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);

  // 🔹 track first user interaction
  let userHasInteracted = false;

  // ===============================
  // FAVORITES STORAGE
  // ===============================
  const FAVORITES_KEY = 'favoriteTracks';

  function trackKey(track) {
    return `${track.title}__${track.artist}`;
  }

  function getFavorites() {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  }

  function isFavorite(track) {
    return getFavorites().includes(trackKey(track));
  }

  function toggleFavorite(track) {
    let favs = getFavorites();
    const key = trackKey(track);

    favs = favs.includes(key)
      ? favs.filter(k => k !== key)
      : [...favs, key];

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  }

  // ===============================
  // PLAY/PAUSE SYNC
  // ===============================
  function syncPlayButton() {
    if (!playBtn) return;
    playBtn.classList.toggle('is-playing', !audio.paused);
  }

  function updatePlayPauseIcons(isPlaying) {
    // Use CSS class instead of inline styles to match widget.css
    if (playBtn) {
      if (isPlaying) {
        playBtn.classList.add('is-playing');
      } else {
        playBtn.classList.remove('is-playing');
      }
    }
    
    if (disc) {
      if (isPlaying) {
        disc.classList.add('spin');
        disc.style.animationPlayState = 'running';
        disc.style.transform = ''; // clear any manual transform
      } else {
        // Pause: stop animation and reset to original position
        disc.style.animationPlayState = 'paused';
        disc.style.transform = 'rotate(0deg)';
        // Remove spin class after transition
        setTimeout(() => {
          if (audio.paused) {
            disc.classList.remove('spin');
          }
        }, 300);
      }
    }
  }

  audio.addEventListener('play', () => {
    syncPlayButton();
    updatePlayPauseIcons(true);
  });
  audio.addEventListener('pause', () => {
    syncPlayButton();
    updatePlayPauseIcons(false);
  });
  audio.addEventListener('ended', () => {
    syncPlayButton();
    updatePlayPauseIcons(false);
  });

  // Polling mechanism to catch media session state changes
  setInterval(() => {
    if (playBtn) {
      const shouldBePlaying = !audio.paused;
      const isShowingPlaying = playBtn.classList.contains('is-playing');
      
      if (shouldBePlaying !== isShowingPlaying) {
        updatePlayPauseIcons(shouldBePlaying);
      }
    }
  }, 250);

  playBtn?.addEventListener('click', () => {
    userHasInteracted = true; // Mark interaction for iOS
    
    if (audio.paused) {
      // Ensure audio is loaded before playing
      if (audio.readyState < 2) {
        audio.load();
      }
      audio.play().catch(err => {
        console.log('Play failed:', err);
      });
    } else {
      audio.pause();
    }
  });

  // ===============================
  // OVERLAYS (NEVER BOTH OPEN)
  // ===============================
  function openPlaylist() {
    isPlaylistOpen = true;
    isFavoritesOpen = false;
    playlistOverlay.classList.add('show');
    favoritesOverlay?.classList.remove('show');
    renderPlaylist();
  }

  function openFavorites() {
    isFavoritesOpen = true;
    isPlaylistOpen = false;
    favoritesOverlay?.classList.add('show');
    playlistOverlay.classList.remove('show');
    renderFavorites();
  }

  function closeAllOverlays() {
    isPlaylistOpen = false;
    isFavoritesOpen = false;
    playlistOverlay.classList.remove('show');
    favoritesOverlay?.classList.remove('show');
  }

  playlistToggle?.addEventListener('click', openPlaylist);
  playlistClose?.addEventListener('click', closeAllOverlays);
  favoritesToggle?.addEventListener('click', openFavorites);
  favoritesClose?.addEventListener('click', closeAllOverlays);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllOverlays();
  });

  // ===============================
  // SEARCH FILTER
  // ===============================
  function matchesSearch(track) {
    if (!searchQuery) return true;
    return track.title.toLowerCase().includes(searchQuery) || track.artist.toLowerCase().includes(searchQuery);
  }

  searchInput?.addEventListener('input', e => {
    searchQuery = e.target.value.toLowerCase();
    renderPlaylist();
  });

  // ===============================
  // SORT BUTTONS
  // ===============================
  function updateSortButtonState() {
    sortTitleBtn?.classList.toggle('active', sortMode === 'title');
    sortArtistBtn?.classList.toggle('active', sortMode === 'artist');
    if (sortOrderBtn) sortOrderBtn.textContent = sortOrder === 'asc' ? '⬆ A–Z' : '⬇ Z–A';
  }

  function savePreferences() {
    localStorage.setItem('playlistSortMode', sortMode);
    localStorage.setItem('playlistSortOrder', sortOrder);
  }

  sortTitleBtn?.addEventListener('click', () => {
    sortMode = 'title';
    savePreferences();
    updateSortButtonState();
    renderPlaylist();
  });

  sortArtistBtn?.addEventListener('click', () => {
    sortMode = 'artist';
    savePreferences();
    updateSortButtonState();
    renderPlaylist();
  });

  sortOrderBtn?.addEventListener('click', () => {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    savePreferences();
    updateSortButtonState();
    renderPlaylist();
  });

  // ===============================
  // MARQUEE TEXT
  // ===============================
  function updateMarqueeText(title, artist) {
    const titleMask = document.querySelector('.marquee-title .marquee-mask');
    const artistMask = document.querySelector('.marquee-artist .marquee-mask');

    if (titleMask) {
      let titleText = titleMask.querySelector('.marquee-text');
      if (!titleText) {
        titleText = document.createElement('span');
        titleText.className = 'marquee-text';
        titleMask.appendChild(titleText);
      }
      titleText.textContent = title;
    }

    if (artistMask) {
      let artistText = artistMask.querySelector('.marquee-text');
      if (!artistText) {
        artistText = document.createElement('span');
        artistText.className = 'marquee-text';
        artistMask.appendChild(artistText);
      }
      artistText.textContent = artist;
    }

    initMarquees();
  }

  function initMarquees() {
    const masks = document.querySelectorAll('.marquee-mask');
    masks.forEach(mask => {
      const text = mask.querySelector('.marquee-text');
      if (!text) return;

      const maskWidth = mask.offsetWidth;
      const textWidth = text.scrollWidth;

      if (textWidth > maskWidth) {
        text.style.setProperty('--marquee-distance', `${textWidth - maskWidth}px`);
        const duration = Math.max(6, (textWidth - maskWidth) / 20);
        text.style.setProperty('--marquee-duration', `${duration}s`);
        text.classList.add('marquee');
      } else {
        text.classList.remove('marquee');
        text.style.transform = 'translateX(0)';
      }
    });
  }

  window.addEventListener('resize', initMarquees);

  // ===============================
  // TRACK NAVIGATION WITH MODE SWITCH
  // ===============================
  function playNextTrack() {
    if (playMode === 'favorites') {
      favoritesIndex++;
      if (favoritesIndex >= favoritesQueue.length) {
        playMode = 'normal';
        playNextTrack();
        return;
      }
      window.currentIndex = favoritesQueue[favoritesIndex];
    } else {
      if (!playQueue.length) return;
      queueIndex = (queueIndex + 1) % playQueue.length;
      window.currentIndex = playQueue[queueIndex];
    }

    window.loadTrack(window.currentIndex);
    audio.play().catch(() => {});
    syncWidgetFavorite();
    updateActiveTrack();
    updateMediaSession(window.tracks[window.currentIndex]);
  }

  function playPrevTrack() {
    if (playMode === 'favorites') {
      favoritesIndex = Math.max(0, favoritesIndex - 1);
      window.currentIndex = favoritesQueue[favoritesIndex];
    } else {
      if (!playQueue.length) return;
      queueIndex = (queueIndex - 1 + playQueue.length) % playQueue.length;
      window.currentIndex = playQueue[queueIndex];
    }

    window.loadTrack(window.currentIndex);
    audio.play().catch(() => {});
    syncWidgetFavorite();
    updateActiveTrack();
    updateMediaSession(window.tracks[window.currentIndex]);
  }

  nextBtn?.addEventListener('click', playNextTrack);
  prevBtn?.addEventListener('click', playPrevTrack);
  audio?.addEventListener('ended', playNextTrack);

  // ===============================
  // MEDIA SESSION
  // ===============================
  async function updateMediaSession(track) {
    if (!('mediaSession' in navigator) || !track) return;

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (isIOS && !userHasInteracted) return;
      playPrevTrack();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (isIOS && !userHasInteracted) return;
      playNextTrack();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audio.pause();
    });
    
    navigator.mediaSession.setActionHandler('play', () => {
      audio.play().catch(() => {});
    });

    let squareCover = track.cover;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = track.cover;
      });

      const size = 300;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      const minSide = Math.min(img.width, img.height);
      const sx = (img.width - minSide) / 2;
      const sy = (img.height - minSide) / 2;

      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
      squareCover = canvas.toDataURL('image/jpeg');
    } catch (e) {
      squareCover = track.cover;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album || 'Music Widget',
      artwork: [{ src: squareCover, sizes: '300x300', type: 'image/jpeg' }]
    });
  }

  // ===============================
  // LOAD TRACK
  // ===============================
  window.loadTrack = function(index) {
    const track = window.tracks[index];
    if (!track) return;

    window.currentIndex = index;
    
    // Load audio source and preload
    audio.src = track.src;
    audio.load(); // Preload the audio

    updateMarqueeText(track.title, track.artist);

    const bgEl = document.querySelector('.bg-image');
    if (bgEl && track.cover) bgEl.style.backgroundImage = `url('${track.cover}')`;

    if (disc && track.cover) {
      disc.src = track.cover;
      if (!audio.paused) {
        disc.classList.add('spin');
        disc.style.animationPlayState = 'running';
      } else {
        disc.classList.remove('spin');
        disc.style.transform = 'rotate(0deg)';
      }
    }

    updateActiveTrack();
  };

  // ===============================
  // UPDATE ACTIVE TRACK
  // ===============================
  function updateActiveTrack() {
    if (!playlistTracks) return;

    playlistTracks.querySelectorAll('.playlist-item').forEach(item => {
      item.classList.toggle('active', Number(item.dataset.index) === window.currentIndex);
    });

    const active = playlistTracks.querySelector('.playlist-item.active');
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    updateActiveArtistHeader();
  }

  function updateActiveArtistHeader() {
    if (!playlistTracks || window.currentIndex == null) return;

    const currentArtist = window.tracks[window.currentIndex]?.artist;

    playlistTracks.querySelectorAll('.playlist-artist-header').forEach(header => {
      const artistName = header.querySelector('span')?.textContent?.trim();
      header.classList.toggle('active', artistName === currentArtist);
    });
  }

  // ===============================
  // PLAYLIST RENDERING
  // ===============================
  function renderPlaylist() {
    if (!playlistTracks || !window.tracks) return;
    playlistTracks.innerHTML = '';

    const currentTrackKey = getCurrentTrackKey();
    sortTracks();

    let renderedIndices = [];
    let currentArtist = window.currentIndex != null ? window.tracks[window.currentIndex].artist : null;

    if (sortMode === 'artist') {
      const tracksByArtist = groupTracksByArtist(window.tracks);
      Object.keys(tracksByArtist)
        .sort((a, b) => sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a))
        .forEach(artist => {
          const matchingTracks = tracksByArtist[artist].filter(matchesSearch)
            .sort((a, b) => sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
          if (!matchingTracks.length) return;

          const header = document.createElement('div');
          header.className = 'playlist-artist-header';
          if (artist === currentArtist) header.classList.add('active');
          header.innerHTML = `<span class="marquee-mask"><span class="marquee-text">${artist}</span></span><span class="toggle-arrow">${collapsedArtists.has(artist) ? '▶' : '▼'}</span>`;
          header.addEventListener('click', e => {
            e.stopPropagation();
            collapsedArtists.has(artist) ? collapsedArtists.delete(artist) : collapsedArtists.add(artist);
            renderPlaylist();
          });

          playlistTracks.appendChild(header);
          if (collapsedArtists.has(artist)) return;

          matchingTracks.forEach(track => {
            const trackIndex = window.tracks.indexOf(track);
            renderedIndices.push(trackIndex);
            createPlaylistItem(track, trackIndex);
          });
        });
    } else {
      window.tracks
        .map((track, i) => ({ track, originalIndex: i }))
        .filter(({ track }) => matchesSearch(track))
        .forEach(({ track, originalIndex }) => {
          renderedIndices.push(originalIndex);
          createPlaylistItem(track, originalIndex);
        });
    }

    playQueue = renderedIndices;
    queueIndex = playQueue.indexOf(window.currentIndex ?? 0);

    restoreCurrentIndex(currentTrackKey);
  }

  function createPlaylistItem(track, index) {
    const item = document.createElement('div');
    item.className = 'playlist-item';
    item.dataset.index = index;
    if (index === window.currentIndex) item.classList.add('active');
    item.innerHTML = `
      <img src="${track.cover}" class="playlist-item-cover"/>
      <div class="playlist-item-info">
        <p class="playlist-item-title">${track.title}</p>
        <p class="playlist-item-artist">${track.artist}</p>
      </div>
      <button class="playlist-fav-btn ${isFavorite(track) ? 'active' : ''}">♥</button>
    `;

    item.addEventListener('click', () => {
      playMode = 'normal';
      queueIndex = playQueue.indexOf(index);
      window.currentIndex = index;
      window.loadTrack(index);
      audio.play().catch(() => {});
      syncWidgetFavorite();
      updateMediaSession(window.tracks[index]);
    });

    item.querySelector('.playlist-fav-btn').addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(track);
      renderPlaylist();
      renderFavorites();
      syncWidgetFavorite();
    });

    playlistTracks.appendChild(item);
  }

  // ===============================
  // FAVORITES RENDER
  // ===============================
  function renderFavorites() {
    if (!favoritesTracks || !window.tracks?.length) return;

    favoritesTracks.innerHTML = '';
    const favKeys = getFavorites();
    const favTracks = window.tracks.filter(t => favKeys.includes(trackKey(t)));

    if (!favTracks.length) {
      favoritesTracks.innerHTML = `<p style="opacity:.6;padding:16px;">No favorites yet</p>`;
      return;
    }

    favoritesQueue = favTracks.map(t => window.tracks.indexOf(t));

    favTracks.forEach(track => {
      const index = window.tracks.indexOf(track);
      const item = document.createElement('div');
      item.className = 'playlist-item';

      item.innerHTML = `
        <img src="${track.cover}" class="playlist-item-cover">
        <div class="playlist-item-info">
          <p class="playlist-item-title">${track.title}</p>
          <p class="playlist-item-artist">${track.artist}</p>
        </div>
        <button class="playlist-fav-btn active">♥</button>
      `;

      item.addEventListener('click', () => {
        playMode = 'favorites';
        favoritesIndex = favoritesQueue.indexOf(index);
        window.currentIndex = index;
        window.loadTrack(index);
        audio.play().catch(() => {});
        syncWidgetFavorite();
      });

      item.querySelector('.playlist-fav-btn').addEventListener('click', e => {
        e.stopPropagation();
        toggleFavorite(track);
        renderFavorites();
        renderPlaylist();
        syncWidgetFavorite();
      });

      favoritesTracks.appendChild(item);
    });
  }

  // ===============================
  // WIDGET FAVORITE BUTTON
  // ===============================
  function syncWidgetFavorite() {
    if (!widgetFavBtn || window.currentIndex == null) return;
    const track = window.tracks[window.currentIndex];
    widgetFavBtn.classList.toggle('active', isFavorite(track));
  }

  widgetFavBtn?.addEventListener('click', () => {
    if (window.currentIndex == null) return;
    toggleFavorite(window.tracks[window.currentIndex]);
    renderFavorites();
    renderPlaylist();
    syncWidgetFavorite();
  });

  // ===============================
  // HELPER FUNCTIONS
  // ===============================
  function getCurrentTrackKey() {
    if (!window.tracks || window.currentIndex == null) return null;
    const t = window.tracks[window.currentIndex];
    return `${t.title}__${t.artist}`;
  }

  function restoreCurrentIndex(key) {
    if (!key) return;
    const i = window.tracks.findIndex(t => `${t.title}__${t.artist}` === key);
    if (i !== -1) window.currentIndex = i;
  }

  function sortTracks() {
    const key = getCurrentTrackKey();
    window.tracks.sort((a, b) => {
      const A = sortMode === 'artist' ? a.artist : a.title;
      const B = sortMode === 'artist' ? b.artist : b.title;
      return sortOrder === 'asc' ? A.localeCompare(B) : B.localeCompare(A);
    });
    restoreCurrentIndex(key);
  }

  function groupTracksByArtist(tracks) {
    return tracks.reduce((acc, t) => (acc[t.artist] ||= []).push(t) && acc, {});
  }

  // ===============================
  // INITIALIZE PLAYLIST
  // ===============================
  function initPlaylist() {
    if (!window.tracks?.length) return;

    updateSortButtonState();
    renderPlaylist();
    
    // Initialize play/pause icons correctly on load
    updatePlayPauseIcons(!audio.paused);

    // Initialize media session immediately on page load
    if (window.currentIndex != null) {
      updateMediaSession(window.tracks[window.currentIndex]);
      syncWidgetFavorite(); // Sync after setting current index
    } else if (window.tracks[0]) {
      // If no track is set, use the first track
      window.currentIndex = 0;
      updateMediaSession(window.tracks[0]);
      syncWidgetFavorite(); // Sync after setting current index
    }

    playQueue = window.tracks.map((_, i) => i);
    queueIndex = window.currentIndex || 0;
    
    // Sync again after a short delay to ensure DOM is ready
    setTimeout(() => {
      syncWidgetFavorite();
    }, 100);
  }

  if (window.tracks?.length) {
    initPlaylist();
  } else {
    document.addEventListener('tracksLoaded', initPlaylist);
  }

  window.tracks ? initPlaylist() : document.addEventListener('DOMContentLoaded', () => setTimeout(initPlaylist, 100));

})();