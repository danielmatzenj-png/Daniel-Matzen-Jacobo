# Configura el backend llamacpp (sin Ollama).
# Uso: .\scripts\setup_llamacpp.ps1
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $Root ".venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
    Write-Error "Entorno virtual no encontrado. Ejecuta primero: .\scripts\install.ps1"
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Jarvis — backend llamacpp (sin Ollama)" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# 1. Instalar llama-cpp-python
Write-Host ""
Write-Host "[1/2] Instalando llama-cpp-python..." -ForegroundColor Yellow

# Intenta instalar rueda precompilada (CPU); si falla, compila desde fuente
try {
    & $Python -m pip install llama-cpp-python --quiet
    Write-Host "      OK" -ForegroundColor Green
} catch {
    Write-Warning "Instalacion con rueda precompilada fallo. Intentando compilar desde fuente..."
    Write-Warning "Esto puede tardar varios minutos y requiere Visual C++ Build Tools."
    & $Python -m pip install llama-cpp-python
}

# 2. Descargar modelo GGUF
Write-Host ""
Write-Host "[2/2] Descargando modelo GGUF..." -ForegroundColor Yellow
& $Python (Join-Path $Root "scripts\download_model.py")

Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host "  Listo. Inicia Jarvis con:" -ForegroundColor Green
Write-Host "    .\scripts\run.ps1 --text" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Green
