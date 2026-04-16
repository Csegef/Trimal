@echo off
setlocal enabledelayedexpansion

:: ============================================================
::  TRIMAL SETUP
:: ============================================================
echo.
echo  =========================================
echo   TRIMAL - Setup
echo  =========================================
echo.

:: --- 1. Frontend symlink ---
echo [1/2] Setting up frontend symlinks...
echo.

set "SCRIPT_DIR=%~dp0"
set "FRONTEND_DIR=%SCRIPT_DIR%frontend"

if not exist "%FRONTEND_DIR%\package.json" (
    echo ERROR: frontend mappa nem talalhato: %FRONTEND_DIR%
    goto :error
)

pushd "%FRONTEND_DIR%"
call "%SCRIPT_DIR%frontend\setup-symlinks.bat"
popd

:: --- 2. Backend PHP fajlok masolasa XAMPP-ba ---
echo.
echo [2/2] Backend PHP fajlok masolasa XAMPP htdocs\trimal mappaba...
echo.

:: XAMPP keresese
set "XAMPP_PATH="
for %%D in (C D E F G) do (
    if exist "%%D:\xampp\htdocs" (
        set "XAMPP_PATH=%%D:\xampp\htdocs"
        goto :found_xampp
    )
)

echo ERROR: XAMPP htdocs nem talalhato! Telepitsd a XAMPP-ot, vagy add meg kezzel.
goto :error

:found_xampp
echo XAMPP htdocs: %XAMPP_PATH%

set "TARGET_DIR=%XAMPP_PATH%\trimal"

:: trimal mappa letrehozasa ha nincs
if not exist "%TARGET_DIR%" (
    echo Letrehozom: %TARGET_DIR%
    mkdir "%TARGET_DIR%"
)

:: Backend/test_phps tartalmanak masolasa
set "SOURCE_DIR=%SCRIPT_DIR%backend\test-phps"

if not exist "%SOURCE_DIR%" (
    echo ERROR: backend\test_phps mappa nem talalhato: %SOURCE_DIR%
    goto :error
)

echo Masolas: %SOURCE_DIR% -> %TARGET_DIR%
xcopy "%SOURCE_DIR%\*" "%TARGET_DIR%\" /E /Y /I /Q

if %errorlevel% equ 0 (
    echo.
    echo  =========================================
    echo   SETUP KESZ! Minden sikeresen beallitva.
    echo  =========================================
) else (
    echo ERROR: Masolas sikertelen!
    goto :error
)

goto :end

:error
echo.
echo  =========================================
echo   HIBA tortent! Ellenorizd a fenti uzeneteket.
echo  =========================================

:end
echo.
pause
endlocal
