// Playlist functionality
(function() {
  const playlistToggle = document.getElementById('playlist-toggle');
  const playlistOverlay = document.getElementById('playlist-overlay');
  const playlistClose = document.getElementById('playlist-close');
  const playlistTracks = document.getElementById('playlist-tracks');

  let isPlaylistOpen = false;

  // Toggle playlist visibility
  function togglePlaylist() {
    isPlaylistOpen = !isPlaylistOpen;
    playlistOverlay.classList.toggle('show', isPlaylistOpen);
  }

  // Close playlist
  function closePlaylist() {
    isPlaylistOpen = false;
    playlistOverlay.classList.remove('show');
  }

  // Render playlist tracks
  function renderPlaylist() {
    if (!playlistTracks || !window.tracks) return;

    playlistTracks.innerHTML = '';

    window.tracks.forEach((track, index) => {
      const item = document.createElement('div');
      item.className = 'playlist-item';
      item.dataset.index = index;

      // Check if this is the current track
      if (window.currentIndex === index) {
        item.classList.add('active');
      }

      item.innerHTML = `
        <img src="${track.cover}" alt="${track.title}" class="playlist-item-cover" />
        <div class="playlist-item-info">
          <p class="playlist-item-title">${track.title}</p>
          <p class="playlist-item-artist">${track.artist}</p>
        </div>
      `;

      // Click to play track
      item.addEventListener('click', () => {
        if (window.loadTrack && window.playCurrent) {
          window.loadTrack(index);
          window.playCurrent();
          updateActiveTrack();
        }
      });

      playlistTracks.appendChild(item);
    });
  }

  // Update active track highlighting
  function updateActiveTrack() {
    const items = playlistTracks.querySelectorAll('.playlist-item');
    items.forEach((item, index) => {
      item.classList.toggle('active', index === window.currentIndex);
    });

    // Auto-scroll to active track
    const activeItem = playlistTracks.querySelector('.playlist-item.active');
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // Event listeners
  if (playlistToggle) {
    playlistToggle.addEventListener('click', togglePlaylist);
  }

  if (playlistClose) {
    playlistClose.addEventListener('click', closePlaylist);
  }

  // Close playlist when clicking outside
  document.addEventListener('click', (e) => {
    if (isPlaylistOpen && 
        !playlistOverlay.contains(e.target) && 
        !playlistToggle.contains(e.target)) {
      closePlaylist();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPlaylistOpen) {
      closePlaylist();
    }
  });

  // Initialize playlist when tracks are loaded
  function initPlaylist() {
    if (window.tracks && window.tracks.length > 0) {
      renderPlaylist();
    }
  }

  // Check if tracks are already loaded, otherwise wait for DOMContentLoaded
  if (window.tracks) {
    initPlaylist();
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      // Wait a bit for tracks to load from external file
      setTimeout(initPlaylist, 100);
    });
  }

  // Update playlist when track changes
  const originalLoadTrack = window.loadTrack;
  if (originalLoadTrack) {
    window.loadTrack = function(index) {
      originalLoadTrack(index);
      updateActiveTrack();
    };
  }

  // Expose function to re-render playlist (useful after loading external playlist)
  window.updatePlaylist = function() {
    renderPlaylist();
  };
})();