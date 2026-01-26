# setup-symlinks.ps1 - FIXED for "Trimal - vizsgamunka"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TRIMAL - VIZSGAMUNKA - SYMLINK SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# VÁLTOZÓK - ITT ÁLLÍTSD ÁT!
$projectFolder = "Trimal - vizsgamunka"
$frontendPath = "trimal_react\frontend"
$graphicsFolder = "Graphics"

# Ellenőrizd admin jogot
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "ERROR: Please run PowerShell as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell -> Run as administrator" -ForegroundColor Yellow
    pause
    exit
}

# Teljes útvonalak
$currentDir = Get-Location
$projectRoot = Join-Path $currentDir $projectFolder
$fullFrontendPath = Join-Path $projectRoot $frontendPath
$fullGraphicsPath = Join-Path $projectRoot $graphicsFolder
$designLink = Join-Path $fullFrontendPath "src\assets\design"

# Ellenőrizd a mappákat
Write-Host "Checking paths..." -ForegroundColor Gray
Write-Host "Project root: $projectRoot" -ForegroundColor Gray
Write-Host "Frontend: $fullFrontendPath" -ForegroundColor Gray
Write-Host "Graphics: $fullGraphicsPath" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path $projectRoot)) {
    Write-Host "ERROR: Project folder not found!" -ForegroundColor Red
    Write-Host "Expected: $projectRoot" -ForegroundColor Yellow
    Write-Host "Current: $currentDir" -ForegroundColor Gray
    dir
    pause
    exit
}

if (-not (Test-Path $fullFrontendPath)) {
    Write-Host "ERROR: Frontend folder not found!" -ForegroundColor Red
    Write-Host "Expected: $fullFrontendPath" -ForegroundColor Yellow
    pause
    exit
}

if (-not (Test-Path $fullGraphicsPath)) {
    Write-Host "ERROR: Graphics folder not found!" -ForegroundColor Red
    Write-Host "Expected: $fullGraphicsPath" -ForegroundColor Yellow
    pause
    exit
}

# Töröld a régit
if (Test-Path $designLink) {
    Write-Host "Removing old symlink..." -ForegroundColor Yellow
    Remove-Item -Path $designLink -Force -Recurse -ErrorAction SilentlyContinue
}

# Készítsd az újat
Write-Host "Creating symlink..." -ForegroundColor Green
try {
    # A szóköz miatt idézőjelek kellenek!
    $targetPath = "..\..\$graphicsFolder"
    Write-Host "Link: $designLink" -ForegroundColor Gray
    Write-Host "Target: $targetPath" -ForegroundColor Gray
    
    New-Item -ItemType Junction -Path $designLink -Target $targetPath -Force
    Write-Host "✅ Symlink created successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create symlink: $_" -ForegroundColor Red
    Write-Host "Copying files instead..." -ForegroundColor Yellow
    
    # Másolás fallback
    if (-not (Test-Path $designLink)) {
        New-Item -ItemType Directory -Path $designLink -Force
    }
    Copy-Item -Path "$fullGraphicsPath\*" -Destination $designLink -Recurse -Force
    
    Write-Host "✅ Files copied (not symlinked)" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DONE! Design assets are now available at:" -ForegroundColor Cyan
Write-Host "  $projectFolder\$frontendPath\src\assets\design\" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
pause