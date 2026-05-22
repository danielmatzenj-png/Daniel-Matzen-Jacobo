# Instalador para Windows (PowerShell 5.1+).
# Uso: .\scripts\install.ps1
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

# -------------------------------------------------------------------------- #
# 1. Verificar Python 3.10+
# -------------------------------------------------------------------------- #
Write-Host "[jarvis] Verificando Python..." -ForegroundColor Cyan
$PyCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $PyCmd) {
    Write-Error "Python no encontrado. Instálalo desde https://www.python.org/downloads/ (marca 'Add to PATH')."
}
$PyVer = & python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"
if ([version]$PyVer -lt [version]"3.10") {
    Write-Error "Se requiere Python 3.10 o superior. Version encontrada: $PyVer"
}
Write-Host "    Python $PyVer OK" -ForegroundColor Green

# -------------------------------------------------------------------------- #
# 2. Verificar / instalar ffmpeg (via winget, silencioso si ya existe)
# -------------------------------------------------------------------------- #
Write-Host "[jarvis] Verificando ffmpeg..." -ForegroundColor Cyan
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "    Instalando ffmpeg via winget..." -ForegroundColor Yellow
        winget install --id Gyan.FFmpeg -e --silent --accept-package-agreements --accept-source-agreements
        # Refresca PATH en la sesión actual
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" +
                    [System.Environment]::GetEnvironmentVariable("Path","User")
    } else {
        Write-Warning "ffmpeg no encontrado y winget no disponible. Instálalo manualmente desde https://ffmpeg.org/download.html y añádelo al PATH."
    }
} else {
    Write-Host "    ffmpeg OK" -ForegroundColor Green
}

# -------------------------------------------------------------------------- #
# 3. Crear entorno virtual
# -------------------------------------------------------------------------- #
Write-Host "[jarvis] Creando entorno virtual..." -ForegroundColor Cyan
if (Test-Path ".venv") {
    Write-Host "    .venv ya existe, omitiendo creación." -ForegroundColor DarkGray
} else {
    python -m venv .venv
}
$Activate = Join-Path $Root ".venv\Scripts\Activate.ps1"
. $Activate

# -------------------------------------------------------------------------- #
# 4. Instalar dependencias Python
# -------------------------------------------------------------------------- #
Write-Host "[jarvis] Actualizando pip..." -ForegroundColor Cyan
python -m pip install --upgrade pip wheel --quiet

Write-Host "[jarvis] Instalando dependencias Python..." -ForegroundColor Cyan
pip install -r requirements.txt

# -------------------------------------------------------------------------- #
# 5. Verificar Ollama
# -------------------------------------------------------------------------- #
Write-Host ""
Write-Host "[jarvis] Verificando Ollama..." -ForegroundColor Cyan
if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Warning "Ollama no está instalado."
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        $resp = Read-Host "    ¿Instalar Ollama via winget? [s/N]"
        if ($resp -in @("s","S","si","Si","SI","y","Y")) {
            winget install --id Ollama.Ollama -e --silent --accept-package-agreements --accept-source-agreements
            Write-Host "    Ollama instalado. Reinicia PowerShell si 'ollama' no es reconocido." -ForegroundColor Yellow
        }
    } else {
        Write-Host "    Descárgalo desde https://ollama.com/download" -ForegroundColor Yellow
    }
} else {
    Write-Host "    Ollama OK" -ForegroundColor Green
}

# -------------------------------------------------------------------------- #
# 6. Descargar modelo LLM
# -------------------------------------------------------------------------- #
if (Get-Command ollama -ErrorAction SilentlyContinue) {
    Write-Host "[jarvis] Verificando modelo llama3.1..." -ForegroundColor Cyan
    $models = & ollama list 2>&1
    if ($models -notmatch "llama3.1") {
        $resp = Read-Host "    El modelo llama3.1 no está descargado. ¿Descargarlo ahora? (~4 GB) [s/N]"
        if ($resp -in @("s","S","si","Si","SI","y","Y")) {
            ollama pull llama3.1
        } else {
            Write-Warning "Recuerda ejecutar 'ollama pull llama3.1' antes de usar Jarvis."
        }
    } else {
        Write-Host "    llama3.1 OK" -ForegroundColor Green
    }
}

# -------------------------------------------------------------------------- #
# Resumen
# -------------------------------------------------------------------------- #
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Instalacion completada." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Para iniciar Jarvis:" -ForegroundColor White
Write-Host "  Modo voz:  .\scripts\run.ps1" -ForegroundColor Cyan
Write-Host "  Modo texto: .\scripts\run.ps1 --text" -ForegroundColor Cyan
Write-Host ""
Write-Host "O manualmente:"
Write-Host "  .\.venv\Scripts\Activate.ps1"
Write-Host "  python -m jarvis"
