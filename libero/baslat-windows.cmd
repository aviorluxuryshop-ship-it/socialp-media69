@echo off
setlocal
cd /d "%~dp0"
title Libero Futbol Akademisi

where node >nul 2>nul
if errorlevel 1 goto nonode

node "%~dp0scripts\baslat.mjs" %*
if errorlevel 1 goto hata
goto :eof

:nonode
echo.
echo  Node.js bulunamadi. Libero icin Node.js 20 veya uzeri gerekli.
echo.
echo  1. https://nodejs.org adresinden LTS surumunu indirip kurun
echo     ya da bir terminalde su komutu calistirin:  winget install OpenJS.NodeJS.LTS
echo  2. Kurulum bitince bu dosyayi tekrar cift tiklayin.
echo.
pause
exit /b 1

:hata
echo.
echo  Bir sorun olustu. Yukaridaki mesajlari okuyun.
echo  Sorun surerse klasoru kisa bir yola (ornek: C:\libero) tasiyip tekrar deneyin.
echo.
pause
exit /b 1
