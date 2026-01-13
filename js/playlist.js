// ===============================
// PLAYLIST MODULE WITH BACKGROUND SUPPORT
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

  // 🔹 Playback queue
  let playQueue = [];
  let queueIndex = 0;

    // 🔹 detect iOS
    const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent);

    // 🔹 track first user interaction
    let userHasInteracted = false;

    // mark first interaction on your play button
    playBtn?.addEventListener('click', () => {
      if (isIOS) userHasInteracted = true;
    });


    // mark first interaction
    playBtn?.addEventListener('click', () => {
      userHasInteracted = true;
    });
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
  // PLAYLIST VISIBILITY
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
  // TRACK NAVIGATION
  // ===============================
  function playNextTrack() {
    if (!playQueue.length) return;
    queueIndex = (queueIndex + 1) % playQueue.length;
    window.currentIndex = playQueue[queueIndex];
    window.loadTrack(window.currentIndex);
    audio.play().catch(() => {});
    updateActiveTrack();
    updateMediaSession(window.tracks[window.currentIndex]);
  }

  function playPrevTrack() {
    if (!playQueue.length) return;
    queueIndex = (queueIndex - 1 + playQueue.length) % playQueue.length;
    window.currentIndex = playQueue[queueIndex];
    window.loadTrack(window.currentIndex);
    audio.play().catch(() => {});
    updateActiveTrack();
    updateMediaSession(window.tracks[window.currentIndex]);
  }

  nextBtn?.addEventListener('click', playNextTrack);
  prevBtn?.addEventListener('click', playPrevTrack);
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
      artwork: [{ src: track.cover, sizes: '96x96', type: 'image/jpeg' }]
    });

    navigator.mediaSession.setActionHandler('previoustrack', playPrevTrack);
    navigator.mediaSession.setActionHandler('nexttrack', playNextTrack);
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('play', () => audio.play());


    navigator.mediaSession.setActionHandler('previoustrack', () => {
  if (isIOS && !userHasInteracted) return; // block until first tap
  playPrevTrack();
});

navigator.mediaSession.setActionHandler('nexttrack', () => {
  if (isIOS && !userHasInteracted) return; // block until first tap
  playNextTrack();
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

  // Update title & artist
  titleEl.textContent = track.title;
  artistEl.textContent = track.artist;

  // Update background
  const bgEl = document.querySelector('.bg-image');
  if (bgEl && track.cover) bgEl.style.backgroundImage = `url('${track.cover}')`;

  // 🔹 Update spinning disc
  if (disc && track.cover) {
    disc.src = track.cover;  // update the <img> source directly
    disc.classList.add('spin');
    disc.style.animationPlayState = audio.paused ? 'paused' : 'running';
  }


  // Update playlist active item & artist header
  updateActiveTrack();
};

  // ===============================
  // UPDATE ACTIVE TRACK
  // ===============================
  function updateActiveTrack() {
    playlistTracks.querySelectorAll('.playlist-item').forEach(item => {
      item.classList.toggle('active', Number(item.dataset.index) === window.currentIndex);
    });

    const active = playlistTracks.querySelector('.playlist-item.active');
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    updateActiveArtistHeader(); // 🔹 immediately highlight artist header
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

          // Artist header
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

    // 🔹 update playQueue to current rendered order
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

    // 🔹 clicking track plays immediately and updates headers
    item.addEventListener('click', () => {
      queueIndex = playQueue.indexOf(index);
      window.loadTrack(index);       // 🔹 loadTrack updates UI immediately
      audio.play().catch(() => {});
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

    // initialize full playlist queue
    playQueue = window.tracks.map((_, i) => i);
    queueIndex = window.currentIndex || 0;
  }

  window.tracks ? initPlaylist() : document.addEventListener('DOMContentLoaded', () => setTimeout(initPlaylist, 100));

})();