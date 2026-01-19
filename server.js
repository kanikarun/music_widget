const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = 'assets/misc';
        if (file.mimetype.startsWith('image/')) {
            uploadPath = 'assets/images';
        } else if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
            uploadPath = 'assets/audio';
        }

        // Create directory if it doesn't exist
        fs.mkdirSync(path.join(__dirname, uploadPath), { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Use original filename, overwriting existing files with same name
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static files from root

// Routes

// POST /api/upload - Handle file upload
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the relative path for the frontend to use
    // Replace backslashes with forward slashes for URL compatibility
    const relativePath = req.file.path.replace(/\\/g, '/');

    res.json({
        message: 'File uploaded successfully',
        path: relativePath
    });
});

// POST /api/save - Save playlist to disk
app.post('/api/save', (req, res) => {
    const playlist = req.body;
    const filePath = path.join(__dirname, 'assets', 'playlist.json');

    if (!Array.isArray(playlist)) {
        return res.status(400).json({ error: 'Invalid data format. Expected an array.' });
    }

    // Write to file
    fs.writeFile(filePath, JSON.stringify(playlist, null, 2), (err) => {
        if (err) {
            console.error('Error writing playlist:', err);
            return res.status(500).json({ error: 'Failed to save playlist' });
        }

        console.log(`Playlist updated with ${playlist.length} tracks.`);
        res.json({ message: 'Playlist saved successfully!', count: playlist.length });
    });
});

// POST /api/delete - Delete a file
app.post('/api/delete', (req, res) => {
    const { path: filePath } = req.body;

    if (!filePath) {
        return res.status(400).json({ error: 'No path provided' });
    }

    // Safety check: ensure file is within assets directory
    // Normalize paths to prevent directory traversal attacks
    const fullPath = path.normalize(path.join(__dirname, filePath));
    const assetsPath = path.normalize(path.join(__dirname, 'assets'));

    if (!fullPath.startsWith(assetsPath)) {
        return res.status(403).json({ error: 'Cannot delete files outside assets folder' });
    }

    if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                return res.status(500).json({ error: 'Failed to delete file' });
            }
            console.log(`Deleted file: ${filePath}`);
            res.json({ message: 'File deleted successfully' });
        });
    } else {
        // If file doesn't exist, just return success (idempotent)
        res.json({ message: 'File did not exist, skipped.' });
    }
});

app.get('/api/playlist', (req, res) => {
    const filePath = path.join(__dirname, 'assets', 'playlist.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read playlist' });
        }
        res.json(JSON.parse(data));
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
  🎵 Music Widget Server running at http://localhost:${PORT}
  👉 Admin Panel: http://localhost:${PORT}/admin.html
  `);
});
