@echo off
title XLR8 REBORN - PROFESIONAL [FINAL STANDALONE]
echo ===================================================
echo   INICIANDO XLR8 REBORN [MODO PRODUCCION]
echo ===================================================
echo   Verificando motor de persistencia...
if not exist servidor_reborn.js (
    echo [ERROR] No se encuentra servidor_reborn.js
    pause
    exit
)

echo   Abriendo navegador en http://localhost:5174...
start http://localhost:5174

echo   Arrancando motor...
node servidor_reborn.js
pause
