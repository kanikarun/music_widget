// js/tracks-loader.js
(async function () {
  try {
    const res = await fetch('assets/playlist.json');
    if (!res.ok) throw new Error('playlist.json not found');

    const tracks = await res.json();

    if (!Array.isArray(tracks)) {
      throw new Error('playlist.json must be an array');
    }

    // Safety checks (prevents future errors)
    const ids = new Set();
    tracks.forEach((t, i) => {
      if (typeof t.id !== 'number') {
        throw new Error(`Track #${i + 1} missing id`);
      }
      if (ids.has(t.id)) {
        throw new Error(`Duplicate id ${t.id}`);
      }
      ids.add(t.id);

      if (!t.title || !t.artist || !t.src || !t.cover) {
        throw new Error(`Track id ${t.id} missing fields`);
      }
    });

    window.tracks = tracks;

    // Notify playlist.js
    document.dispatchEvent(new Event('tracksLoaded'));

    console.log(`✅ Loaded ${tracks.length} tracks`);
  } catch (err) {
    console.error('❌ playlist.json error:', err.message);
    alert('playlist.json error — check commas or fields');
  }
})();
