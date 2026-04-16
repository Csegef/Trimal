@echo off
echo Creating symlink for design assets...
echo.
echo Current directory: %cd%
echo.
:: Ellenőrizd, hogy a frontend mappában vagyunk-e
if not exist "package.json" (
    echo ERROR: Not in frontend folder!
    echo Please run from: Trimal - vizsgamunka\trimal_react\frontend
    exit /b 1
)
:: Admin check
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Not running as Administrator.
    echo Symlink might fail, continuing anyway...
    echo.
)
:: Törlés és létrehozás
if exist "src\assets\design" (
    echo Removing old...
    rmdir "src\assets\design" 2>nul
    del "src\assets\design" 2>nul
)
echo Creating symlink...
mklink /J "src\assets\design" "..\..\Graphics"
if exist "src\assets\design" (
    echo SUCCESS! Symlink created.
    echo.
    echo Use in code: import img from './assets/design/filename.png'
) else (
    echo FAILED! Try:
    echo   1. Run as Administrator
    echo   2. Or copy manually: mkdir src/assets/design ^&^& xcopy ..\..\Graphics\* src/assets\design\ /E
)
