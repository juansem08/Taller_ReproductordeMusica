/**
 * XLR8 REBORN - SERVIDOR STANDALONE (SENIOR EDITION v1.8.2)
 * --------------------------------------------------------
 * - FIXED: Error de sintaxis en GET /api/playlists.
 * - OPERATIVO: Creación y gestión de Playlists restaurada.
 * - MODO ADITIVO: Conservación blindada.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 5174;

const PROJECT_ROOT = path.resolve(__dirname);
const dbPath = path.join(PROJECT_ROOT, 'xlr8_reborn.db');
const uploadDir = path.join(PROJECT_ROOT, 'uploads');
const publicDir = path.join(PROJECT_ROOT, 'public');

const antiCache = (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
};

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('CRITICAL ERROR:', err);
    } else {
        db.run("PRAGMA foreign_keys = ON");
        console.log('✅ Base de datos conectada:', dbPath);
        runAdditiveSync();
    }
});

function runAdditiveSync() {
    console.log('🔒 Sincronizando Modo Aditivo v1.8.2...');
    db.serialize(() => {
        db.run("CREATE TABLE IF NOT EXISTS playlists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, image TEXT)");
        db.run(`CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT, 
            playlist_id INTEGER, 
            title TEXT, artist TEXT, album TEXT, genre TEXT, duration REAL, 
            artwork_url TEXT, path TEXT, filename TEXT, position INTEGER DEFAULT 0,
            FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE
        )`);

        db.get("SELECT id FROM playlists WHERE id = 1", (err, pl) => {
            if (!pl) {
                db.run("INSERT INTO playlists (id, name, image) VALUES (1, 'Mi Música', 'linear-gradient(135deg, #10b98122 0%, #000 70%)')", () => startServer());
            } else {
                startServer();
            }
        });
    });
}

function startServer() {
    app.use(cors());
    app.use(express.json({ limit: '50mb' }));
    app.use(antiCache);
    app.use(express.static(publicDir));
    app.use('/uploads', express.static(uploadDir));

    // --- API PLAYLISTS ---
    app.get('/api/playlists', (req, res) => {
        db.all("SELECT * FROM playlists ORDER BY id ASC", (err, playlists) => {
            if (err) return res.status(500).json({ error: err.message });
            const list = (playlists || []).map(pl => {
                return new Promise((resolve) => {
                    db.all("SELECT * FROM songs WHERE playlist_id = ? ORDER BY id ASC", [pl.id], (err, songs) => {
                        pl.songs = songs || [];
                        resolve(pl);
                    });
                });
            });
            Promise.all(list).then(data => res.json(data));
        });
    });

    app.post('/api/playlists', (req, res) => {
        const { name, image } = req.body;
        db.run("INSERT INTO playlists (name, image) VALUES (?, ?)", [name, image], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, name, image, songs: [] });
        });
    });

    app.delete('/api/playlists/:id', (req, res) => {
        db.run("DELETE FROM playlists WHERE id = ?", [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });

    // --- API SONGS ---
    app.post('/api/songs', (req, res) => {
        const { playlist_id, title, artist, album, genre, duration, artwork_url, path, filename } = req.body;
        const plId = parseInt(playlist_id) || 1;
        db.run(`INSERT INTO songs (playlist_id, title, artist, album, genre, duration, artwork_url, path, filename) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                [plId, title, artist, album, genre, duration, artwork_url, path, filename], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, ...req.body, playlist_id: plId });
        });
    });

    app.delete('/api/songs/:id', (req, res) => {
        db.run("DELETE FROM songs WHERE id = ?", [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });

    app.put('/api/songs/:id', (req, res) => {
        const { title, artist, album, artwork_url } = req.body;
        db.run(`UPDATE songs SET title = ?, artist = ?, album = ?, artwork_url = ? WHERE id = ?`, 
                [title, artist, album, artwork_url, req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });

    // --- REORDENAMIENTO ---
    app.put('/api/playlists/:id/reorder', (req, res) => {
        const { songIds } = req.body;
        if (!songIds || !Array.isArray(songIds)) return res.status(400).json({ error: 'Payload inválido' });
        
        if (songIds.length === 0) return res.json({ success: true });

        let completed = 0;
        songIds.forEach((id, index) => {
            db.run("UPDATE songs SET position = ? WHERE id = ?", [index, id], (err) => {
                completed++;
                if (completed === songIds.length) {
                    res.json({ success: true });
                }
            });
        });
    });

    app.post('/api/upload', upload.single('file'), (req, res) => {
        if (!req.file) return res.status(400).json({ error: 'Payload vacío' });
        res.json({ url: `/uploads/${req.file.filename}` });
    });

    app.listen(PORT, () => {
        console.log(`===============================================`);
        console.log(`  🚀 XLR8 REBORN [ENGINE v1.9.1 - FULL PREMIUM]`);
        console.log(`  http://localhost:${PORT}`);
        console.log(`===============================================`);
    });
}
