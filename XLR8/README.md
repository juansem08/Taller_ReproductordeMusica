# ⚡ XLR8 REBORN | Premium Desktop Music Player

![XLR8 Cover](https://img.shields.io/badge/Status-100%25_Premium-brightgreen?style=for-the-badge) ![Version](https://img.shields.io/badge/Version-1.9.1_Senior-blue?style=for-the-badge) 

**XLR8 Reborn** es un reproductor de música de grado industrial, diseñado para ofrecer una experiencia estética (Glassmorphism & Neumorfismo) de primera categoría junto con una persistencia de datos tipo "Caja Fuerte". 

Esta aplicación combina tecnologías modernas de Frontend (Canvas, DnD, Extractores ID3) con un Backend nativo, standalone y no destructivo en Node.js + SQLite.

---

## 🏆 ¿Qué construimos en esta versión?

Tras múltiples iteraciones y refactorizaciones profundas para eliminar la pérdida de datos y mejorar la experiencia de usuario, hemos alcanzado la **Versión 1.9.1 (Full Premium)**.

### Características Principales:

1. 🔒 **Blindaje de Persistencia Total (Modo Aditivo)**
   - El motor base ya NO borra carpetas ni reinicia bases de datos al encender. Las canciones y listas creadas se guardan en la base local `xlr8_reborn.db` y se conservan de forma inmutable frente a cierres forzados o recargas de página.

2. 💎 **Identidad Maestra (ID3 Tags Auto-Scanning)**
   - Integración local de `jsmediatags` sin dependencias externas (adiós a los bloqueos CORS del navegador). Extrae automáticamente de los MP3 el **Título Real, Artista, Álbum y la Carátula**.
   - Incluye una función de emergencia (Icono mágico: Reparar Metadatos) para re-escanear audios "huérfanos" y devolverles su identidad.

3. 🎬 **Modo Cine (Extracción Dinámica de Color)**
   - Un botón de expansión inmersivo ("Pantalla Competa").
   - El motor incluye un algoritmo embebido (`Canvas 2D`) que **absorbe el color dominante de la portada de la canción actual** y lo inyecta como un brillo radial dinámico en el fondo del reproductor.

4. 🔄 **Reorganización (Drag & Drop con API Rest)**
   - Puedes arrastrar físicamente cualquier canción de la tabla para cambiar su posición.
   - El frontend calcula el nuevo índice y dispara una petición asíncrona (`PUT /api/playlists/:id/reorder`) para que el backend guarde tu orden en disco al milisegundo.

5. 🎨 **Temas Integrados y Precisión de Tiempo**
   - Lectura perfecta de segundos y minutos (creando un "oyente fantasma" `Audio` durante la importación).
   - Modal de paletas de alta definición: *Original Dark, Deep Blue, Sunset Ember y Forest Glass*.

---

## 🚀 Cómo iniciar el Servidor (Códigos)

El proyecto entero ha sido compilado en **un solo motor blindado** (`servidor_reborn.js`). Para encender tu reproductor tienes dos opciones principales:

### Opción 1: Encendido Directo por Terminal (Recomendado para Devs)

Abre cualquier terminal (PowerShell, CMD, Git Bash) en la raíz del proyecto (`C:\Users\lilie\Downloads\XLR8`) y ejecuta:

```bash
# Iniciar el motor en modo Standalone
node servidor_reborn.js
```

Después de ver el mensaje de consola `🚀 XLR8 REBORN [ENGINE v1.9.1 - FULL PREMIUM]`, abre tu navegador y dirígete a:
👉 **[http://localhost:5174](http://localhost:5174)**

### Opción 2: Encendido Automático One-Click

Si solo quieres escuchar música sin tocar la terminal, puedes usar el script de automatización general que construimos:

1. Ve a la carpeta del proyecto.
2. Haz doble clic en el archivo **`Iniciar_XLR8.bat`**.
3. *Este script se encarga de matar cualquier servidor viejo, reiniciar el motor y abrir el navegador web mágicamente por ti.*

---

## 📂 Archivos Críticos de la Arquitectura

- **`servidor_reborn.js`**: El cerebro absoluto (Backend). Contiene Express, SQLite y las API endpoints (GET, POST, PUT, DELETE).
- **`public/app.js`**: El centro nervioso (Frontend). Controla la reproducción `Audio`, las listas dinámicas, extracción de metadatos, color thief y animaciones.
- **`public/style.css`**: Las reglas estéticas de alta definición (variables HSL, animaciones fluídas, degradados).
- **`xlr8_reborn.db`**: La bóveda de datos física de SQLite. ¡No borrar si se quieren conservar las canciones!
- **`uploads/`**: Directorio donde se guardan las copias físicas inmutables de los audios.

---
*Diseñado bajo la filosofía "Non-Destructive Data" y "Wow-Interface" por Antigravity. 2026.*
