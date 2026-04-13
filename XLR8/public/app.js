/**
 * XLR8 REBORN | Core Logic v1.5
 * Protocolo de Sincronización Nuclear y Auto-Enfoque.
 */

class Player {
    constructor() {
        this.audio = new Audio();
        this.playlists = [];
        this.activePlaylistIdx = 0;
        this.currentQueue = [];
        this.currentIdx = -1;
        this.isPlaying = false;
        this.isShuffle = false;

        this.init();
    }

    async init() {
        this.setupAudioEvents();
        this.setupUIEvents();
        await this.loadData();
    }

    setupAudioEvents() {
        this.audio.addEventListener('timeupdate', () => this.updateProgressBar());
        this.audio.addEventListener('ended', () => this.next());
        this.audio.volume = 0.8;
    }

    async loadData() {
        try {
            console.log("☢️ XLR8 SYNC: Iniciando comunicación con el motor...");
            const res = await fetch('/api/playlists?' + Date.now()); // Anti-cache URL
            this.playlists = await res.json();
            
            console.log(`📊 XLR8 SYNC: ${this.playlists.length} listas recibidas.`);

            if (this.playlists.length === 0) {
                const newPl = await this.savePlaylist("Mi Primera Lista", "linear-gradient(135deg, #10b98122 0%, #000 70%)");
                this.playlists = [newPl];
            }

            // AUTO-ENFOQUE: Buscar la primera lista con canciones rescatadas
            const firstWithSongs = this.playlists.findIndex(p => p.songs && p.songs.length > 0);
            if (firstWithSongs !== -1) {
                console.log(`🎯 XLR8 SYNC: Auto-enfocando lista con datos (Index ${firstWithSongs})`);
                this.activePlaylistIdx = firstWithSongs;
            } else {
                this.activePlaylistIdx = 0;
            }
            
            this.render();
            if (firstWithSongs !== -1) this.notify("Sincronización Exitosa: Canciones recuperadas.");
        } catch (e) {
            console.error("CRITICAL SYNC ERROR:", e);
            this.notify("Error de conexión sincronizada", "error");
        }
    }

