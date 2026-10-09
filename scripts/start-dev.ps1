# start-dev.ps1 — Lance MySQL (XAMPP) + serveur Next.js
# Usage : clic droit > "Exécuter avec PowerShell"

$MySQLBin   = "C:\xampp\mysql\bin"
$MySQLConf  = "$MySQLBin\my.ini"
$MySQLExe   = "$MySQLBin\mysqld.exe"
$MySQLCli   = "$MySQLBin\mysql.exe"
$ProjectDir = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ZEYNARMARKET — Démarrage" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ── 1. Vérifier si MySQL tourne déjà ──────────────────────────────────────
$mysqlRunning = $null
try {
    $result = & $MySQLCli -u root -e "SELECT 1;" 2>&1
    $mysqlRunning = $result -notmatch "ERROR 2002"
} catch {}

if ($mysqlRunning) {
    Write-Host "[OK] MySQL déjà en cours d'exécution" -ForegroundColor Green
} else {
    Write-Host "[...] Démarrage de MySQL..." -ForegroundColor Yellow
    Start-Process -FilePath $MySQLExe -ArgumentList "--defaults-file=$MySQLConf" -WindowStyle Hidden
    Start-Sleep -Seconds 5

    # Vérification
    $check = & $MySQLCli -u root -e "SELECT 'OK';" 2>&1
    if ($check -match "OK") {
        Write-Host "[OK] MySQL démarré avec succès" -ForegroundColor Green
    } else {
        Write-Host "[ERREUR] MySQL n'a pas pu démarrer !" -ForegroundColor Red
        Write-Host $check
        Read-Host "Appuyez sur Entrée pour quitter"
        exit 1
    }
}

# ── 2. Lancer Next.js ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "[...] Lancement du serveur Next.js sur http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Set-Location $ProjectDir
npm run dev
