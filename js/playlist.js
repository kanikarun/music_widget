// ===============================
// PLAYLIST MODULE WITH FULL QUEUE SYNC AND BACKGROUND SUPPORT
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

  const playBtn = document.getElementById('play-inline');
  const playIcon = playBtn.querySelector('.play-icon');
  const pauseIcon = playBtn.querySelector('.pause-icon');
  const audio = document.getElementById('audio');
  const disc = document.getElementById('disc');

  const nextBtn = document.getElementById('next');
  const prevBtn = document.getElementById('prev');

  let isPlaylistOpen = false;
  let sortMode = localStorage.getItem('playlistSortMode') || 'title';
  let sortOrder = localStorage.getItem('playlistSortOrder') || 'asc';
  const collapsedArtists = new Set();
  let searchQuery = '';

  // Playback queue and current index
  let playQueue = [];
  let queueIndex = 0;
  let userHasInteracted = false;

  // ===============================
  // PLAY/PAUSE ICONS
  // ===============================
  function updatePlayPauseIcons(isPlaying) {
    playIcon.style.display = isPlaying ? 'none' : 'inline';
    pauseIcon.style.display = isPlaying ? 'inline' : 'none';
    if (disc) {
      disc.classList.add('spin');
      disc.style.animationPlayState = isPlaying ? 'running' : 'paused';
    }
  }

  audio.addEventListener('play', () => updatePlayPauseIcons(true));
  audio.addEventListener('pause', () => updatePlayPauseIcons(false));

  // ===============================
  // USER INTERACTION INIT (iOS)
  // ===============================
  playBtn?.addEventListener('click', () => {
    userHasInteracted = true;
    audio.play().catch(()=>{});
  });

  // ===============================
  // PLAYLIST TOGGLE
  // ===============================
  function togglePlaylist() {
    isPlaylistOpen = !isPlaylistOpen;
    playlistOverlay.classList.toggle('show', isPlaylistOpen);
    if (isPlaylistOpen) renderPlaylist();
  }
  function closePlaylist() {
    isPlaylistOpen = false;
    playlistOverlay.classList.remove('show');
  }

  playlistToggle?.addEventListener('click', togglePlaylist);
  playlistClose?.addEventListener('click', closePlaylist);
  playlistOverlay?.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', e => {
    if (isPlaylistOpen && !playlistOverlay.contains(e.target) && !playlistToggle.contains(e.target))
      closePlaylist();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePlaylist(); });

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

  sortTitleBtn?.addEventListener('click', () => { sortMode = 'title'; savePreferences(); updateSortButtonState(); renderPlaylist(); });
  sortArtistBtn?.addEventListener('click', () => { sortMode = 'artist'; savePreferences(); updateSortButtonState(); renderPlaylist(); });
  sortOrderBtn?.addEventListener('click', () => { sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'; savePreferences(); updateSortButtonState(); renderPlaylist(); });

  function savePreferences() {
    localStorage.setItem('playlistSortMode', sortMode);
    localStorage.setItem('playlistSortOrder', sortOrder);
  }

  // ===============================
  // PLAY/PAUSE & NEXT/PREV HANDLERS
  // ===============================
  function playNextTrack() {
    if (!playQueue.length) return;
    if (queueIndex < 0 || queueIndex >= playQueue.length) {
      queueIndex = playQueue.indexOf(window.currentIndex);
      if (queueIndex < 0) queueIndex = 0;
    }
    queueIndex = (queueIndex + 1) % playQueue.length;
    window.currentIndex = playQueue[queueIndex];
    window.loadTrack(window.currentIndex);
    if (userHasInteracted) audio.play().catch(()=>{});
    updateActiveTrack();
    updateMediaSession(window.tracks[window.currentIndex]);
  }

  function playPrevTrack() {
    if (!playQueue.length) return;
    if (queueIndex < 0 || queueIndex >= playQueue.length) {
      queueIndex = playQueue.indexOf(window.currentIndex);
      if (queueIndex < 0) queueIndex = 0;
    }
    queueIndex = (queueIndex - 1 + playQueue.length) % playQueue.length;
    window.currentIndex = playQueue[queueIndex];
    window.loadTrack(window.currentIndex);
    if (userHasInteracted) audio.play().catch(()=>{});
    updateActiveTrack();
    updateMediaSession(window.tracks[window.currentIndex]);
  }

  // Attach buttons for click + touch
  [nextBtn, prevBtn].forEach((btn, idx) => {
    if (!btn) return;
    const handler = idx === 0 ? playNextTrack : playPrevTrack;
    btn.addEventListener('click', handler);
    btn.addEventListener('touchend', e => { e.preventDefault(); handler(); });
  });

  audio?.addEventListener('ended', playNextTrack);

  // ===============================
  // MEDIA SESSION API
  // ===============================
  function updateMediaSession(track) {
    if (!('mediaSession' in navigator) || !track) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album || 'Music Widget',
      artwork: [
        { src: track.cover, sizes: '96x96', type: 'image/jpeg' },
        { src: track.cover, sizes: '512x512', type: 'image/jpeg' }
      ]
    });

    navigator.mediaSession.setActionHandler('previoustrack', playPrevTrack);
    navigator.mediaSession.setActionHandler('nexttrack', playNextTrack);
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('play', () => {
      if (userHasInteracted) audio.play().catch(()=>{});
    });
  }

  // ===============================
  // LOAD TRACK
  // ===============================
  window.loadTrack = function(index) {
    const track = window.tracks[index];
    if (!track) return;

    window.currentIndex = index;
    audio.src = track.src;

    titleEl.textContent = track.title;
    artistEl.textContent = track.artist;

    const bgEl = document.querySelector('.bg-image');
    if (bgEl && track.cover) bgEl.style.backgroundImage = `url('${track.cover}')`;

    if (disc && track.cover) {
      disc.src = track.cover;
      disc.classList.add('spin');
      disc.style.animationPlayState = audio.paused ? 'paused' : 'running';
    }

    updateActiveTrack();
    updateMediaSession(track);
  };

  // ===============================
  // ACTIVE TRACK HIGHLIGHT
  // ===============================
  function updateActiveTrack() {
    playlistTracks.querySelectorAll('.playlist-item').forEach(item => {
      item.classList.toggle('active', Number(item.dataset.index) === window.currentIndex);
    });

    const active = playlistTracks.querySelector('.playlist-item.active');
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    updateActiveArtistHeader();
  }

  function updateActiveArtistHeader() {
    if (!playlistTracks) return;
    const currentArtist = window.currentIndex != null ? window.tracks[window.currentIndex].artist : null;
    playlistTracks.querySelectorAll('.playlist-artist-header').forEach(header => {
      const artistName = header.querySelector('span:first-child')?.textContent;
      header.classList.toggle('active', artistName === currentArtist);
    });
  }

  // ===============================
  // RENDER PLAYLIST
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
          header.innerHTML = `<span>${artist}</span><span>${collapsedArtists.has(artist) ? '▶' : '▼'}</span>`;
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
    `;

    item.addEventListener('click', () => {
      queueIndex = playQueue.indexOf(index);
      window.loadTrack(index);
      if (userHasInteracted) audio.play().catch(()=>{});
      updateMediaSession(window.tracks[index]);
    });

    playlistTracks.appendChild(item);
  }

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

    if (window.currentIndex != null) updateMediaSession(window.tracks[window.currentIndex]);
    updatePlayPauseIcons(!audio.paused);

    playQueue = window.tracks.map((_, i) => i);
    queueIndex = window.currentIndex || 0;
  }

  window.tracks ? initPlaylist() : document.addEventListener('DOMContentLoaded', () => setTimeout(initPlaylist, 100));

})();
