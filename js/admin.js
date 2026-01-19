// js/admin.js
(async function () {
    const tracksBody = document.getElementById('tracks-body');
    const addForm = document.getElementById('add-track-form');
    const trackCount = document.getElementById('track-count');
    const searchInput = document.getElementById('admin-search');

    // New elements for edit/cancel
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const trackIdInput = document.getElementById('track-id');
    const formTitle = document.getElementById('form-title');

    let tracks = [];

    // Fetch initial playlist
    try {
        const res = await fetch('assets/playlist.json');
        if (!res.ok) throw new Error('Failed to load playlist');
        tracks = await res.json();
        renderTracks();
    } catch (err) {
        console.error(err);
        alert('Error loading playlist.json');
    }

    // Render tracks to table
    function renderTracks(filter = '') {
        tracksBody.innerHTML = '';
        const filtered = tracks.filter(t =>
            t.title.toLowerCase().includes(filter.toLowerCase()) ||
            t.artist.toLowerCase().includes(filter.toLowerCase())
        );

        trackCount.textContent = tracks.length;

        // Show newest first
        filtered.slice().reverse().forEach(track => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td>#${track.id}</td>
        <td>
          <img src="${track.cover}" class="track-cover" onerror="this.src='assets/icons/music.png'">
        </td>
        <td class="track-info-cell">
          <h4>${track.title}</h4>
          <p>${track.artist}</p>
          <small style="opacity:0.6; font-family:monospace; font-size:0.8em;">${track.src.split('/').pop()}</small>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-primary btn-sm edit-btn" data-id="${track.id}">Edit</button>
            <button class="btn btn-danger btn-sm delete-btn" data-id="${track.id}">✕</button>
          </div>
        </td>
      `;
            tracksBody.appendChild(tr);
        });

        // Attach event listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                deleteTrack(id);
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                editTrack(id);
            });
        });
    }

    // UI Helper: Update label when file is selected (No upload yet)
    function updateFileLabel(fileInput, textLabelId) {
        const file = fileInput.files[0];
        if (!file) return;

        const labelText = document.getElementById(textLabelId);
        if (labelText) {
            labelText.style.opacity = '1';
            labelText.innerText = file.name;
            fileInput.closest('label').classList.add('has-file');
        }
    }

    document.getElementById('src-file').addEventListener('change', function () {
        updateFileLabel(this, 'src-text');
    });

    document.getElementById('cover-file').addEventListener('change', function () {
        updateFileLabel(this, 'cover-text');
    });

    // Helper: Upload a single file
    async function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) return data.path;
            throw new Error(data.error);
        } catch (err) {
            throw err;
        }
    }

    // EDIT Functionality
    function editTrack(id) {
        const track = tracks.find(t => t.id === id);
        if (!track) return;

        // Populate form
        trackIdInput.value = track.id;
        document.getElementById('title').value = track.title;
        document.getElementById('artist').value = track.artist;
        // Note: src and cover file inputs are not directly populated for security reasons.
        // Their hidden counterparts are no longer used for paths.

        // Update specific file labels if they have values
        const srcLabel = document.getElementById('src-text');
        const coverLabel = document.getElementById('cover-text');

        // Show current filename (or just "Current File" since we can't get original filename from path easily)
        srcLabel.innerText = track.src.split('/').pop();
        srcLabel.style.opacity = '1';
        srcLabel.closest('label').classList.add('has-file');

        coverLabel.innerText = track.cover.split('/').pop();
        coverLabel.style.opacity = '1';
        coverLabel.closest('label').classList.add('has-file');

        // UI Updates
        formTitle.textContent = 'Edit Track';
        submitBtn.textContent = '💾 Update Track';
        submitBtn.classList.remove('btn-success');
        submitBtn.classList.add('btn-primary');
        cancelBtn.classList.remove('hidden');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // CANCEL Functionality
    cancelBtn.addEventListener('click', resetForm);

    function resetForm() {
        addForm.reset();
        trackIdInput.value = '';

        // Reset labels
        const srcLabel = document.getElementById('src-text');
        const coverLabel = document.getElementById('cover-text');
        srcLabel.innerText = 'Audio File...';
        srcLabel.style.opacity = '0.8';
        srcLabel.closest('label').classList.remove('has-file');

        coverLabel.innerText = 'Cover Image...';
        coverLabel.style.opacity = '0.8';
        coverLabel.closest('label').classList.remove('has-file');

        // Reset UI
        formTitle.textContent = 'Add New Track';
        submitBtn.textContent = '➕ Add Track';
        submitBtn.classList.add('btn-success');
        submitBtn.classList.remove('btn-primary');
        cancelBtn.classList.add('hidden');
    }

    // Handle Submit (Add or Update)
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form values
        const title = document.getElementById('title').value.trim();
        const artist = document.getElementById('artist').value.trim();
        const id = trackIdInput.value ? parseInt(trackIdInput.value) : null;

        // Get files
        const srcFile = document.getElementById('src-file').files[0];
        const coverFile = document.getElementById('cover-file').files[0];

        const submitButton = document.getElementById('submit-btn');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Uploading...';

        try {
            if (id) {
                // --- UPDATE MODE ---
                const index = tracks.findIndex(t => t.id === id);
                if (index === -1) throw new Error('Track not found');

                const originalTrack = tracks[index];
                let finalSrc = originalTrack.src;
                let finalCover = originalTrack.cover;

                // Upload new files if selected
                if (srcFile) {
                    finalSrc = await uploadFile(srcFile);
                    // Only delete old file if path has changed (prevent deleting overwrite)
                    if (originalTrack.src !== finalSrc) {
                        await deleteFile(originalTrack.src);
                    }
                }
                if (coverFile) {
                    finalCover = await uploadFile(coverFile);
                    if (originalTrack.cover !== finalCover) {
                        await deleteFile(originalTrack.cover);
                    }
                }

                tracks[index] = {
                    ...originalTrack,
                    title: title || originalTrack.title,
                    artist: artist || originalTrack.artist,
                    src: finalSrc,
                    cover: finalCover
                };
                alert(`Updated "${title}"!`);

            } else {
                // --- ADD MODE ---
                // Validate files are present for new track
                if (!srcFile || !coverFile) {
                    alert('Please select both an audio file and a cover image.');
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                    return;
                }

                // Upload files
                const srcPath = await uploadFile(srcFile);
                const coverPath = await uploadFile(coverFile);

                const maxId = tracks.length > 0 ? Math.max(...tracks.map(t => t.id)) : 0;
                const newTrack = {
                    id: maxId + 1,
                    title,
                    artist,
                    src: srcPath,
                    cover: coverPath
                };
                tracks.push(newTrack);
                alert(`Added "${title}"!`);
            }

            // Save and Refresh
            await saveToServer();
            renderTracks(searchInput.value);
            resetForm();

        } catch (err) {
            console.error(err);
            alert('Error: ' + err.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    });

    // Delete track
    async function deleteTrack(id) {
        if (!confirm('Are you sure you want to delete this track? This will also delete the associated files.')) return;

        const track = tracks.find(t => t.id === id);
        if (track) {
            // Delete associated files
            await deleteFile(track.src);
            await deleteFile(track.cover);
        }

        tracks = tracks.filter(t => t.id !== id);
        await saveToServer();
        renderTracks(searchInput.value);
    }

    // Helper to delete file from server
    async function deleteFile(filePath) {
        if (!filePath) return;
        try {
            await fetch('/api/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: filePath })
            });
        } catch (err) {
            console.error('Failed to delete file:', filePath, err);
        }
    }

    // Check server logic extracted
    async function saveToServer() {
        // Re-sort by ID
        const sortedTracks = [...tracks].sort((a, b) => a.id - b.id);

        try {
            const res = await fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sortedTracks)
            });

            if (!res.ok) {
                const data = await res.json();
                console.error('Save error:', data);
                alert('Error saving to disk!');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to connect to server.');
        }
    }

    // Search filter
    searchInput.addEventListener('input', (e) => {
        renderTracks(e.target.value);
    });

})();
