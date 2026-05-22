@echo off
REM Lanzador rapido de Jarvis para Windows.
REM Doble clic o ejecuta desde cmd: scripts\run.bat

SET ROOT=%~dp0..
IF NOT EXIST "%ROOT%\.venv\Scripts\python.exe" (
    echo [jarvis] Entorno virtual no encontrado.
    echo         Ejecuta primero: scripts\install.ps1
    pause
    exit /b 1
)

"%ROOT%\.venv\Scripts\python.exe" -m jarvis %*