    async savePlaylist(name, image) {
        const res = await fetch('/api/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, image })
        });
        return await res.json();
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        return data.url;
    }

    async addSong(plId, songData) {
        const res = await fetch('/api/songs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...songData, playlist_id: plId })
        });
        return await res.json();
    }

    async deletePlaylist(id) {
        if (!confirm("¿Eliminar lista de reproducción?")) return;
        const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
        if (res.ok) {
            this.playlists = this.playlists.filter(p => p.id !== id);
            this.activePlaylistIdx = 0;
            this.render();
            this.notify("Playlist eliminada");
        }
    }

    // --- Media Controls ---

    play(idx) {
        const pl = this.playlists[this.activePlaylistIdx];
        if (!pl || !pl.songs[idx]) return;

        this.currentIdx = idx;
        const song = pl.songs[idx];

        this.audio.src = song.path;
        this.audio.play().catch(e => {
            console.error("Play error:", e);
            this.notify("Error al reproducir: Archivo no encontrado", "error");
        });
        this.isPlaying = true;

        this.updatePlayerBar(song);
        this.render();
    }

    toggle() {
        if (!this.audio.src && this.playlists[this.activePlaylistIdx]?.songs.length > 0) {
            this.play(0);
            return;
        }
        if (this.audio.paused) this.audio.play();
        else this.audio.pause();
        this.updatePlayIcon(!this.audio.paused);
    }

    next() {
        const pl = this.playlists[this.activePlaylistIdx];
        if (!pl || pl.songs.length === 0) return;
        let nextIdx = (this.currentIdx + 1) % pl.songs.length;
        this.play(nextIdx);
    }

    prev() {
        const pl = this.playlists[this.activePlaylistIdx];
        if (!pl || pl.songs.length === 0) return;
        let prevIdx = (this.currentIdx - 1 + pl.songs.length) % pl.songs.length;
        this.play(prevIdx);
    }

    async removeSong(id) {
        if (!confirm("¿Eliminar esta canción?")) return;
        const res = await fetch(`/api/songs/${id}`, { method: 'DELETE' });
        if (res.ok) {
            const pl = this.playlists[this.activePlaylistIdx];
            pl.songs = pl.songs.filter(s => s.id !== id);
            this.render();
            this.notify("Canción eliminada");
        }
    }

    // --- Rendering ---

    render() {
        const sidebar = document.getElementById('playlist-container-sidebar');
        sidebar.innerHTML = '';
        this.playlists.forEach((pl, i) => {
            const div = document.createElement('div');
            div.className = `nav-item ${i === this.activePlaylistIdx ? 'active' : ''}`;
            div.innerHTML = `<i class="fas fa-list-ul"></i> <span>${pl.name}</span>`;
            div.onclick = () => {
                this.activePlaylistIdx = i;
                this.render();
            };
            sidebar.appendChild(div);
        });

        const activePl = this.playlists[this.activePlaylistIdx];
        document.getElementById('active-playlist-name').textContent = activePl?.name || "Transmisión";
        
        const songBody = document.getElementById('song-list-body');
        songBody.innerHTML = '';
        if (activePl && activePl.songs) {
            activePl.songs.forEach((s, i) => {
                const tr = document.createElement('tr');
                tr.className = `song-row ${i === this.currentIdx ? 'playing' : ''}`;
                tr.draggable = true; // Activar Drag and Drop
                
                tr.innerHTML = `
                    <td><i class="fas fa-grip-vertical grip-handle" style="opacity: 0.3; margin-right: 10px; cursor: grab;"></i>${i + 1}</td>
                    <td>
                        <div class="song-title-cell">
                            <span class="song-title">${s.title}</span>
                            <span class="song-artist">${s.artist}</span>
                        </div>
                    </td>
                    <td>${s.album}</td>
                    <td>${this.formatTime(s.duration)}</td>
                    <td class="actions-cell">
                        <button class="btn-delete"><i class="fas fa-trash-alt"></i></button>
                    </td>
                `;

                // --- Drag and Drop Events ---
                tr.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', i);
                    tr.style.opacity = '0.5';
                });
                tr.addEventListener('dragend', () => tr.style.opacity = '1');
                tr.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    tr.style.background = 'rgba(255, 255, 255, 0.1)';
                });
                tr.addEventListener('dragleave', () => tr.style.background = '');
                tr.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    tr.style.background = '';
                    const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                    if (fromIdx === i || isNaN(fromIdx)) return;
                    
                    // Rearmar array
                    const item = activePl.songs.splice(fromIdx, 1)[0];
                    activePl.songs.splice(i, 0, item);
                    
                    // Ajustar puntero actual
                    if (this.currentIdx === fromIdx) this.currentIdx = i;
                    else if (this.currentIdx > fromIdx && this.currentIdx <= i) this.currentIdx--;
                    else if (this.currentIdx < fromIdx && this.currentIdx >= i) this.currentIdx++;
                    
                    this.render();
                    
                    // Persistir orden
                    const songIds = activePl.songs.map(song => song.id);
                    await fetch(`/api/playlists/${activePl.id}/reorder`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ songIds })
                    });
                });

                // Control Táctil
                tr.onclick = (e) => {
                    if (e.target.closest('.btn-delete')) {
                        this.removeSong(s.id);
                    } else if (!e.target.closest('.grip-handle')) {
                        this.play(i);
                    }
                };
                songBody.appendChild(tr);
            });
        }

        if (activePl?.image) {
            document.getElementById('app-backdrop').style.background = activePl.image;
        }
    }

    updatePlayerBar(song) {
        document.getElementById('player-title').textContent = song.title;
        document.getElementById('player-artist').textContent = song.artist;
        document.getElementById('total-time').textContent = this.formatTime(song.duration);
        const art = document.getElementById('player-artwork');
        if (song.artwork_url) {
            art.style.backgroundImage = `url("${song.artwork_url}")`;
            art.innerHTML = '';
        } else {
            art.style.backgroundImage = '';
            art.innerHTML = '<i class="fas fa-music"></i>';
        }

        // --- Sincronizar Modo Cine (Fullscreen) ---
        const fsArt = document.getElementById('fs-artwork');
        if (fsArt) {
            fsArt.src = song.artwork_url || '';
            fsArt.style.display = song.artwork_url ? 'block' : 'none';
            
            // Extracción de Color Dinámica
            const fsPlayer = document.getElementById('fullscreen-player');
            if (fsPlayer) {
                if (song.artwork_url) {
                    this.getDominantColor(song.artwork_url).then(color => {
                        fsPlayer.style.background = `linear-gradient(135deg, ${color} 0%, #000 100%)`;
                    });
                } else {
                    fsPlayer.style.background = '#09090b'; // Reset dark
                }
            }
        }
        
        const fsTitle = document.getElementById('fs-title');
        if (fsTitle) fsTitle.textContent = song.title;
        
        const fsArtist = document.getElementById('fs-artist');
        if (fsArtist) fsArtist.textContent = song.artist;
        
        const fsAlbum = document.getElementById('fs-album');
        if (fsAlbum) fsAlbum.textContent = song.album;
    }

    updatePlayIcon(playing) {
        const btn = document.getElementById('btn-play-pause');
        btn.innerHTML = playing ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    }

    updateProgressBar() {
        if (!this.audio.duration) return;
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        
        const fsFill = document.getElementById('fs-progress-fill');
        if (fsFill) fsFill.style.width = `${progress}%`;

        document.getElementById('current-time').textContent = this.formatTime(this.audio.currentTime);
        document.getElementById('total-time').textContent = this.formatTime(this.audio.duration);
    }

    formatTime(sec) {
        if (!sec) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    notify(msg, type = "info") {
        const cont = document.getElementById('notify-container');
        const div = document.createElement('div');
        div.className = `notification ${type}`;
        div.textContent = msg;
        cont.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }

    setupUIEvents() {
        const $ = id => document.getElementById(id);
        $('btn-play-pause').onclick = () => this.toggle();
        $('btn-next').onclick = () => this.next();
        $('btn-prev').onclick = () => this.prev();
        
        // Modo Cine (Fullscreen)
        const btnFullscreen = $('btn-fullscreen');
        const fsPlayer = $('fullscreen-player');
        const btnCloseFs = $('btn-close-fs');
        if (btnFullscreen && fsPlayer && btnCloseFs) {
            btnFullscreen.onclick = () => fsPlayer.classList.add('active');
            btnCloseFs.onclick = () => fsPlayer.classList.remove('active');
        }

        // Temas de Color
        const btnOpenTheme = $('btn-open-theme');
        const modalTheme = $('modal-theme');
        const btnCloseTheme = $('btn-close-theme');
        
        if (btnOpenTheme && modalTheme && btnCloseTheme) {
            btnOpenTheme.onclick = () => modalTheme.classList.add('active');
            btnCloseTheme.onclick = () => modalTheme.classList.remove('active');
            
            document.querySelectorAll('.theme-option').forEach(opt => {
                opt.onclick = () => {
                    const bg = opt.getAttribute('data-bg');
                    document.body.style.background = bg;
                    modalTheme.classList.remove('active');
                    this.notify("Tema de color aplicado");
                };
            });
        }
        
        $('btn-delete-playlist').onclick = () => {
            const pl = this.playlists[this.activePlaylistIdx];
            if (pl) this.deletePlaylist(pl.id);
        };

        const btnRescan = $('btn-rescan-library');
        if (btnRescan) {
            btnRescan.onclick = () => this.rescanLibrary();
        }

        $('btn-open-create-playlist').onclick = () => $('modal-create-playlist').classList.add('active');
        $('btn-cancel-playlist').onclick = () => $('modal-create-playlist').classList.remove('active');
        $('btn-save-playlist').onclick = async () => {
            const name = $('input-playlist-name').value;
            if (name) {
                const newPl = await this.savePlaylist(name, "linear-gradient(135deg, #10b98122 0%, #000 70%)");
                this.playlists.push(newPl);
                this.activePlaylistIdx = this.playlists.length - 1;
                this.render();
                $('input-playlist-name').value = '';
                $('modal-create-playlist').classList.remove('active');
                this.notify("Playlist creada");
            }
        };

        $('btn-import-local').onclick = () => $('input-import-batch').click();
        $('input-import-batch').onchange = (e) => this.handleBatchImport(e.target.files);

        $('progress-bar').onclick = (e) => {
            const rect = $('progress-bar').getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            if (this.audio.duration) this.audio.currentTime = pos * this.audio.duration;
        };

        $('volume-slider').oninput = (e) => this.audio.volume = e.target.value / 100;
    }

    async handleBatchImport(files) {
        if (!files.length) return;
        const pl = this.playlists[this.activePlaylistIdx];
        if (!pl) return;
        this.notify(`Analizando y subiendo ${files.length} pistas...`);

        for (const file of files) {
            try {
                // 1. Leer Metadatos Reales
                const tags = await this.readMetadata(file);
                
                // 2. Subir Archivo Físico
                const permaPath = await this.uploadFile(file);
                
                // 3. Extraer Duración Real
                const realDuration = await this.getAudioDuration(permaPath);
                
                const song = {
                    ...tags,
                    genre: "Varios",
                    duration: realDuration,
                    path: permaPath,
                    filename: file.name
                };
                
                // 4. Registrar en Motor de Datos
                const saved = await this.addSong(pl.id, song);
                pl.songs.push(saved);
                this.render(); // Feedback visual inmediato
            } catch (e) { 
                console.error("Error al importar archivo:", file.name, e); 
            }
        }
        this.notify("Importación completada con éxito");
    }

    async rescanLibrary() {
        const pl = this.playlists[this.activePlaylistIdx];
        if (!pl || !pl.songs || pl.songs.length === 0) return;
        
        if (!confirm("¿Reparar los metadatos de todas las pistas? Esto analizará cada archivo y actualizará los nombres.")) return;

        this.notify("Iniciando escaneo masivo (puede tardar unos segundos)...");
        let repairedCount = 0;

        for (let i = 0; i < pl.songs.length; i++) {
            const song = pl.songs[i];
            try {
                // Fetch the actual file as a blob
                const response = await fetch(song.path);
                const blob = await response.blob();
                
                // Pretend it's a file for jsmediatags
                const pseudoFile = new File([blob], song.filename || "audio.mp3", { type: "audio/mpeg" });
                
                // Read tags
                const tags = await this.readMetadata(pseudoFile);
                
                // Send PUT request to save metadata
                const updateRes = await fetch(`/api/songs/${song.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: tags.title,
                        artist: tags.artist,
                        album: tags.album,
                        artwork_url: tags.artwork_url
                    })
                });

                if (updateRes.ok) {
                    // Update locally
                    song.title = tags.title;
                    song.artist = tags.artist;
                    song.album = tags.album;
                    song.artwork_url = tags.artwork_url;
                    repairedCount++;
                    this.render();
                }
            } catch (e) {
                console.error("Error al re-escanear pista:", song.filename, e);
            }
        }
        
        this.notify(`¡Escaneo finalizado! ${repairedCount} pistas reparadas.`, "info");
    }

    readMetadata(file) {
        return new Promise((resolve) => {
            console.log(`🔎 XLR8 METADATA: Analizando [${file.name}]...`);
            
            if (!window.jsmediatags) {
                console.error("❌ XLR8 METADATA: Librería jsmediatags no disponible en el DOM.");
                return resolve({
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    artist: "Artista Desconocido",
                    album: "XLR8 Reborn",
                    artwork_url: ""
                });
            }

            window.jsmediatags.read(file, {
                onSuccess: (tag) => {
                    console.log(`✅ XLR8 METADATA: Datos extraídos para [${file.name}]`, tag.tags);
                    const { title, artist, album, picture } = tag.tags;
                    let artwork_url = "";
                    
                    if (picture) {
                        try {
                            const { data, format } = picture;
                            let base64String = "";
                            const chunkSize = 8192;
                            for (let i = 0; i < data.length; i += chunkSize) {
                                base64String += String.fromCharCode.apply(null, data.slice(i, i + chunkSize));
                            }
                            artwork_url = `data:${format};base64,${window.btoa(base64String)}`;
                        } catch (e) {
                            console.warn("⚠️ XLR8 METADATA: Error procesando portada:", e);
                        }
                    }

                    resolve({
                        title: title || file.name.replace(/\.[^/.]+$/, ""),
                        artist: artist || "Artista Desconocido",
                        album: album || (artist ? "Single" : "Álbum Desconocido"),
                        artwork_url: artwork_url
                    });
                },
                onError: (error) => {
                    console.warn(`⚠️ XLR8 METADATA: El archivo [${file.name}] no contiene etiquetas ID3 legibles.`, error);
                    resolve({
                        title: file.name.replace(/\.[^/.]+$/, ""),
                        artist: "Artista Desconocido",
                        album: "Archivo Local",
                        artwork_url: ""
                    });
                }
            });
        });
    }

    getAudioDuration(url) {
        return new Promise((resolve) => {
            const tempAudio = new Audio(url);
            tempAudio.addEventListener('loadedmetadata', () => {
                resolve(tempAudio.duration);
            });
            tempAudio.addEventListener('error', () => {
                resolve(0); // Error de lectura
            });
        });
    }

    getDominantColor(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 1, 1);
                const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                resolve(`rgb(${r}, ${g}, ${b})`);
            };
            img.onerror = () => resolve('#18181b'); // Color fallback
            img.src = src;
        });
    }
}

window.xlr8 = new Player();
