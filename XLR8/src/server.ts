/**
 * XLR8 REBORN - PUNTO DE ENTRADA (TypeScript)
 * ------------------------------------------
 * Este es el archivo principal que une todo.
 * Importamos la base de datos y los tipos para que sea un proyecto modular.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

// Importamos nuestra propia lógica modular 👨‍🏫
import { db, initDB } from './database.js'; 
import { Song, Playlist } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5174;

// Inicializamos la Base de Datos
initDB();

// --- CONFIGURACIÓN DE ALMACENAMIENTO ---
const uploadDir = path.join(__dirname, '..', 'uploads'); // Subimos un nivel porque estamos en /src
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(uploadDir));

// --- API ---

// Subida de archivos (Carga real)
app.post('/api/upload', upload.single('file'), (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ error: 'Falta archivo' });
    res.json({ url: `/uploads/${req.file.filename}` });
});

// Guardar nueva Playlist
app.post('/api/playlists', (req: Request, res: Response) => {
    const { name, image } = req.body;
    db.run("INSERT INTO playlists (name, image) VALUES (?, ?)", [name, image], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name, image, songs: [] });
    });
});

// Guardar nueva Canción
app.post('/api/songs', (req: Request, res: Response) => {
    const { playlist_id, title, artist, album, genre, duration, artwork_url, path, filename } = req.body;
    db.run(`INSERT INTO songs (playlist_id, title, artist, album, genre, duration, artwork_url, path, filename) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [playlist_id, title, artist, album, genre, duration, artwork_url, path, filename], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, ...req.body });
    });
});

// Obtener todas las playlists usando Tipos Propios
app.get('/api/playlists', (req: Request, res: Response) => {
    db.all("SELECT * FROM playlists", (err, playlists: Playlist[]) => {
        if (err) return res.status(500).json({ error: err.message });
        const list = playlists.map(pl => {
            return new Promise((resolve) => {
                db.all("SELECT * FROM songs WHERE playlist_id = ? ORDER BY position ASC, id ASC", [pl.id], (err, songs) => {
                    pl.songs = songs as Song[] || [];
                    resolve(pl);
                });
            });
        });
        Promise.all(list).then(data => res.json(data));
    });
});

// Borrar canciones
app.delete('/api/songs/:id', (req: Request, res: Response) => {
    db.run("DELETE FROM songs WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`  🚀 XLR8 REBORN [SISTEMA MODULAR TS]`);
    console.log(`  Acceso: http://localhost:${PORT}`);
    console.log(`===============================================`);
});
