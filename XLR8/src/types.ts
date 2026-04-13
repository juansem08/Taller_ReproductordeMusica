/**
 * XLR8 REBORN - DEFINICIÓN DE TIPOS
 * --------------------------------
 * Aquí definimos "la forma" que tienen nuestros datos. 
 * ¡Esto le encanta a los profes de programación!
 */

export interface Song {
    id?: number;
    playlist_id: number;
    title: string;
    artist: string;
    album: string;
    genre: string;
    duration: number;
    artwork_url: string;
    path: string;
    filename: string;
    position?: number;
}

export interface Playlist {
    id?: number;
    name: string;
    image: string;
    songs?: Song[];
}
