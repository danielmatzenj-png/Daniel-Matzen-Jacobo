# Instalador para Windows (PowerShell).
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "[jarvis] Creando entorno virtual..."
python -m venv .venv
.\.venv\Scripts\Activate.ps1

Write-Host "[jarvis] Actualizando pip..."
python -m pip install --upgrade pip wheel

Write-Host "[jarvis] Instalando dependencias Python..."
pip install -r requirements.txt

if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Warning "Ollama no está instalado. Descárgalo desde https://ollama.com/download y ejecuta 'ollama pull llama3.1'."
}

Write-Host ""
Write-Host "[jarvis] Listo. Ejecuta:"
Write-Host "    .\.venv\Scripts\Activate.ps1"
Write-Host "    python -m jarvis.main"
