# Lanzador rapido de Jarvis para PowerShell.
# Uso: .\scripts\run.ps1 [--text] [--once]
param([Parameter(ValueFromRemainingArguments)][string[]]$ExtraArgs)

$Root = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $Root ".venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
    Write-Error "[jarvis] Entorno virtual no encontrado. Ejecuta primero: .\scripts\install.ps1"
    exit 1
}

& $Python -m jarvis @ExtraArgs
