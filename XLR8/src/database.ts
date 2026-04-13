/**
 * XLR8 REBORN - GESTIÓN DE BASE DE DATOS
 * --------------------------------------
 * En este archivo separamos toda la lógica de SQL.
 * Así el proyecto es más fácil de mantener y el código está más limpio.
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'xlr8_reborn.db');

export const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('❌ Error de Base de Datos:', err);
    else {
        console.log('✅ Motor SQL: Listo y Conectado');
        db.run("PRAGMA foreign_keys = ON");
    }
});

/**
 * Función para inicializar las tablas de la base de datos.
 * Esto asegura que la primera vez que se ejecute el programa, todo esté configurado.
 */
export const initDB = () => {
    db.serialize(() => {
        // Tabla de Listas de Reproducción
        db.run(`CREATE TABLE IF NOT EXISTS playlists (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            image TEXT
        )`);

        // Tabla de Canciones vinculada a las listas
        db.run(`CREATE TABLE IF NOT EXISTS songs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            playlist_id INTEGER,
            title TEXT,
            artist TEXT,
            album TEXT,
            genre TEXT,
            duration REAL,
            artwork_url TEXT,
            path TEXT,
            filename TEXT,
            position INTEGER DEFAULT 0,
            FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE
        )`);
    });
};
